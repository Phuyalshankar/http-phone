import { createAuth } from 'dolphin-server-modules/auth';
import { createMongooseAdapter } from 'dolphin-server-modules/adapters/mongoose';
import { User } from '../models/user.js';
import { RefreshToken } from '../models/refreshToken.js';

// Setup Mongoose Adapter for dolphin auth
const dbAdapter = createMongooseAdapter({
  User,
  RefreshToken,
  models: { User, RefreshToken }
});

// Setup Dolphin Auth Service
export const authService = createAuth({
  secret: process.env.ENCRYPTION_KEY || 'd0lph1n_s3cr3t_p@ss_k3y_http_phone_2026',
  cookieMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  secureCookies: process.env.NODE_ENV === 'production',
  accessTokenExpiresIn: '10080m' // 1 week
} as any);

// Custom Auth Middleware to bypass the dolphin-server promise hang bug
export function authMiddleware(opts: { require2FA?: boolean } = {}) {
  return async (ctx: any, next?: Function) => {
    try {
      const authHeader = ctx.req.headers?.authorization || ctx.req.req?.headers?.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        ctx.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token format' });
        if (next) next(); // Resolve server.ts route promise
        return;
      }

      const token = authHeader.substring(7);
      const decoded = await authService.verifyToken(token);
      
      if (opts.require2FA && decoded.twoFactorVerified !== true) {
        ctx.status(403).json({ success: false, message: 'Forbidden: 2FA verification required' });
        if (next) next();
        return;
      }

      // Populate user info in context
      ctx.state.user = decoded;
      ctx.req.user = decoded; // for backward compatibility

      if (next) next(); // Resolve server.ts route promise
    } catch (error: any) {
      ctx.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired token' });
      if (next) next();
    }
  };
}

// Handler: User Registration
export async function register(ctx: any) {
  let { email, password, extension, name } = ctx.body;

  if (typeof email === 'string') {
    email = email.trim();
  }

  if (!email || !password || !extension || !name) {
    ctx.status(400);
    return { success: false, message: 'Required fields: email, password, extension, name' };
  }

  try {
    // Check if extension or email is already taken
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      ctx.status(400);
      return { success: false, message: 'Email is already registered' };
    }

    const existingExt = await User.findOne({ extension });
    if (existingExt) {
      ctx.status(400);
      return { success: false, message: 'Extension number is already in use' };
    }

    // Register user via Dolphin Auth (handles password hashing)
    const user = await authService.register(dbAdapter, { email, password });
    
    // Update newly created user with their extension and name
    await User.findByIdAndUpdate(user.id, { extension, name });

    ctx.status(201);
    return {
      success: true,
      message: 'User registered successfully',
      user: { id: user.id, email, extension, name }
    };
  } catch (error: any) {
    ctx.status(500);
    return { success: false, message: error.message };
  }
}

// Handler: User Login
export async function login(ctx: any) {
  let { email, password, totp, recovery } = ctx.body;

  if (typeof email === 'string') {
    email = email.trim();
  }

  if (!email || !password) {
    ctx.status(400);
    return { success: false, message: 'Email and password are required' };
  }

  try {
    // Login via Dolphin Auth (handles password verification and JWT token generation)
    // Pass res object to enable setting cookies if client uses them
    const result = await authService.login(dbAdapter, { email, password, totp, recovery }, ctx.res);
    
    // Fetch extension and name
    const dbUser = await User.findById(result.user.id);

    return {
      success: true,
      message: 'Login successful',
      accessToken: result.accessToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: dbUser?.name || '',
        extension: dbUser?.extension || '',
        twoFactorEnabled: result.user.twoFactorEnabled
      }
    };
  } catch (error: any) {
    ctx.status(error.status || 401);
    return { success: false, message: error.message };
  }
}

// Handler: Token Refresh
export async function refresh(ctx: any) {
  // Try to read from cookie 'rt' or from request body
  const cookies = ctx.req.headers.cookie || '';
  let token = ctx.body.refreshToken;

  if (!token && cookies) {
    const match = cookies.match(/rt=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) {
    ctx.status(400);
    return { success: false, message: 'Refresh token is required' };
  }

  try {
    const result = await authService.refresh(dbAdapter, token, ctx.res);
    return {
      success: true,
      accessToken: result.accessToken
    };
  } catch (error: any) {
    ctx.status(401);
    return { success: false, message: error.message };
  }
}

// Handler: Setup 2FA
export async function setup2FA(ctx: any) {
  const userId = ctx.state.user?.id;
  if (!userId) {
    ctx.status(401);
    return { success: false, message: 'Unauthorized' };
  }

  try {
    const result = await authService.enable2FA(dbAdapter, userId);
    return {
      success: true,
      qrCodeUri: result.uri,
      secret: result.secret
    };
  } catch (error: any) {
    ctx.status(500);
    return { success: false, message: error.message };
  }
}

// Handler: Verify 2FA and enable it
export async function verify2FA(ctx: any) {
  const userId = ctx.state.user?.id;
  const { code } = ctx.body;

  if (!userId) {
    ctx.status(401);
    return { success: false, message: 'Unauthorized' };
  }

  if (!code) {
    ctx.status(400);
    return { success: false, message: 'Verification code is required' };
  }

  try {
    const result = await authService.verify2FA(dbAdapter, userId, code);
    return {
      success: true,
      message: '2FA enabled successfully',
      recoveryCodes: result.recoveryCodes
    };
  } catch (error: any) {
    ctx.status(400);
    return { success: false, message: error.message };
  }
}

// Handler: Logout
export async function logout(ctx: any) {
  const cookies = ctx.req.headers.cookie || '';
  let token = ctx.body.refreshToken;

  if (!token && cookies) {
    const match = cookies.match(/rt=([^;]+)/);
    if (match) token = match[1];
  }

  if (token) {
    try {
      await authService.logout(dbAdapter, token);
    } catch (e) {
      // Ignore token deletion issues during logout
    }
  }

  return { success: true, message: 'Logged out successfully' };
}
