/**
 * Intercom Audio Relay
 *
 * In-memory ring-buffer that relays raw PCM frames (base64-encoded) between two extensions.
 *
 * DolphinIntercom.kt (Android) POSTs audio via:
 *   POST /api/intercom/audio/push
 *   Headers: X-Device-Id: <myExt>  X-Target-Id: <partnerExt>
 *   Body: JSON { audio: "<base64 PCM>", rate: 8000 }
 *
 * And polls audio via:
 *   GET /api/intercom/audio/pull
 *   Headers: X-Device-Id: <myExt>  X-Target-Id: <partnerExt>
 *   Response: JSON { audio: "<base64 PCM>", rate: 8000 } or 204 if empty
 *
 * Buffer key = "<from>:<to>".  Pull reverses the key to get partner's frames.
 */

interface AudioFrame {
    audio: string; // base64 PCM
    rate: number;
}

// Use global to survive tsx hot-module reloads
declare const global: any;
if (!global.__intercomAudioQueues) {
    global.__intercomAudioQueues = new Map<string, AudioFrame[]>();
}
const audioQueues: Map<string, AudioFrame[]> = global.__intercomAudioQueues;

const MAX_QUEUE_FRAMES = 100;

function getQueue(key: string): AudioFrame[] {
    if (!audioQueues.has(key)) audioQueues.set(key, []);
    return audioQueues.get(key)!;
}

export async function pushAudio(ctx: any) {
    // Dolphin server.ts parses body into ctx.body before calling handler
    const headers = ctx.req?.headers || ctx.headers || {};
    const from = (headers['x-device-id'] || '').toString().trim();
    const to   = (headers['x-target-id'] || '').toString().trim();

    console.log(`[Intercom] PUSH from=${from} to=${to} body=${JSON.stringify(ctx.body).slice(0, 100)}`);

    if (!from || !to) {
        // Use Dolphin's ctx.status().json() pattern
        ctx.status(400).json({ error: 'Missing X-Device-Id or X-Target-Id headers' });
        return;
    }

    const body = ctx.body;
    const audioB64 = (typeof body === 'object' ? body?.audio || body?.data : '') || '';
    const rate = (typeof body === 'object' ? body?.rate : undefined) || 8000;

    console.log(`[Intercom] PUSH audioLen=${audioB64.length} rate=${rate}`);

    if (audioB64) {
        const queue = getQueue(`${from}:${to}`);
        queue.push({ audio: audioB64, rate });
        if (queue.length > MAX_QUEUE_FRAMES) queue.shift();
        console.log(`[Intercom] Queue ${from}:${to} => ${queue.length} frames`);
    }

    // Send 204 No Content — use raw res to avoid Dolphin auto-JSON wrapping
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

    console.log(`[Intercom] PULL me=${me} target=${target} queue(${queueKey})=${queue.length} frames`);

    if (queue.length === 0) {
        ctx.res.statusCode = 204;
        ctx.res.end();
        return;
    }

    const frames = queue.splice(0, queue.length);
    const rate = frames[frames.length - 1]?.rate || 8000;
    const allAudio = frames.map(f => f.audio).join('');

    const payload = JSON.stringify({ audio: allAudio, rate });

    ctx.res.statusCode = 200;
    ctx.res.setHeader('Content-Type', 'application/json');
    ctx.res.setHeader('Content-Length', Buffer.byteLength(payload));
    ctx.res.end(payload);
}
