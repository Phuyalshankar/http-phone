/**
 * Intercom Audio Relay
 *
 * In-memory ring-buffer that relays raw PCM frames between two extensions.
 *
 * DolphinIntercom.kt (Android) POSTs audio via:
 *   POST /api/intercom/audio/push
 *   Headers: X-Device-Id: <myExt>  X-Target-Id: <partnerExt>
 *   Body: raw PCM bytes (Content-Type: application/octet-stream)
 *
 * And polls audio via:
 *   GET /api/intercom/audio/pull
 *   Headers: X-Device-Id: <myExt>  X-Target-Id: <partnerExt>
 *   Response: raw PCM bytes from partner's push buffer
 *
 * Buffer key = "<from>:<to>".  Pull reverses the key to get partner's frames.
 */

const audioQueues = new Map<string, Buffer[]>();
const MAX_QUEUE_FRAMES = 150; // ~3 seconds of 20ms frames at 16kHz

function getQueue(key: string): Buffer[] {
    if (!audioQueues.has(key)) audioQueues.set(key, []);
    return audioQueues.get(key)!;
}

function readRawBody(req: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

export async function pushAudio(ctx: any) {
    const from = (ctx.req?.headers?.['x-device-id'] || ctx.headers?.['x-device-id'] || '').toString();
    const to   = (ctx.req?.headers?.['x-target-id'] || ctx.headers?.['x-target-id'] || '').toString();

    if (!from || !to) {
        ctx.status(400);
        return { error: 'Missing X-Device-Id or X-Target-Id headers' };
    }

    try {
        const rawReq = ctx.req || ctx;
        const pcm = await readRawBody(rawReq);

        if (pcm.length > 0) {
            const queue = getQueue(`${from}:${to}`);
            queue.push(pcm);
            if (queue.length > MAX_QUEUE_FRAMES) queue.shift();
        }
    } catch (e: any) {
        ctx.status(500);
        return { error: e.message };
    }

    ctx.status(204);
    return null;
}

export async function pullAudio(ctx: any) {
    const me     = (ctx.req?.headers?.['x-device-id'] || ctx.headers?.['x-device-id'] || '').toString();
    const target = (ctx.req?.headers?.['x-target-id'] || ctx.headers?.['x-target-id'] || '').toString();

    if (!me || !target) {
        ctx.status(400);
        return { error: 'Missing X-Device-Id or X-Target-Id headers' };
    }

    const queue = getQueue(`${target}:${me}`);

    if (queue.length === 0) {
        ctx.status(204);
        return null;
    }

    const frames: Buffer[] = [];
    while (queue.length > 0) frames.push(queue.shift()!);
    const pcm = Buffer.concat(frames);

    const res = ctx.res || ctx;
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', String(pcm.length));
    res.statusCode = 200;
    res.end(pcm);
    return null;
}
