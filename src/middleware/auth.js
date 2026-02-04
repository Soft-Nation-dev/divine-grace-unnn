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
    const supabaseUrl = c.env.SUPABASE_URL;
    const supabaseKey = c.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: 'GET',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const user = await res.json();
        c.set('userId', user.id);
        c.set('userEmail', user.email);
        c.set('user', user);
        await next();
        return;
      }
    }

    // Fallback: verify JWT token directly
    const jwtSecret = new TextEncoder().encode(
      c.env.SUPABASE_JWT_SECRET || c.env.JWT_SECRET || 'your-super-secret-jwt-key'
    );

    const { payload } = await jwtVerify(token, jwtSecret);

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
