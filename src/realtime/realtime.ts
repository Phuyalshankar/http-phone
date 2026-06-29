import { WebSocket } from 'ws';
import { RealtimeCore } from 'dolphin-server-modules/realtime';
import { WebRTCSignalingOrchestrator, generateTurnCredentials } from 'dolphin-server-modules/webrtc';
import { PushNotificationService } from 'dolphin-server-modules/push';
import { authService } from '../controllers/auth.js';
import { Device } from '../models/device.js';
import { User } from '../models/user.js';
import { Message } from '../models/message.js';

// Setup RealtimeCore Bus
export const rt = new RealtimeCore({
  debug: process.env.NODE_ENV !== 'production',
  enableJSONCache: true
});

// Setup WebRTC Signaling Orchestrator for calling
export const signalingOrchestrator = new WebRTCSignalingOrchestrator();

// Setup Push Notification Service
const fcmConfig = process.env.FCM_PROJECT_ID ? {
  projectId: process.env.FCM_PROJECT_ID,
  clientEmail: process.env.FCM_CLIENT_EMAIL || '',
  privateKey: (process.env.FCM_PRIVATE_KEY || '').replace(/\\n/g, '\n')
} : undefined;

const apnsConfig = process.env.APNs_TEAM_ID ? {
  teamId: process.env.APNs_TEAM_ID,
  keyId: process.env.APNs_KEY_ID || '',
  privateKey: (process.env.APNs_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  sandbox: process.env.APNs_SANDBOX === 'true'
} : undefined;

export const pushService = new PushNotificationService({
  fcm: fcmConfig,
  apns: apnsConfig
});

// Utility: Send Push Notification to all devices of a user
export async function sendPushToUser(
  userId: string,
  notification: { title: string; body: string },
  data?: Record<string, string>
) {
  try {
    const devices = await Device.find({ userId, pushToken: { $ne: '' } });
    
    for (const device of devices) {
      if (device.pushToken) {
        if (device.platform === 'ios') {
          // APNs iOS notification
          try {
            await pushService.sendAPNs(device.pushToken, {
              topic: process.env.APNs_TOPIC || 'gov.np.message',
              title: notification.title,
              body: notification.body,
              data
            });
            console.log(`🐬 APNs Push sent successfully to device: ${device.deviceId}`);
          } catch (apnsError: any) {
            console.error(`❌ APNs Push failed for device ${device.deviceId}:`, apnsError.message);
          }
        } else {
          // FCM Android notification
          try {
            await pushService.sendFCM(device.pushToken, notification, data);
            console.log(`🐬 FCM Push sent successfully to device: ${device.deviceId}`);
          } catch (fcmError: any) {
            console.error(`❌ FCM Push failed for device ${device.deviceId}:`, fcmError.message);
          }
        }
      }
    }
  } catch (err: any) {
    console.error('❌ Error sending push notifications:', err.message);
  }
}

// Handler: Setup WebSocket Connections (Multiplexed by URL paths)
export function setupRealtime(wss: any) {
  // We will handle the connection logic inside app.ts upgrade handler.
  // This function sets up connection parameters and handlers.
}

// Core Realtime socket handler (Chat, Presence)
export async function handleRealtimeConnection(ws: WebSocket, token: string, deviceId: string, platform: any) {
  const messageBuffer: any[] = [];
  const tempListener = (data: any) => {
    messageBuffer.push(data);
  };
  ws.on('message', tempListener);

  try {
    // 1. Authenticate WebSocket token
    const decoded = await authService.verifyToken(token);
    const userId = decoded.id;

    // 2. Fetch User Profile
    const user = await User.findById(userId);
    if (!user) {
      ws.off('message', tempListener);
      ws.close(4001, 'User profile not found');
      return;
    }

    // Remove temporary buffering listener
    ws.off('message', tempListener);

    // 3. Register device in Dolphin RealtimeCore
    rt.register(deviceId, ws, {
      userId,
      email: user.email,
      extension: user.extension,
      name: user.name,
      platform
    });

    console.log(`🐬 Socket Connected on /realtime: User ${user.name} (${user.extension}) on ${platform}`);

    // 4. Update Device status in DB to online
    await Device.findOneAndUpdate(
      { deviceId },
      { userId, platform, status: 'online', lastSeen: new Date() },
      { upsert: true, new: true }
    );

    // 5. Broadcast online presence update to everyone
    rt.publish('presence/status', {
      userId,
      extension: user.extension,
      status: 'online',
      timestamp: Date.now()
    });

    // 6. Handle incoming payloads
    ws.on('message', async (data: Buffer) => {
      try {
        // Keep device alive on any incoming message
        rt.touch(deviceId);

        // Parse message for custom socket commands
        const text = data.toString();
        const payload = JSON.parse(text);

        if (payload.type === 'ping') {
          // Respond with pong so client knows the connection is alive
          try { ws.send(JSON.stringify({ type: 'pong' })); } catch(e){}
          rt.touch(deviceId);
          return;
        }

        if (payload.type === 'HEARTBEAT') {
          try { ws.send(JSON.stringify({ type: 'HEARTBEAT_ACK' })); } catch(e){}
          rt.touch(deviceId);
          return;
        }

        if (payload.type === 'typing') {
          // Broadcast typing status to a target conversation or group
          const targetTopic = payload.groupId 
            ? `presence/typing/group/${payload.groupId}`
            : `presence/typing/private/${payload.targetUserId}`;
          
          rt.publish(targetTopic, {
            userId,
            extension: user.extension,
            isTyping: payload.isTyping
          });
        } else if (payload.type === 'pub' && payload.topic) {
          // Client-originated publish — used for audio_stream/* VoIP audio relay
          // Route to all subscribers of this topic via RealtimeCore
          rt.publish(payload.topic, payload.payload);
        } else {
          // Standard pub/sub payload handling (sub, unsub, etc.)
          await rt.handle(data, ws, deviceId);
        }
      } catch (err: any) {
        console.error('WebSocket msg error:', err.message);
      }
    });

    // Handle native WebSocket pong frames (from ws.ping() below)
    ws.on('pong', () => {
      rt.touch(deviceId);
    });

    // Server-side keep-alive: ping client every 20s to detect dead connections
    const serverPingInterval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        try { ws.ping(); } catch(e){}
      } else {
        clearInterval(serverPingInterval);
      }
    }, 20000);

    // 7. Handle disconnect
    ws.on('close', async () => {
      clearInterval(serverPingInterval);
      console.log(`❌ Socket Disconnected from /realtime: Device ${deviceId}`);
      rt.unregister(deviceId);

      // Update Device status in DB to offline
      await Device.findOneAndUpdate({ deviceId }, { status: 'offline', lastSeen: new Date() });

      // Broadcast offline presence update
      rt.publish('presence/status', {
        userId,
        extension: user.extension,
        status: 'offline',
        timestamp: Date.now()
      });
    });

    // Replay the buffered messages to the newly registered listener
    if (messageBuffer.length > 0) {
      console.log(`[Realtime-Buffer] Replaying ${messageBuffer.length} buffered messages for ${user.extension}`);
      for (const rawData of messageBuffer) {
        ws.emit('message', rawData);
      }
    }

  } catch (err: any) {
    ws.off('message', tempListener);
    console.error('❌ WebSocket Auth failed:', err.message);
    ws.close(4000, 'Unauthorized: Invalid token');
  }
}

