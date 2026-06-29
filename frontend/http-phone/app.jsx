'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const sessionFilePath = path.join(process.cwd(), '.dolphin-session.json');

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return '127.0.0.1';
}
const LOCAL_IP = getLocalIP();

function saveSession(deviceId, data) {
    if (!deviceId) return;
    try {
        let sessions = {};
        if (fs.existsSync(sessionFilePath)) {
            try {
                sessions = JSON.parse(fs.readFileSync(sessionFilePath, 'utf8'));
            } catch(e){}
        }
        
        let ip = null;
        if (typeof app !== 'undefined' && app.framework && app.framework._devServer && app.framework._devServer.server) {
            const dev = app.framework._devServer.server.getConnectedDevices().find(d => d.id === deviceId);
            if (dev) ip = dev.addr;
        }

        sessions[deviceId] = {
            isLoggedIn: true,
            accessToken: data.accessToken,
            userId: data.user.id,
            userName: data.user.name,
            userExt: data.user.extension,
            ip: ip
        };
        fs.writeFileSync(sessionFilePath, JSON.stringify(sessions, null, 2));
    } catch(e) {
        console.error('[Session] Failed to save session:', e.message);
    }
}

function isTokenExpired(token) {
    if (!token) return true;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return true;
        const payloadDecoded = Buffer.from(parts[1], 'base64').toString('utf8');
        const payload = JSON.parse(payloadDecoded);
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return true;
        }
        return false;
    } catch (e) {
        return true;
    }
}

function loadSession(deviceId) {
    if (!deviceId) return null;
    try {
        if (fs.existsSync(sessionFilePath)) {
            let sessions = JSON.parse(fs.readFileSync(sessionFilePath, 'utf8'));
            
            // Clean up expired sessions from the file
            let changed = false;
            for (const [id, sess] of Object.entries(sessions)) {
                if (isTokenExpired(sess.accessToken)) {
                    console.log(`[Session] Found expired session for deviceId ${id}. Cleaning it up.`);
                    delete sessions[id];
                    changed = true;
                }
            }
            if (changed) {
                fs.writeFileSync(sessionFilePath, JSON.stringify(sessions, null, 2));
            }

            if (sessions[deviceId]) {
                return sessions[deviceId];
            }
            
            let ip = null;
            if (typeof app !== 'undefined' && app.framework && app.framework._devServer && app.framework._devServer.server) {
                const dev = app.framework._devServer.server.getConnectedDevices().find(d => d.id === deviceId);
                if (dev) ip = dev.addr;
            }
            
            if (ip) {
                const matchedSessionEntry = Object.entries(sessions).find(([id, sess]) => sess.ip === ip);
                if (matchedSessionEntry) {
                    const [oldId, sessionData] = matchedSessionEntry;
                    console.log(`[Session] Found existing session for IP ${ip} under old deviceId ${oldId}. Mapping to new deviceId ${deviceId}`);
                    sessions[deviceId] = { ...sessionData };
                    fs.writeFileSync(sessionFilePath, JSON.stringify(sessions, null, 2));
                    return sessionData;
                }
            }
        }
    } catch(e) {
        console.error('[Session] Failed to load session:', e.message);
    }
    return null;
}

function clearSession(deviceId) {
    if (!deviceId) return;
    try {
        if (fs.existsSync(sessionFilePath)) {
            let sessions = {};
            try {
                sessions = JSON.parse(fs.readFileSync(sessionFilePath, 'utf8'));
            } catch(e){}
            
            // Also find the IP or userExt associated with this deviceId
            const targetSession = sessions[deviceId];
            const targetIp = targetSession ? targetSession.ip : null;
            const targetExt = targetSession ? targetSession.userExt : null;

            // Delete sessions matching this deviceId, or having the same IP, or same extension
            for (const [id, sess] of Object.entries(sessions)) {
                if (id === deviceId || (targetIp && sess.ip === targetIp) || (targetExt && sess.userExt === targetExt)) {
                    console.log(`[Session] Clearing session for deviceId ${id} (ext: ${sess.userExt}) on logout/auth failure.`);
                    delete sessions[id];
                }
            }
            
            fs.writeFileSync(sessionFilePath, JSON.stringify(sessions, null, 2));
        }
    } catch(e) {
        console.error('[Session] Failed to clear session:', e.message);
    }
}

const Dolphin = require('dolphin-native');
const config  = require('./dolphin.config.js');
const WebSocket = require('ws');
// Hot patch test comment 2

// ── Pages ────────────────────────────────────────────────────
const { 
    HomeScreen, 
    LoginScreen, 
    RegisterScreen, 
    MainDashboard,
    ChatListScreen,
    ContactsScreen,
    MeetingsScreen,
    DirectChatScreen,
    GroupChatScreen,
    CreateGroupScreen,
    VideoCallScreen,
    ContactDetailScreen
} = require('./pages');

const { apiFetch, setToken } = require('./utils/api');
const { handleLoginSuccess, handleLogout } = require('./store/auth');

// Clean up old app instance on hot reload
if (global.dolphinApp) {
    console.log('[HotReload] Cleaning up old DolphinApp instance...');
    // We do NOT disconnect global WebSocket connections to prevent call interruption
}

// ── Create App ───────────────────────────────────────────────
const app = Dolphin.createApp({ platform: config.platform, debug: true })
    .name(config.app)
    .version(config.version);

global.dolphinApp = app;

// Monkey-patch Dolphin module to support Dolphin.getState() inside components
Dolphin.getState = (key) => app.getState(key);

const store = require('./store/index.js');

store.initializeStore(app);

function initializeDeviceContext(deviceId) {
    store.initializeDeviceContext(app, deviceId);
}


// ── Register Screens ─────────────────────────────────────────
app.screen('Home', HomeScreen);
app.screen('LoginScreen', LoginScreen);
app.screen('RegisterScreen', RegisterScreen);
app.screen('MainDashboard', MainDashboard);
app.screen('ChatListScreen', ChatListScreen);
app.screen('ContactsScreen', ContactsScreen);
app.screen('MeetingsScreen', MeetingsScreen);
app.screen('DirectChatScreen', DirectChatScreen);
app.screen('GroupChatScreen', GroupChatScreen);
app.screen('CreateGroupScreen', CreateGroupScreen);
app.screen('VideoCallScreen', VideoCallScreen);
app.screen('ContactDetailScreen', ContactDetailScreen);
// v3 - flat JSX dialer fix

// Screen Component Map for auto re-registration before patching
const screensMap = {
    'Home': HomeScreen,
    'LoginScreen': LoginScreen,
    'RegisterScreen': RegisterScreen,
    'MainDashboard': MainDashboard,
    'ChatListScreen': ChatListScreen,
    'ContactsScreen': ContactsScreen,
    'MeetingsScreen': MeetingsScreen,
    'DirectChatScreen': DirectChatScreen,
    'GroupChatScreen': GroupChatScreen,
    'CreateGroupScreen': CreateGroupScreen,
    'VideoCallScreen': VideoCallScreen,
    'ContactDetailScreen': ContactDetailScreen
};

