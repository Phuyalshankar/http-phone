/**
 * Intercom Audio Relay
 *
 * In-memory ring-buffer that relays raw PCM frames between two extensions.
 *
 * DolphinIntercom.kt (Android) POSTs audio via:
 *   POST /api/intercom/audio/push
 *   Headers: X-Device-Id: <myExt>  X-Target-Id: <partnerExt>
 *   Body: raw PCM bytes  (Content-Type: application/octet-stream)
 *
 * And polls audio via:
 *   GET /api/intercom/audio/pull
 *   Headers: X-Device-Id: <myExt>  X-Target-Id: <partnerExt>
 *   Response: raw PCM bytes (Content-Type: application/octet-stream) or 204 if empty
 *
 * BUG FIX (2026-06-29):
 *   Previous version stored base64 strings and returned JSON { audio, rate }.
 *   DolphinIntercom.kt sends raw bytes (octet-stream) and reads raw bytes directly
 *   into AudioTrack — it never encoded/decoded base64.
 *   Result: server queue was ALWAYS EMPTY (no audio stored), and pull returned
 *   JSON text that AudioTrack played as garbage noise.
 *   Fix: store raw Buffer, return raw bytes on pull. No base64 needed.
 *
 * Buffer key = "<from>:<to>".  Pull reverses the key to get partner's frames.
 */

// Use global to survive hot-module reloads
declare const global: any;
if (!global.__intercomRawQueues) {
    global.__intercomRawQueues = new Map<string, Buffer[]>();
}
const audioQueues: Map<string, Buffer[]> = global.__intercomRawQueues;

// Max frames in queue — 100 × 20ms = 2s buffer max before oldest frames drop
const MAX_QUEUE_FRAMES = 100;
// Max frames to drain per pull — prevents sending stale buildup all at once
const MAX_FRAMES_PER_PULL = 5;

function getQueue(key: string): Buffer[] {
    if (!audioQueues.has(key)) audioQueues.set(key, []);
    return audioQueues.get(key)!;
}

/**
 * Read raw body bytes from ctx, handling three cases:
 *  1. Framework already parsed octet-stream body into ctx.body as a Buffer
 *  2. ctx.body is JSON with { audio: base64 } (legacy fallback)
 *  3. Body stream not yet consumed — read from ctx.req
 */
async function getRawBody(ctx: any): Promise<Buffer> {
    const body = ctx.body;

    // Case 1: Framework gave us a Buffer directly
    if (Buffer.isBuffer(body)) {
        return body;
    }

    // Case 2: Legacy JSON with base64 audio (old client versions)
    if (body && typeof body === 'object' && body.audio) {
        try {
            return Buffer.from(body.audio, 'base64');
        } catch {
            return Buffer.alloc(0);
        }
    }

    // Case 3: Read raw bytes from request stream (octet-stream not parsed by framework)
    const req = ctx.req;
    if (!req) return Buffer.alloc(0);

    return new Promise<Buffer>((resolve) => {
        // Stream already ended — nothing to read
        if (req.readableEnded || req.destroyed) {
            resolve(Buffer.alloc(0));
            return;
        }
        const chunks: Buffer[] = [];
        const onData = (chunk: Buffer) => chunks.push(chunk);
        const onEnd  = () => { cleanup(); resolve(Buffer.concat(chunks)); };
        const onErr  = () => { cleanup(); resolve(Buffer.alloc(0)); };
        const cleanup = () => {
            req.removeListener('data', onData);
            req.removeListener('end',  onEnd);
            req.removeListener('error', onErr);
        };
        req.on('data',  onData);
        req.on('end',   onEnd);
        req.on('error', onErr);
    });
}

export async function pushAudio(ctx: any) {
    const headers = ctx.req?.headers || ctx.headers || {};
    const from = (headers['x-device-id'] || '').toString().trim();
    const to   = (headers['x-target-id'] || '').toString().trim();

    if (!from || !to) {
        ctx.status(400).json({ error: 'Missing X-Device-Id or X-Target-Id headers' });
        return;
    }

    const pcm = await getRawBody(ctx);

    if (pcm.length > 0) {
        const queue = getQueue(`${from}:${to}`);
        queue.push(pcm);
        // Drop oldest frame when buffer is full to prevent memory growth
        if (queue.length > MAX_QUEUE_FRAMES) queue.shift();
    }

    ctx.res.statusCode = 204;
    ctx.res.end();
}

export async function pullAudio(ctx: any) {
    const headers = ctx.req?.headers || ctx.headers || {};
    const me     = (headers['x-device-id'] || '').toString().trim();
    const target = (headers['x-target-id'] || '').toString().trim();

    if (!me || !target) {
        ctx.status(400).json({ error: 'Missing X-Device-Id or X-Target-Id headers' });
        return;
    }

    const queueKey = `${target}:${me}`;
    const queue = getQueue(queueKey);

    if (queue.length === 0) {
        ctx.res.statusCode = 204;
        ctx.res.end();
        return;
    }

    // Drain a bounded number of frames — prevents replaying stale audio buildup
    const frames = queue.splice(0, Math.min(queue.length, MAX_FRAMES_PER_PULL));
    const combined = Buffer.concat(frames);

    // Return raw PCM bytes — DolphinIntercom.kt writes directly to AudioTrack
    ctx.res.statusCode = 200;
    ctx.res.setHeader('Content-Type', 'application/octet-stream');
    ctx.res.setHeader('Content-Length', combined.length);
    ctx.res.end(combined);
}