// WebRTC Signaling socket handler
export async function handleSignalingConnection(ws: WebSocket, token: string) {
  const messageBuffer: any[] = [];
  const tempListener = (data: any) => {
    messageBuffer.push(data);
  };
  ws.on('message', tempListener);

  try {
    // 1. Authenticate WebSocket token
    const decoded = await authService.verifyToken(token);
    const userId = decoded.id;

    // 2. Fetch User Profile to get extension name
    const user = await User.findById(userId);
    if (!user) {
      ws.off('message', tempListener);
      ws.close(4001, 'User profile not found');
      return;
    }

    console.log(`📞 Signaling Socket Connected: User ${user.name} (${user.extension})`);

    // Remove temporary buffering listener
    ws.off('message', tempListener);

    // 3. Delegate connection logic to signaling orchestrator
    // We use user's extension number or userId as the signaling peer identifier
    signalingOrchestrator.handleConnection(user.extension, ws);

    // Replay the buffered messages to the signaling orchestrator
    if (messageBuffer.length > 0) {
      console.log(`[Signaling-Buffer] Replaying ${messageBuffer.length} buffered messages for ${user.extension}`);
      for (const rawData of messageBuffer) {
        ws.emit('message', rawData);
      }
    }

  } catch (err: any) {
    ws.off('message', tempListener);
    console.error('❌ WebSocket Signaling Auth failed:', err.message);
    ws.close(4000, 'Unauthorized: Invalid token');
  }
}

// Controller: Generate Ephemeral TURN credentials
export async function getTurnCredentialsHandler(ctx: any) {
  const userId = ctx.state.user?.id;
  if (!userId) {
    ctx.status(401);
    return { success: false, message: 'Unauthorized' };
  }

  const turnSecret = process.env.TURN_SECRET || 'my_secret_coturn_auth_token_value_here';
  
  try {
    const credentials = generateTurnCredentials(turnSecret, userId, 86400); // 24-hr TTL
    return {
      success: true,
      credentials
    };
  } catch (error: any) {
    ctx.status(500);
    return { success: false, message: error.message };
  }
}