const originalPatchScreen = app.patchScreen.bind(app);
app.patchScreen = function(name) {
    const comp = screensMap[name];
    if (comp) {
        try {
            app.screen(name, comp);
        } catch (e) {
            console.error(`[Auto-Recompile] Failed to re-register screen ${name}:`, e.message);
        }
    }
    return originalPatchScreen(name);
};

// ── WebRTC Signaling Client ──────────────────────────────────
// Use global instances map to survive hot reloads and support multiple devices without conflicts
function initSignaling(token, userExt, deviceId = null) {
    const activeDeviceId = deviceId || (app.framework && app.framework.deviceContextStore && app.framework.deviceContextStore.getStore()) || 'default';
    
    if (!app.framework || !app.framework.deviceContextStore) return;

    // KILL ZOMBIE CONNECTIONS: Disconnect any old DevServer connection for this same userExt!
    if (global.dolphinSignalingInstances) {
        for (const [otherDevId, otherInst] of Object.entries(global.dolphinSignalingInstances)) {
            if (otherDevId !== activeDeviceId && otherInst.ext === userExt && otherInst.connected) {
                console.log(`[Signaling-${activeDeviceId}] Killing zombie signaling connection for device ${otherDevId} (ext: ${userExt})`);
                try {
                    app.framework.deviceContextStore.run(otherDevId, () => {
                        if (app.realtime) app.realtime.disconnect();
                    });
                } catch(e) {}
                otherInst.connected = false;
                otherInst.ext = null;
            }
        }
    }
    
    app.framework.deviceContextStore.run(activeDeviceId, () => {
        if (!app.realtime) return;

        if (!global.dolphinSignalingInstances) {
            global.dolphinSignalingInstances = {};
        }
        if (!global.dolphinSignalingInstances[activeDeviceId]) {
            global.dolphinSignalingInstances[activeDeviceId] = {
                connected: false,
                ext: null,
                setup: false
            };
        }
        const inst = global.dolphinSignalingInstances[activeDeviceId];

        // If already connected with same ext and actual engine is active, skip reconnect
        if (inst.ext === userExt && inst.connected && app.realtime && app.realtime.isConnected) {
            console.log(`[Signaling-${activeDeviceId}] Already connected as ext:`, userExt, '— skipping reconnect');
            setupSignalingListeners(activeDeviceId);
            return;
        }

        console.log(`[Signaling-${activeDeviceId}] Connecting with userExt:`, userExt);
        try { 
            if (app.realtime) {
                app.realtime.disconnect();
                app.realtime.listeners.clear();
                app.realtime.subscribers.clear();
            }
        } catch(e){}

        inst.ext = userExt;
        inst.connected = true;

        // Connect to server signaling endpoint /phone
        app.realtime.connect(`http://${LOCAL_IP}:3000`, userExt, token);
        setupSignalingListeners(activeDeviceId);
    });
}


function setupSignalingListeners(deviceId = null) {
    const activeDeviceId = deviceId || (app.framework && app.framework.deviceContextStore && app.framework.deviceContextStore.getStore()) || 'default';
    
    if (!app.framework || !app.framework.deviceContextStore) return;
    
    app.framework.deviceContextStore.run(activeDeviceId, () => {
        if (!global.dolphinSignalingInstances) {
            global.dolphinSignalingInstances = {};
        }
        if (!global.dolphinSignalingInstances[activeDeviceId]) {
            global.dolphinSignalingInstances[activeDeviceId] = {
                connected: false,
                ext: null,
                setup: false,
                audioSubscribedExt: null
            };
        }
        const inst = global.dolphinSignalingInstances[activeDeviceId];
        if (!app.realtime) return;

        // Clear existing signaling callbacks so we register fresh closures on hot-reload
        // NOTE: This also clears audio subscriptions — they will be re-set up on call_accepted/accept_call
        app.realtime.listeners.clear();
        app.realtime.subscribers.clear();
        inst.audioSubscribedExt = null; // Reset audio subscription tracking

        app.realtime.on('incoming_call', (data) => {
            app.framework.deviceContextStore.run(activeDeviceId, () => {
                console.log(`[Signaling-${activeDeviceId}] Incoming call:`, data);
                const { from, callType, callLogId } = data;
                
                // Look up caller's real name from directory
                const contacts = app.getState('directory_users') || [];
                const callerContact = contacts.find(c => c.extension === from);
                const callerName = callerContact ? callerContact.name : `Extension ${from}`;
                
                // Save calling details to state
                app.state('call_status', 'incoming');
                app.state('call_partner_ext', from);
                app.state('call_partner_name', callerName);
                app.state('call_direction', 'inbound');
                app.state('call_log_id', callLogId);
                app.state('call_duration_str', '00:00');
                
                // Trigger native incoming call background screen / wake up
                app.state('hw', `phone:incoming_call:${from}`);
                
                // Play ringtone on device using native hardware command
                app.state('hw', 'ringtone:play');
                
                // Render and navigate to Call Screen
                app.screen('VideoCallScreen', VideoCallScreen);
                app.navigate('VideoCallScreen');
                app.patchScreen('VideoCallScreen');
            });
        });

        app.realtime.on('call_accepted', async (data) => {
            app.framework.deviceContextStore.run(activeDeviceId, async () => {
                console.log(`[Signaling-${activeDeviceId}] Call accepted by receiver:`, data);
                
                app.state('call_status', 'connected');
                app.screen('VideoCallScreen', VideoCallScreen);
                app.patchScreen('VideoCallScreen');
                
                // Stop dial tone now that call is answered
                app.state('hw', 'ringtone:stop');
                
                // Start intercom audio — caller side uses intercom:start directly
                // (WebSocket signaling already handled ACCEPT, no HTTP accept signal needed)
                const receiverExt = app.getState('call_partner_ext');
                const callerSelfExt = app.getState('user_ext');
                app.state('intercom_server', `http://${LOCAL_IP}:3000`);
                app.state('intercom_device_id', callerSelfExt);
                app.state('intercom_target_id', receiverExt);
                app.state('hw', 'intercom:start');
                // Default to speaker for video call — send hw command so native AudioManager actually switches
                app.state('call_speaker', 'on');
                app.state('hw', 'audio:speaker:on');
                
                // Start duration timer
                startCallTimer(activeDeviceId);
                
                // Register call start on the server DB
                const callLogId = app.getState('call_log_id');
                const callerExt = app.getState('user_ext');
                
                try {
                    await apiFetch('/calls/start', {
                        method: 'POST',
                        body: JSON.stringify({ callLogId, callerExt, receiverExt })
                    });
                    console.log(`[Signaling-${activeDeviceId}] Call start logged successfully.`);
                } catch(e) {
                    console.error(`[Signaling-${activeDeviceId}] Failed to log call start:`, e.message);
                }
            });
        });

        app.realtime.on('call_rejected', (data) => {
            app.framework.deviceContextStore.run(activeDeviceId, () => {
                console.log(`[Signaling-${activeDeviceId}] Call rejected by receiver:`, data);
                cleanupCallSession(activeDeviceId);
                app.alert('Call Rejected', `The extension is busy: ${data.reason || 'Busy'}`);
            });
        });

        app.realtime.on('call_ended', (data) => {
            app.framework.deviceContextStore.run(activeDeviceId, () => {
                console.log(`[Signaling-${activeDeviceId}] Call ended by remote party:`, data);
                cleanupCallSession(activeDeviceId);
                app.alert('Call Ended', 'The other party hung up.');
            });
        });
    });
}

