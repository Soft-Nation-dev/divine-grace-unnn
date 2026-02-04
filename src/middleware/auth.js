// =============================================
// Cloudflare Worker - Auth Middleware
// Validates JWT tokens from Supabase
// =============================================

import { jwtVerify } from 'jose';

export const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    // Get Supabase JWT secret from environment
    const jwtSecret = new TextEncoder().encode(
      c.env.SUPABASE_JWT_SECRET || 'your-super-secret-jwt-key'
    );

    // Verify JWT token
    const { payload } = await jwtVerify(token, jwtSecret);

    // Store user info in context
    c.set('userId', payload.sub);
    c.set('userEmail', payload.email);
    c.set('user', payload);

    await next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }
};

export const adminMiddleware = async (c, next) => {
  const adminEmail = c.env.ADMIN_EMAILS?.split(',') || [];
  const userEmail = c.get('userEmail');

  if (!adminEmail.includes(userEmail)) {
    return c.json({ error: 'Forbidden - Admin access required' }, 403);
  }

  await next();
};
