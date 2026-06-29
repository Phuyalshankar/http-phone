import { createDolphinServer } from 'dolphin-server-modules/server';
import { setupRoutes } from './routes/routes.js';
import { handleRealtimeConnection, handleSignalingConnection } from './realtime/realtime.js';
import fs from 'fs';
import path from 'path';

export function createApp() {
  const app = createDolphinServer();

  // 1. Global CORS Middleware
  app.use((ctx: any, next?: Function) => {
    ctx.setHeader('Access-Control-Allow-Origin', '*');
    ctx.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    ctx.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (ctx.req.method === 'OPTIONS') {
      ctx.status(204).json({});
      return;
    }
    
    if (next) next();
  });

  // 2. Global Error Handler Middleware
  app.use(async (ctx: any, next?: Function) => {
    try {
      if (next) await next();
    } catch (err: any) {
      console.error('🔥 [SYSTEM ERROR]:', err.message);
      ctx.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV !== 'production' ? err.stack : undefined
      });
    }
  });

  // Serve the compiled APK directly from the backend
  app.get('/download-apk', (ctx: any) => {
    // Note: the backend runs with CWD = D:\http-phone
    const apkPath = path.resolve(process.cwd(), 'frontend/http-phone/.dolphin-android/app/build/outputs/apk/debug/app-debug.apk');
    if (fs.existsSync(apkPath)) {
      ctx.setHeader('Content-Type', 'application/vnd.android.package-archive');
      ctx.setHeader('Content-Disposition', 'attachment; filename="app-debug.apk"');
      const stat = fs.statSync(apkPath);
      ctx.setHeader('Content-Length', stat.size);
      const stream = fs.createReadStream(apkPath);
      stream.pipe(ctx.res);
    } else {
      ctx.status(404).json({ error: 'APK not found at ' + apkPath });
    }
  });

  // 3. Register HTTP Routes
  app.use('', setupRoutes());

  // 4. WebSocket Multiplexing on app.wss
  app.wss.on('connection', (ws: any, request: any) => {
    try {
      const parsedUrl = new URL(request.url!, `http://${request.headers.host || 'localhost'}`);
      const pathname = parsedUrl.pathname;
      
      const token = parsedUrl.searchParams.get('token') || '';
      const deviceId = parsedUrl.searchParams.get('deviceId') || `device-${Date.now()}`;
      const platform = parsedUrl.searchParams.get('platform') || 'web';

      if (pathname === '/realtime') {
        handleRealtimeConnection(ws, token, deviceId, platform);
      } else if (pathname === '/phone') {
        handleSignalingConnection(ws, token);
      } else {
        console.log(`⚠️ Unmatched WebSocket upgrade request: ${pathname}`);
        ws.close(4004, 'Not Found');
      }
    } catch (err: any) {
      console.error('❌ WebSocket upgrade error:', err.message);
      ws.close(1011, 'Internal upgrade error');
    }
  });

  return app;
}