function startCallTimer(deviceId = null) {
    const activeDeviceId = deviceId || (app.framework && app.framework.deviceContextStore && app.framework.deviceContextStore.getStore()) || 'default';
    
    if (!global.dolphinCallInstances) {
        global.dolphinCallInstances = {};
    }
    if (!global.dolphinCallInstances[activeDeviceId]) {
        global.dolphinCallInstances[activeDeviceId] = {
            durationTimer: null,
            startTime: 0
        };
    }
    const inst = global.dolphinCallInstances[activeDeviceId];

    if (inst.durationTimer) {
        clearInterval(inst.durationTimer);
    }
    inst.startTime = Date.now();
    app.state('call_duration_str', '00:00');
    
    inst.durationTimer = setInterval(() => {
        app.framework.deviceContextStore.run(activeDeviceId, () => {
            const diff = Date.now() - inst.startTime;
            const totalSecs = Math.floor(diff / 1000);
            const mins = Math.floor(totalSecs / 60).toString().padStart(2, '0');
            const secs = (totalSecs % 60).toString().padStart(2, '0');
            app.state('call_duration_str', `${mins}:${secs}`);
            
            // Re-compile and patch to update UI
            if (totalSecs % 5 === 0 || totalSecs === 1) { // Optimize to patch less frequently
                app.screen('VideoCallScreen', VideoCallScreen);
                app.patchScreen('VideoCallScreen');
            }
        });
    }, 1000);
}

function cleanupCallSession(deviceId = null) {
    const activeDeviceId = deviceId || (app.framework && app.framework.deviceContextStore && app.framework.deviceContextStore.getStore()) || 'default';
    
    if (global.dolphinCallInstances && global.dolphinCallInstances[activeDeviceId]) {
        const inst = global.dolphinCallInstances[activeDeviceId];
        if (inst.durationTimer) {
            clearInterval(inst.durationTimer);
            inst.durationTimer = null;
        }
    }
    
    // Stop any active ringtones
    app.state('hw', 'ringtone:stop');
    
    // Stop intercom audio streaming (native DolphinIntercom.kt)
    app.state('hw', 'intercom:stop');
    
    app.state('call_status', 'idle');
    app.state('call_partner_ext', '');
    app.state('call_partner_name', '');
    app.state('call_log_id', '');
    app.state('call_duration_str', '00:00');
    app.state('call_speaker', 'off');
    
    app.navigate('MainDashboard');
    app.patchScreen('MainDashboard');
}

// ── WebSocket Client ─────────────────────────────────────────
let wsRetryTimeout = null;
let wsPingInterval = null;

function updateGlobalWsState(status) {
    app.state('ws_status', status);

    try {
        app.patchScreen('MainDashboard');
        app.patchScreen('ChatListScreen');
        app.patchScreen('ContactsScreen');
        app.patchScreen('MeetingsScreen');
    } catch (e) {
        console.error('[WS State Update] Failed to patch screens:', e.message);
    }
}

