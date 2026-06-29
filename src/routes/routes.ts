import { createDolphinRouter } from 'dolphin-server-modules/router';
import {
  register,
  login,
  refresh,
  logout,
  setup2FA,
  verify2FA,
  authMiddleware
} from '../controllers/auth.js';
import {
  getDirectory,
  searchDirectory,
  uploadPublicKey,
  getPublicKey
} from '../controllers/directory.js';
import {
  getConversations,
  getDirectChatHistory,
  getGroupChatHistory,
  createGroup,
  getGroups,
  addGroupMembers,
  leaveGroup,
  sendDirectMessage,
  sendGroupMessage
} from '../controllers/chat.js';
import { getTurnCredentialsHandler } from '../realtime/realtime.js';
import { startCall, endCall, getCallHistory } from '../controllers/call.js';
import { pushAudio, pullAudio } from '../controllers/intercom.js';

export function setupRoutes() {
  const router = createDolphinRouter();

  // ================= AUTH ROUTES =================
  router.post('/api/auth/register', register);
  router.post('/api/auth/login', login);
  router.post('/api/auth/refresh', refresh);
  router.post('/api/auth/logout', logout);
  router.post('/api/auth/2fa/setup', authMiddleware(), setup2FA);
  router.post('/api/auth/2fa/verify', authMiddleware(), verify2FA);

  // ================= DIRECTORY ROUTES =================
  router.get('/api/directory', getDirectory);
  router.get('/api/directory/search', searchDirectory);
  router.post('/api/directory/public-key', authMiddleware(), uploadPublicKey);
  router.get('/api/directory/public-key/:targetUserId', authMiddleware(), getPublicKey);

  // ================= CHAT & GROUP ROUTES =================
  router.get('/api/chats', authMiddleware(), getConversations);
  router.get('/api/chats/:targetUserId', authMiddleware(), getDirectChatHistory);
  router.post('/api/chats/:targetUserId', authMiddleware(), sendDirectMessage);
  
  router.get('/api/groups', authMiddleware(), getGroups);
  router.post('/api/groups', authMiddleware(), createGroup);
  router.get('/api/groups/:groupId/messages', authMiddleware(), getGroupChatHistory);
  router.post('/api/groups/:groupId/messages', authMiddleware(), sendGroupMessage);
  router.post('/api/groups/:groupId/members', authMiddleware(), addGroupMembers);
  router.delete('/api/groups/:groupId/members', authMiddleware(), leaveGroup);

  // ================= WEBRTC ROUTES =================
  router.get('/api/webrtc/turn', authMiddleware(), getTurnCredentialsHandler);

  // ================= CALL LOG ROUTES =================
  router.post('/api/calls/start', authMiddleware(), startCall);
  router.post('/api/calls/end', authMiddleware(), endCall);
  router.get('/api/calls/history', authMiddleware(), getCallHistory);

  // ================= INTERCOM AUDIO RELAY =================
  // No auth middleware — DolphinIntercom.kt sends raw PCM with no token
  router.post('/api/intercom/audio/push', pushAudio);
  router.get('/api/intercom/audio/pull', pullAudio);

  return router;
}
