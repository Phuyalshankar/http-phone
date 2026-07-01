/**
 * Intercom Audio Relay
 *
 * In-memory ring-buffer that relays PCM audio frames between two extensions.
 *
 * DolphinIntercom.kt (Android) POSTs audio via:
 *   POST /api/intercom/audio/push
 *   Headers: X-Device-Id: <myExt>  X-Target-Id: <partnerExt>
 *   Body: JSON { audio: "<base64 PCM>", rate: 16000 }
 *
 * And polls audio via:
 *   GET /api/intercom/audio/pull
 *   Headers: X-Device-Id: <myExt>  X-Target-Id: <partnerExt>
 *   Response: raw PCM bytes (application/octet-stream) or 204 if empty
 *
 * WHY JSON push / raw pull (2026-06-29):
 *   The Dolphin server framework (dolphin-server-modules/server.ts) consumed the request
 *   body with Buffer.concat(chunks).toString() BEFORE our handler ran, which silently
 *   corrupted binary PCM bytes into a garbled string.  Sending JSON/base64 from Kotlin
 *   lets the framework's JSON parser deliver a clean ctx.body.audio string.
 *   On pull we return raw bytes directly — AudioTrack.write() needs raw PCM, no JSON wrapper.
 *
 * Buffer key = "<from>:<to>".  Pull reverses the key to get partner's frames.
 */

// Use global to survive hot-module reloads
declare const global: any;
if (!global.__intercomRawQueues) {
    global.__intercomRawQueues = new Map<string, Buffer[]>();
}
const audioQueues: Map<string, Buffer[]> = global.__intercomRawQueues;

const MAX_QUEUE_FRAMES  = 100; // 100 × 20 ms = 2 s max backlog before oldest drops
const MAX_FRAMES_PER_PULL = 5; // drain ≤5 frames per pull to avoid stale-audio dump

function getQueue(key: string): Buffer[] {
    if (!audioQueues.has(key)) audioQueues.set(key, []);
    return audioQueues.get(key)!;
}

let lastPushLog = 0;
let lastPullLog = 0;

export async function pushAudio(ctx: any) {
    const headers = ctx.req?.headers || ctx.headers || {};
    const from = (headers['x-device-id'] || '').toString().trim();
    const to   = (headers['x-target-id'] || '').toString().trim();

    if (!from || !to) {
        ctx.status(400).json({ error: 'Missing X-Device-Id or X-Target-Id headers' });
        return;
    }

    const now = Date.now();
    if (now - lastPushLog > 5000) {
        console.log(`🎙️ [Intercom Server] pushAudio received packet from ${from} to ${to}`);
        lastPushLog = now;
    }

    const body = ctx.body;
    let pcm: Buffer | null = null;

    // Primary path: JSON { audio: base64, rate: N } — sent by DolphinIntercom.kt
    if (body && typeof body === 'object' && body.audio) {
        try { pcm = Buffer.from(body.audio, 'base64'); } catch {}
    }
    // Fallback: dolphin-server-modules (fixed) preserves Buffer for octet-stream bodies
    else if (Buffer.isBuffer(body)) {
        pcm = body;
    }

    if (pcm && pcm.length > 0) {
        const queue = getQueue(`${from}:${to}`);
        queue.push(pcm);
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

    const now = Date.now();
    if (now - lastPullLog > 5000) {
        console.log(`📡 [Intercom Server] pullAudio polling from ${me} for target ${target}`);
        lastPullLog = now;
    }

    const queueKey = `${target}:${me}`;
    const queue    = getQueue(queueKey);

    if (queue.length === 0) {
        ctx.res.statusCode = 204;
        ctx.res.end();
        return;
    }

    // Drain a bounded number of frames to avoid replaying stale audio buildup
    const frames   = queue.splice(0, Math.min(queue.length, MAX_FRAMES_PER_PULL));
    const combined = Buffer.concat(frames);

    // Return raw PCM bytes — DolphinIntercom.kt writes directly to AudioTrack.write()
    ctx.res.statusCode = 200;
    ctx.res.setHeader('Content-Type', 'application/octet-stream');
    ctx.res.setHeader('Content-Length', combined.length);
    ctx.res.end(combined);
}