function initWebSocket(token, userId, deviceId = null) {
    const activeDeviceId = deviceId || (app.framework && app.framework.deviceContextStore && app.framework.deviceContextStore.getStore()) || 'default';
    
    if (!global.dolphinWsInstances) {
        global.dolphinWsInstances = {};
    }
    if (!global.dolphinWsInstances[activeDeviceId]) {
        global.dolphinWsInstances[activeDeviceId] = {
            wsClient: null,
            pingInterval: null,
            retryTimeout: null
        };
    }
    const inst = global.dolphinWsInstances[activeDeviceId];

    if (inst.wsClient) {
        if (inst.wsClient.readyState === 1) { // 1 = OPEN
            console.log(`[WS-${activeDeviceId}] WebSocket is already open, reusing connection.`);
            app.framework.deviceContextStore.run(activeDeviceId, () => {
                updateGlobalWsState('connected');
            });
            return;
        }
        console.log(`[WS-${activeDeviceId}] Cleaning up old WebSocket...`);
        try { inst.wsClient.close(); } catch(e){}
        inst.wsClient = null;
    }
    if (inst.retryTimeout) {
        clearTimeout(inst.retryTimeout);
        inst.retryTimeout = null;
    }
    if (inst.pingInterval) {
        clearInterval(inst.pingInterval);
        inst.pingInterval = null;
    }
    
    app.framework.deviceContextStore.run(activeDeviceId, () => {
        updateGlobalWsState('connecting');
    });

    // Connect to backend websocket gateway
    // Use the passed token directly — do NOT rely on app.getState('accessToken') which may be empty
    const latestToken = token || app.getState('accessToken') || global.dolphinAccessToken || '';
    if (!latestToken) {
        console.error(`[WS-${activeDeviceId}] No token available — skipping WS connect`);
        return;
    }
    const wsDeviceId = activeDeviceId;
    const wsUrl = `ws://${LOCAL_IP}:3000/realtime?token=${latestToken}&deviceId=${wsDeviceId}&platform=android`;
    console.log(`[WS-${activeDeviceId}] Connecting to backend: ${wsUrl}`);
    
    const wsClientInstance = new WebSocket(wsUrl);
    inst.wsClient = wsClientInstance;
    
    wsClientInstance.on('open', () => {
        app.framework.deviceContextStore.run(activeDeviceId, () => {
            console.log(`[WS-${activeDeviceId}] Connection open! Subscribing to topics...`);
            updateGlobalWsState('connected');
            wsClientInstance.send(JSON.stringify({ type: 'sub', topic: `chat/private/${userId}` }));
            wsClientInstance.send(JSON.stringify({ type: 'sub', topic: 'chat/group/+' }));
            
            // Start heartbeat ping — 25s interval is enough, shorter causes churn
            inst.pingInterval = setInterval(() => {
                app.framework.deviceContextStore.run(activeDeviceId, () => {
                    if (inst.wsClient && inst.wsClient.readyState === 1) { // 1 = OPEN
                        inst.wsClient.send(JSON.stringify({ type: 'ping' }));
                    }
                });
            }, 25000); // 25 seconds
        });
    });
    
    wsClientInstance.on('message', (data) => {
        app.framework.deviceContextStore.run(activeDeviceId, () => {
            try {
                const message = JSON.parse(data.toString());
                
                // Silently handle keep-alive pong from server
                if (message.type === 'pong') return;
                
                console.log(`[WS-${activeDeviceId}] Message received:`, message);
                
                if (message.topic && message.payload) {
                    const { topic, payload } = message;
                    
                    // Handle Audio Stream (VoIP call audio) — fast path, no UI update
                    if (topic && topic.startsWith('audio_stream/')) {
                        const callStatus = app.getState('call_status');
                        if (callStatus !== 'connected') return;
                        if (!payload || !payload.audio) return;
                        const rate = payload.rate || 8000;
                        app.state('hw', `audio:stream_play:${rate}:${payload.audio}`);
                        return;
                    }

                    // Handle Private Chat Messages
                    if (topic === `chat/private/${userId}` || topic.startsWith('chat/private/')) {
                        const activePartnerId = app.getState('chat_partner_id');
                        if (payload.senderId === activePartnerId || payload.receiverId === activePartnerId) {
                            const msgs = app.getState('current_messages') || [];
                            if (!msgs.some(m => m.id === payload.id)) {
                                app.state('current_messages', [...msgs, payload]);
                                app.patchScreen('DirectChatScreen');
                            }
                        }
                        debouncedReloadChats();
                    }
                    
                    // Handle Group Chat Messages
                    if (topic.startsWith('chat/group/')) {
                        const activeGroupId = app.getState('chat_group_id');
                        if (payload.groupId === activeGroupId) {
                            const msgs = app.getState('current_group_messages') || [];
                            if (!msgs.some(m => m.id === payload.id)) {
                                app.state('current_group_messages', [...msgs, payload]);
                                app.patchScreen('GroupChatScreen');
                            }
                        }
                        debouncedReloadChats();
                    }
                }
            } catch (err) {
                console.error(`[WS-${activeDeviceId} Error] processing message:`, err.message);
            }
        });
    });
    
    wsClientInstance.on('close', (code, reason) => {
        app.framework.deviceContextStore.run(activeDeviceId, async () => {
            console.log(`[WS-${activeDeviceId}] Connection closed. Code: ${code}, Reason: ${reason || 'None'}.`);
            updateGlobalWsState('disconnected');
            if (inst.pingInterval) {
                clearInterval(inst.pingInterval);
                inst.pingInterval = null;
            }
            // Only reconnect if this is still the active client (prevent stale retries)
            if (inst.wsClient !== wsClientInstance && inst.wsClient !== null) {
                console.log(`[WS-${activeDeviceId}] Stale client — skipping reconnect`);
                return;
            }
            inst.wsClient = null;

            if (!app.getState('isLoggedIn')) return;

            // Code 4000 = JWT expired/invalid — try to refresh token first
            if (code === 4000) {
                console.log(`[WS-${activeDeviceId}] Token expired (4000) — attempting token refresh...`);
                try {
                    // Server expects { refreshToken: '...' } not { token: '...' }
                    const storedRefreshToken = app.getState('refreshToken') ||
                        (global.dolphinActiveSessions && global.dolphinActiveSessions[activeDeviceId]?.refreshToken) || '';
                    const refreshRes = await fetch(`http://${LOCAL_IP}:3000/api/auth/refresh`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refreshToken: storedRefreshToken })
                    });
                    if (refreshRes.ok) {
                        const refreshData = await refreshRes.json();
                        const newToken = refreshData.accessToken || refreshData.token;
                        if (newToken) {
                            console.log(`[WS-${activeDeviceId}] Token refreshed successfully — reconnecting...`);
                            app.state('accessToken', newToken);
                            // Update saved session too
                            if (global.dolphinActiveSessions && global.dolphinActiveSessions[activeDeviceId]) {
                                global.dolphinActiveSessions[activeDeviceId].accessToken = newToken;
                            }
                            initWebSocket(newToken, userId, activeDeviceId);
                            return;
                        }
                    }
                    console.warn(`[WS-${activeDeviceId}] Token refresh failed (${refreshRes.status}) — retrying in 8s with old token`);
                } catch (e) {
                    console.error(`[WS-${activeDeviceId}] Token refresh error:`, e.message);
                }
            }

            console.log(`[WS-${activeDeviceId}] Retrying connect in 8 seconds...`);
            inst.retryTimeout = setTimeout(() => {
                app.framework.deviceContextStore.run(activeDeviceId, () => {
                    if (app.getState('isLoggedIn')) {
                        const freshToken = app.getState('accessToken') || latestToken;
                        const freshUserId = app.getState('user_id') || userId;
                        initWebSocket(freshToken, freshUserId, activeDeviceId);
                    }
                });
            }, 8000);
        });
    });
    
    wsClientInstance.on('error', (err) => {
        console.error(`[WS-${activeDeviceId} Error]:`, err.message, err);
    });
}

let chatReloadTimeout = null;
function debouncedReloadChats() {
    if (chatReloadTimeout) clearTimeout(chatReloadTimeout);
    chatReloadTimeout = setTimeout(() => {
        reloadChatsInBackground();
    }, 2000);
}

async function reloadChatsInBackground() {
    try {
        const chatsData = await apiFetch('/chats');
        app.state('conversations', chatsData.conversations || []);
        const groupsData = await apiFetch('/groups');
        app.state('groups', groupsData.groups || []);
    } catch(e) {
        console.error('[Background Sync] Failed:', e.message);
    }
}

// ── App Start Logic & Hot-Reload Recovery ─────────────────────────────────────────
// Default app entry is LoginScreen. When a device links/reconnects, the server fires
// 'deviceConnected' which triggers 'app:restore_session' under that device context,
// automatically redirecting active sessions to the MainDashboard.
app.entry('LoginScreen');

// On hot-reload (bundle re-evaluation), we must restore state, sockets, and signaling
// connections for all currently active devices using their isolated contexts.
setTimeout(() => {
    if (app.framework && app.framework._devServer) {
        // 1. Recover already connected devices
        if (app.framework._devServer.server) {
            const devices = app.framework._devServer.server.getConnectedDevices();
            console.log(`[Hot-Reload] Recovering session and connections for ${devices.length} connected devices...`);
            devices.forEach(dev => {
                app.framework.deviceContextStore.run(dev.id, () => {
                    const session = loadSession(dev.id);
                    if (session) {
                        console.log(`[Hot-Reload] Restoring session for device ${dev.id} (ext: ${session.userExt})`);
                        
                        // Populate active session in global memory map for persistence
                        if (!global.dolphinActiveSessions) global.dolphinActiveSessions = {};
                        global.dolphinActiveSessions[dev.id] = {
                            isLoggedIn: true,
                            accessToken: session.accessToken,
                            userId: session.userId,
                            userName: session.userName,
                            userExt: session.userExt
                        };

                        app.state('isLoggedIn', true);
                        app.state('user_id', session.userId);
                        app.state('user_name', session.userName);
                        app.state('user_ext', session.userExt);
                        app.state('accessToken', session.accessToken);
                        
                        initWebSocket(session.accessToken, session.userId, dev.id);
                        initSignaling(session.accessToken, session.userExt, dev.id);
                        
                        // Fetch network details from device
                        app.state('hw', 'phone:carrier');
                        app.state('hw', 'phone:simState');
                        
                        app.navigate('MainDashboard');
                    }
                });
            });
        }

        // 2. Register listener to restore session automatically when a new device connects
        if (!global.dolphinDeviceConnectedListenerRegistered) {
            global.dolphinDeviceConnectedListenerRegistered = true;
            app.framework._devServer.server.on('deviceConnected', (device) => {
                console.log(`[Device Connected Event] Device ${device.id} connected. Triggering session restore...`);
                app.framework.deviceContextStore.run(device.id, () => {
                    const handler = app._actionHandlers.get('app:restore_session');
                    if (handler) {
                        handler('app:restore_session', null, device.id);
                    }
                });
            });
        }
    }
}, 300);


