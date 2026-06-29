import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import { connectDB } from './config/db.js';
import { createApp } from './app.js';

async function bootstrap() {
  // 1. Connect to local MongoDB
  await connectDB();

  // 2. Initialize the application
  const app = createApp();

  // 3. Define host and port
  const port = parseInt(process.env.PORT || '3000');

  // 4. Start listening
  app.listen(port, () => {
    console.log(`
    =======================================================
    🐬 HTTP-Intercom Phone Server is running successfully! 🐬
    
    🌐 Server URL: http://localhost:${port}
    📡 WebSocket /realtime (Presence, Chat, Groups)
    📞 WebSocket /phone (WebRTC Signaling)
    
    Status: Active and Listening...
    =======================================================
    `);
  });
}

bootstrap().catch(err => {
  console.error('❌ Bootstrapping failed:', err);
  process.exit(1);
});