// ── Actions ─────────────────────────────────────────
app.action('*', async (action, value) => {
    if (action === 'phone_number') return;
    if (value && typeof value === 'string' && value.startsWith('=')) {
        app.state(action, value.substring(1));
    }
});

app.action('nav_register', () => {
    app.state('auth_error', '');
    app.navigate('RegisterScreen');
});

app.action('nav_login', () => {
    app.state('auth_error', '');
    app.navigate('LoginScreen');
});

app.action('login_submit', async (action, val, deviceId) => {
    let email = app.getState('login_email');
    const password = app.getState('login_pass');
    
    if (typeof email === 'string') email = email.trim();
    
    console.log(`[Login Attempt] email="${email}", pass="${password}"`);
    
    if (!email || !password) {
        app.state('auth_error', 'Email and password required');
        return;
    }
    
    app.state('auth_error', 'Logging in...');
    try {
        const data = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        console.log('[Login Attempt] Success!', JSON.stringify(data));
        
        handleLoginSuccess(data, app);
        app.state('user_id', data.user.id);
        
        // Save to file for device-specific session restore
        saveSession(deviceId, data);
        
        // Save to global active sessions map for hot reload persistence
        if (!global.dolphinActiveSessions) global.dolphinActiveSessions = {};
        global.dolphinActiveSessions[deviceId] = {
            isLoggedIn: true,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken || '',
            userId: data.user.id,
            userName: data.user.name,
            userExt: data.user.extension
        };
        // Also save refreshToken in app state
        if (data.refreshToken) app.state('refreshToken', data.refreshToken);
        
        // Start Websocket and Signaling connection
        initWebSocket(data.accessToken, data.user.id, deviceId);
        initSignaling(data.accessToken, data.user.extension, deviceId);
        
        // Fetch network details from device
        app.state('hw', 'phone:carrier');
        app.state('hw', 'phone:simState');
    } catch (e) {
        console.log('[Login Attempt] Error:', e.message);
        app.state('auth_error', e.message);
    }
});

app.action('register_submit', async () => {
    const name = app.getState('reg_name');
    const extension = app.getState('reg_ext');
    let email = app.getState('reg_email');
    const password = app.getState('reg_pass');
    
    if (typeof email === 'string') email = email.trim();
    
    if (!name || !extension || !email || !password) {
        app.state('auth_error', 'All fields required');
        return;
    }
    
    app.state('auth_error', 'Creating account...');
    try {
        const data = await apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, extension, email, password })
        });
        console.log('[Register Attempt] Success!', JSON.stringify(data));
        
        app.state('auth_error', 'Registration successful! Please login.');
        app.navigate('LoginScreen');
        app.state('login_email', email);
    } catch (e) {
        app.state('auth_error', e.message);
    }
});

app.action('logout_submit', async (action, val, deviceId) => {
    try {
        await apiFetch('/auth/logout', { method: 'POST' });
    } catch (e) {}
    
    clearSession(deviceId);
    
    if (global.dolphinActiveSessions) {
        delete global.dolphinActiveSessions[deviceId];
    }
    
    const activeDeviceId = deviceId || (app.framework && app.framework.deviceContextStore && app.framework.deviceContextStore.getStore()) || 'default';
    if (global.dolphinWsInstances && global.dolphinWsInstances[activeDeviceId]) {
        const inst = global.dolphinWsInstances[activeDeviceId];
        if (inst.wsClient) {
            try { inst.wsClient.close(); } catch(e){}
            inst.wsClient = null;
        }
        if (inst.retryTimeout) {
            clearTimeout(inst.retryTimeout);
            inst.retryTimeout = null;
        }
        if (inst.pingInterval) {
            clearInterval(inst.pingInterval);
            inst.pingInterval = null;
        }
    }
    
    app.framework.deviceContextStore.run(activeDeviceId, () => {
        if (app.realtime) {
            try { app.realtime.disconnect(); } catch(e){}
        }
    });
    
    if (global.dolphinSignalingInstances && global.dolphinSignalingInstances[activeDeviceId]) {
        global.dolphinSignalingInstances[activeDeviceId].connected = false;
        global.dolphinSignalingInstances[activeDeviceId].ext = null;
        global.dolphinSignalingInstances[activeDeviceId].setup = false;
    }
    
    handleLogout(app);
});

app.action('app:restore_session', (action, value, deviceId) => {
    initializeDeviceContext(deviceId);
    const session = loadSession(deviceId);
    if (session) {
        console.log(`[Session] Restoring session for device ${deviceId} (ext: ${session.userExt})`);
        
        // Save to global active sessions map for hot reload persistence
        if (!global.dolphinActiveSessions) global.dolphinActiveSessions = {};
        global.dolphinActiveSessions[deviceId] = {
            isLoggedIn: true,
            accessToken: session.accessToken,
            userId: session.userId,
            userName: session.userName,
            userExt: session.userExt
        };

        app.state('isLoggedIn', true);
        app.state('user_id', session.userId);
        app.state('user_name', session.userName);
        app.state('user_ext', session.userExt);
        app.state('accessToken', session.accessToken);
        
        initWebSocket(session.accessToken, session.userId, deviceId);
        initSignaling(session.accessToken, session.userExt, deviceId);
        
        // Fetch network details from device
        app.state('hw', 'phone:carrier');
        app.state('hw', 'phone:simState');
        
        app.navigate('MainDashboard');
    } else {
        app.navigate('LoginScreen');
    }
});

// Audio is now handled entirely by DolphinIntercom.kt (native layer).
// intercom:start → AudioRecord captures PCM → POST /api/intercom/audio/push
// Background thread polls GET /api/intercom/audio/pull → AudioTrack plays PCM
// No JS-level audio relay needed.

// Dialer Keypad Actions
// Dolphin passes the `value` attribute as the second argument.
// Also support action-embedded format: "dial_key:5" as fallback.

let isCompilingDialer = false;
let needsRecompileDialer = false;

function patchDialerImmediately() {
    if (isCompilingDialer) {
        needsRecompileDialer = true;
        return;
    }
    isCompilingDialer = true;
    needsRecompileDialer = false;
    
    try {
        app.screen('MainDashboard', MainDashboard);
        app.patchScreen('MainDashboard');
    } catch (e) {
        console.error('[Dialer Patch] Error compiling screen:', e.message);
    }
    
    isCompilingDialer = false;
    if (needsRecompileDialer) {
        setTimeout(patchDialerImmediately, 0);
    }
}

app.action('dial_key', (action, val) => {
    let digit = val;
    // Fallback: extract digit from action string e.g. "dial_key:5"
    if ((digit === undefined || digit === null || digit === '') && action && action.includes(':')) {
        digit = action.split(':').slice(1).join(':');
    }
    if (digit === undefined || digit === null) return;
    const current = app.getState('phone_number') || '';
    app.state('phone_number', current + String(digit));
    patchDialerImmediately();
});

app.action('dial_backspace', () => {
    const current = app.getState('phone_number') || '';
    if (current.length > 0) {
        app.state('phone_number', current.slice(0, -1));
        patchDialerImmediately();
    }
});

app.action('app:toggle_call_mode', () => {
    const current = app.getState('call_mode') || 'dolphin';
    if (current === 'dolphin') {
        app.state('call_mode', 'sim');
        app.state('call_mode_label', 'SIM Call');
    } else {
        app.state('call_mode', 'dolphin');
        app.state('call_mode_label', 'Dolphin Call');
    }
    app.patchScreen('MainDashboard');
});

let lastDialTime = 0;

async function initiateOutboundCall(targetExt) {
    if (!targetExt) return;
    
    const selfExt = app.getState('user_ext');
    if (targetExt === selfExt) {
        app.alert('Call Error', 'You cannot call your own extension.');
        return;
    }
    
    console.log(`[Calling] Initiating call to extension: ${targetExt}`);
    
    app.state('call_status', 'outgoing');
    app.state('call_partner_ext', targetExt);
    // Look up real name from directory; fall back to Extension N
    const outboundUsers = app.getState('directory_users') || [];
    const outboundContact = outboundUsers.find(u => String(u.extension) === String(targetExt));
    const outboundName = outboundContact ? (outboundContact.name || outboundContact.displayName || `Extension ${targetExt}`) : `Extension ${targetExt}`;
    app.state('call_partner_name', outboundName);
    app.state('call_direction', 'outbound');
    app.state('call_duration_str', '00:00');
    
    // Show Call Screen
    app.screen('VideoCallScreen', VideoCallScreen);
    app.navigate('VideoCallScreen');
    app.patchScreen('VideoCallScreen');

    // Play dial/ring tone on device while waiting for answer
    app.state('hw', 'ringtone:dialtone');
    
    // Send signaling INVITE
    if (app.realtime) {
        const msgId = app.realtime.invite(targetExt, 'video');
        app.state('call_log_id', msgId);
    }
}

app.action('app:dial_audio_call', () => {
    const now = Date.now();
    if (now - lastDialTime < 1500) return;
    lastDialTime = now;

    const num = app.getState('phone_number') || '';
    const mode = app.getState('call_mode') || 'dolphin';
    if (num) {
        if (mode === 'sim') {
            app.state('hw', `phone:dial:${num}`);
        } else {
            initiateOutboundCall(num);
        }
    }
});

app.action('app:dial_video_call', () => {
    const now = Date.now();
    if (now - lastDialTime < 1500) return;
    lastDialTime = now;

    const num = app.getState('phone_number') || '';
    if (num) {
        initiateOutboundCall(num);
    }
});

app.action('app:start_call', (action, ext) => {
    const now = Date.now();
    if (now - lastDialTime < 1500) return;
    lastDialTime = now;

    let resolvedExt = ext;
    if (action && action.includes(':')) {
        const parts = action.split(':');
        if (parts.length >= 3) {
            resolvedExt = parts.slice(2).join(':');
        }
    }

    const mode = app.getState('call_mode') || 'dolphin';
    if (resolvedExt) {
        if (mode === 'sim') {
            app.state('hw', `phone:dial:${resolvedExt}`);
        } else {
            initiateOutboundCall(resolvedExt);
        }
    }
});

app.action('app:start_video_call', (action, ext) => {
    const now = Date.now();
    if (now - lastDialTime < 1500) return;
    lastDialTime = now;

    let resolvedExt = ext;
    if (action && action.includes(':')) {
        const parts = action.split(':');
        if (parts.length >= 3) {
            resolvedExt = parts.slice(2).join(':');
        }
    }

    if (resolvedExt) {
        initiateOutboundCall(resolvedExt);
    }
});

app.action('app:accept_call', (action, val, deviceId) => {
    const partnerExt = app.getState('call_partner_ext');
    const callLogId = app.getState('call_log_id');
    
    console.log('[Calling] Accepting incoming call from:', partnerExt);
    
    // Stop Ringtone
    app.state('hw', 'ringtone:stop');
    
    // Send ACCEPT signal
    if (app.realtime) {
        app.realtime.accept(partnerExt, callLogId);
    }
    
    app.state('call_status', 'connected');
    app.screen('VideoCallScreen', VideoCallScreen);
    app.patchScreen('VideoCallScreen');
    
    // Start intercom audio — receiver side uses intercom:start directly
    // (WebSocket signaling ACCEPT was already sent via app.realtime.accept above)
    const activeDeviceId = deviceId || (app.framework && app.framework.deviceContextStore && app.framework.deviceContextStore.getStore()) || 'default';
    const receiverSelfExt = app.getState('user_ext');
    app.state('intercom_server', `http://${LOCAL_IP}:3000`);
    app.state('intercom_device_id', receiverSelfExt);
    app.state('intercom_target_id', partnerExt);
    app.state('hw', 'intercom:start');
    // Default to speaker for video call — send hw command so native AudioManager actually switches
    app.state('call_speaker', 'on');
    app.state('hw', 'audio:speaker:on');
    
    startCallTimer();
});

app.action('app:toggle_speaker', () => {
    if (app.getState('call_status') !== 'connected') return;
    const isOn = app.getState('call_speaker') === 'on';
    app.state('call_speaker', isOn ? 'off' : 'on');
    // intercom:stop+start with speaker state would reset the call; use ringtone:dialtone speaker trick
    // Instead set speakerphone via audio hw command
    app.state('hw', isOn ? 'audio:speaker:off' : 'audio:speaker:on');
    app.screen('VideoCallScreen', VideoCallScreen);
    app.patchScreen('VideoCallScreen');
});

app.action('app:reject_call', () => {
    const partnerExt = app.getState('call_partner_ext');
    const callLogId = app.getState('call_log_id');
    
    console.log('[Calling] Rejecting incoming call from:', partnerExt);
    
    // Send REJECT signal
    if (app.realtime) {
        app.realtime.reject(partnerExt, callLogId);
    }
    
    cleanupCallSession();
});

app.action('app:hang_up_call', async (action, val, deviceId) => {
    const partnerExt = app.getState('call_partner_ext');
    const callLogId = app.getState('call_log_id');
    const callStatus = app.getState('call_status');
    
    console.log('[Calling] Hanging up call session with:', partnerExt);
    
    // Send END signal if we were in connected or outgoing state
    if (app.realtime && partnerExt && (callStatus === 'connected' || callStatus === 'outgoing')) {
        app.realtime.end(partnerExt, callLogId);
    }
    
    const activeDeviceId = deviceId || (app.framework && app.framework.deviceContextStore && app.framework.deviceContextStore.getStore()) || 'default';
    let startTime = 0;
    if (global.dolphinCallInstances && global.dolphinCallInstances[activeDeviceId]) {
        startTime = global.dolphinCallInstances[activeDeviceId].startTime;
    }
    
    // If call was connected, compute final duration and save on server DB
    if (callStatus === 'connected' && startTime > 0) {
        const diff = Date.now() - startTime;
        const durationSecs = Math.floor(diff / 1000);
        
        try {
            await apiFetch('/calls/end', {
                method: 'POST',
                body: JSON.stringify({ callLogId, duration: durationSecs })
            });
            console.log('[Signaling] Call end logged on server with duration:', durationSecs);
        } catch(e) {
            console.error('Failed to log call end on server:', e.message);
        }
    }
    
    cleanupCallSession(activeDeviceId);
});

// ── Navigation Tabs Actions ─────────────────────────────────────────
app.action('app:go_to_dialer', () => {
    app.navigate('MainDashboard');
});

app.action('app:go_to_chats', async () => {
    app.navigate('ChatListScreen');
    await reloadChatsInBackground();
    app.patchScreen('ChatListScreen');
});

app.action('app:go_to_contacts', async () => {
    app.state('contact_list_type', 'dolphin');
    app.navigate('ContactsScreen');
    try {
        const { apiFetch } = require('./utils/api');
        const meExt = app.getState('user_ext');
        const dirData = await apiFetch('/directory').catch(() => ({ directory: [] }));
        const contacts = (dirData.directory || []).filter(u => u.extension !== meExt);
        app.state('directory_users', contacts);
        app.screen('ContactsScreen', ContactsScreen);
        app.patchScreen('ContactsScreen');
    } catch(e) {
        console.error('Failed to load directory:', e.message);
    }
});

app.action('app:show_dolphin_contacts', async () => {
    app.state('contact_list_type', 'dolphin');
    let contacts = app.getState('directory_users');
    if (!contacts || contacts.length === 0) {
        try {
            const { apiFetch } = require('./utils/api');
            const meExt = app.getState('user_ext');
            const dirData = await apiFetch('/directory').catch((e) => {
                console.error('API Fetch Error:', e);
                return { directory: [] };
            });
            contacts = (dirData.directory || []).filter(u => u.extension !== meExt);
            app.state('directory_users', contacts);
            // Re-compile screen with new data
            app.screen('ContactsScreen', ContactsScreen);
        } catch (e) {
            console.error('Failed to load directory:', e.message);
        }
    } else {
        // Data is already loaded, just re-compile to be sure
        app.screen('ContactsScreen', ContactsScreen);
    }
    app.patchScreen('ContactsScreen');
});

app.action('app:show_sim_contacts', () => {
    app.state('contact_list_type', 'sim');
    const simContacts = app.getState('sim_contacts') || [];
    if (simContacts.length === 0) {
        app.state('sim_contacts_loading', true);
        app.state('hw', 'contacts:get');
    }
    app.screen('ContactsScreen', ContactsScreen);
    app.patchScreen('ContactsScreen');
});

app.action('app:refresh_sim_contacts', () => {
    app.state('sim_contacts_loading', true);
    app.state('sim_contacts', []);
    app.state('hw', 'contacts:get');
    app.screen('ContactsScreen', ContactsScreen);
    app.patchScreen('ContactsScreen');
});


app.action('hw_result:hw:contacts:get', (action, jsonStr, deviceId) => {
    try {
        const result = JSON.parse(jsonStr);
        const list = result.contacts || [];
        console.log(`[SIM CONTACTS - ${deviceId}] Received ${list.length} contacts from device.`);
        if (list.length > 0) {
            console.log(`[SIM CONTACTS - ${deviceId}] First contact:`, list[0]);
        }
        if (app.framework && app.framework.deviceContextStore && deviceId) {
            app.framework.deviceContextStore.run(deviceId, () => {
                app.state('sim_contacts', list);
                app.state('sim_contacts_loading', false);
                app.screen('ContactsScreen', ContactsScreen);
                app.patchScreen('ContactsScreen');
            });
        } else {
            app.state('sim_contacts', list);
            app.state('sim_contacts_loading', false);
            app.screen('ContactsScreen', ContactsScreen);
            app.patchScreen('ContactsScreen');
        }
    } catch(e) {
        console.error('Failed to parse contacts:', e.message);
        if (app.framework && app.framework.deviceContextStore && deviceId) {
            app.framework.deviceContextStore.run(deviceId, () => {
                app.state('sim_contacts_loading', false);
                app.screen('ContactsScreen', ContactsScreen);
                app.patchScreen('ContactsScreen');
            });
        } else {
            app.state('sim_contacts_loading', false);
            app.screen('ContactsScreen', ContactsScreen);
            app.patchScreen('ContactsScreen');
        }
    }
});

app.action('app:view_contact', (action, value) => {
    // Parameter extraction from action name (e.g. app:view_contact:dolphin-123)
    let resolvedValue = value;
    if (action && action.includes(':')) {
        const parts = action.split(':');
        if (parts.length >= 3) {
            resolvedValue = parts.slice(2).join(':');
        }
    }
    
    console.log('[DEBUG] app:view_contact resolved value:', resolvedValue);
    
    const dolphinContacts = app.getState('directory_users') || [];
    const simContacts = app.getState('sim_contacts') || [];
    let contactObj = null;

    if (resolvedValue && resolvedValue.startsWith('sim-')) {
        const index = parseInt(resolvedValue.replace('sim-', ''), 10);
        contactObj = simContacts[index];
        if (contactObj) contactObj._source = 'sim';
    } else if (resolvedValue && resolvedValue.startsWith('dolphin-')) {
        const id = resolvedValue.replace('dolphin-', '');
        contactObj = dolphinContacts.find(c => c.id === id);
        if (contactObj) contactObj._source = 'dolphin';
    } else if (resolvedValue) {
        contactObj = dolphinContacts.find(c => c.extension && resolvedValue.includes(c.extension));
        if (contactObj) {
            contactObj._source = 'dolphin';
        } else {
            contactObj = simContacts.find(c => c.phone && resolvedValue.includes(c.phone));
            if (contactObj) contactObj._source = 'sim';
        }
    }
    
    if (contactObj) {
        app.state('selected_contact', contactObj);
        app.screen('ContactDetailScreen', ContactDetailScreen);
        app.navigate('ContactDetailScreen');
    } else {
        console.log('[DEBUG] No contact matched for value:', resolvedValue);
    }
});

app.action('app:go_back_contacts', () => {
    app.navigate('ContactsScreen');
});

app.action('app:go_to_meetings', () => {
    app.navigate('MeetingsScreen');
});

// ── Direct Chat Actions ─────────────────────────────────────────
app.action('app:open_direct_chat', async (action, partnerId) => {
    let resolvedPartnerId = partnerId;
    if (action && action.includes(':')) {
        const parts = action.split(':');
        if (parts.length >= 3) {
            resolvedPartnerId = parts.slice(2).join(':');
        }
    }

    app.state('chat_partner_id', resolvedPartnerId);
    app.state('chat_input_text', '');
    app.state('current_messages', []);
    app.navigate('DirectChatScreen');
    
    try {
        // Resolve partner details
        const contacts = app.getState('directory_users') || [];
        let partner = contacts.find(c => c.id === resolvedPartnerId);
        if (!partner) {
            const convs = app.getState('conversations') || [];
            const conv = convs.find(c => c.partner.id === resolvedPartnerId);
            if (conv) partner = conv.partner;
        }
        if (partner) {
            app.state('chat_partner_name', partner.name);
            app.state('chat_partner_ext', partner.extension);
        }
        
        const chatData = await apiFetch(`/chats/${resolvedPartnerId}`);
        app.state('current_messages', chatData.messages || []);
        app.patchScreen('DirectChatScreen');
    } catch(e) {
        console.error('Failed to load direct chat history:', e.message);
    }
});

app.action('app:send_direct_message', async () => {
    const text = app.getState('chat_input_text');
    const partnerId = app.getState('chat_partner_id');
    if (!text || !partnerId) return;
    
    try {
        app.state('chat_input_text', '');
        app.patchScreen('DirectChatScreen');
        
        const msgData = await apiFetch(`/chats/${partnerId}`, {
            method: 'POST',
            body: JSON.stringify({ content: text, type: 'text' })
        });
        
        if (msgData.success && msgData.message) {
            const msgs = app.getState('current_messages') || [];
            app.state('current_messages', [...msgs, msgData.message]);
            app.patchScreen('DirectChatScreen');
        }
        reloadChatsInBackground();
    } catch(e) {
        console.error('Failed to send message:', e.message);
    }
});

// ── Group Chat Actions ─────────────────────────────────────────
app.action('app:open_group_chat', async (action, gId) => {
    app.state('chat_group_id', gId);
    app.state('group_chat_input_text', '');
    app.state('current_group_messages', []);
    app.navigate('GroupChatScreen');
    
    try {
        const groups = app.getState('groups') || [];
        const group = groups.find(g => g.id === gId);
        if (group) {
            app.state('chat_group_name', group.name);
        }
        
        const chatData = await apiFetch(`/groups/${gId}/messages`);
        app.state('current_group_messages', chatData.messages || []);
        app.patchScreen('GroupChatScreen');
    } catch(e) {
        console.error('Failed to load group messages:', e.message);
    }
});

app.action('app:send_group_message', async () => {
    const text = app.getState('group_chat_input_text');
    const groupId = app.getState('chat_group_id');
    if (!text || !groupId) return;
    
    try {
        app.state('group_chat_input_text', '');
        app.patchScreen('GroupChatScreen');
        
        const msgData = await apiFetch(`/groups/${groupId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content: text, type: 'text' })
        });
        
        if (msgData.success && msgData.message) {
            const msgs = app.getState('current_group_messages') || [];
            app.state('current_group_messages', [...msgs, msgData.message]);
            app.patchScreen('GroupChatScreen');
        }
        reloadChatsInBackground();
    } catch(e) {
        console.error('Failed to send group message:', e.message);
    }
});

// ── Group Creation Actions ─────────────────────────────────────────
app.action('app:go_to_create_group', async () => {
    app.state('new_group_name', '');
    app.state('new_group_desc', '');
    app.state('new_group_member_ids', []);
    app.state('create_group_error', '');
    app.navigate('CreateGroupScreen');
    
    try {
        const dirData = await apiFetch('/directory');
        const meExt = app.getState('user_ext');
        const contacts = (dirData.directory || []).filter(u => u.extension !== meExt);
        app.state('directory_users', contacts);
        app.patchScreen('CreateGroupScreen');
    } catch(e) {
        console.error('Failed to load directory:', e.message);
    }
});

app.action('app:toggle_new_group_member', (action, contactId) => {
    let selected = app.getState('new_group_member_ids') || [];
    if (selected.includes(contactId)) {
        selected = selected.filter(id => id !== contactId);
    } else {
        selected = [...selected, contactId];
    }
    app.state('new_group_member_ids', selected);
    app.patchScreen('CreateGroupScreen');
});

app.action('app:submit_create_group', async () => {
    const name = app.getState('new_group_name');
    const desc = app.getState('new_group_desc');
    const members = app.getState('new_group_member_ids') || [];
    
    if (!name) {
        app.state('create_group_error', 'Group name is required');
        app.patchScreen('CreateGroupScreen');
        return;
    }
    
    try {
        await apiFetch('/groups', {
            method: 'POST',
            body: JSON.stringify({ name, description: desc, members })
        });
        app.navigate('ChatListScreen');
        await reloadChatsInBackground();
        app.patchScreen('ChatListScreen');
    } catch(e) {
        app.state('create_group_error', e.message);
        app.patchScreen('CreateGroupScreen');
    }
});

// ── Meetings Actions ─────────────────────────────────────────
app.action('app:join_meeting', () => {
    const roomId = app.getState('meeting_room_id');
    if (roomId) {
        app.state('call_partner_name', `Room: ${roomId}`);
        app.navigate('VideoCallScreen');
    }
});

app.action('app:create_meeting', () => {
    const randomRoom = `room-${Math.floor(1000 + Math.random() * 9000)}`;
    app.state('meeting_room_id', randomRoom);
    app.state('call_partner_name', `Room: ${randomRoom}`);
    app.navigate('VideoCallScreen');
});

// ── Compile & Start ───────────────────────────────────────────────────────────
const bundle = app.build();
app.printReport();

// Force push updated screens to connected devices on hot reload
setTimeout(() => {
    try {
        if (app.framework && app.framework._devServer && app.framework._devServer.server) {
            const devices = app.framework._devServer.server.getConnectedDevices();
            devices.forEach(dev => {
                app.framework.deviceContextStore.run(dev.id, () => {
                    app.screen('VideoCallScreen', VideoCallScreen);
                    app.patchScreen('VideoCallScreen');
                    app.screen('MainDashboard', MainDashboard);
                    app.patchScreen('MainDashboard');
                });
            });
        }
    } catch(e) {}
}, 500);

module.exports = app;
