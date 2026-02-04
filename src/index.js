// =============================================
// Cloudflare Worker - Divine Grace API
// Main entry point using Hono framework
// =============================================

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRoutes from './routes/auth';
import lstsRoutes from './routes/lsts';
import prayerRoutes from './routes/prayers';
import summitRoutes from './routes/summit';
import messageRoutes from './routes/messages';
import adminRoutes from './routes/admin';
import { authMiddleware } from './middleware/auth';

const app = new Hono();

// =============================================
// CORS Configuration
// =============================================
app.use('*', cors({
  origin: [
    'https://divinegraceunn.com.ng',
    'https://soft-nation-dev.github.io',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600
}));

// =============================================
// Health Check
// =============================================
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'production'
  });
});

// =============================================
// API Routes
// =============================================

// Auth routes (no authentication required for signup/login)
app.route('/api/auth', authRoutes);

// Protected routes (require authentication)
app.route('/api/lsts', lstsRoutes);
app.route('/api/prayers', prayerRoutes);
app.route('/api/summit', summitRoutes);
app.route('/api/messages', messageRoutes);
app.route('/api/admin', adminRoutes);

// =============================================
// Error Handling
// =============================================
app.onError((err, c) => {
  console.error('API Error:', err);
  
  if (err.message.includes('Unauthorized')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  if (err.message.includes('Forbidden')) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  
  if (err.message.includes('Not found')) {
    return c.json({ error: 'Not found' }, 404);
  }
  
  return c.json({
    error: err.message || 'Internal server error',
    status: 500
  }, 500);
});

// =============================================
// 404 Handler
// =============================================
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Export for Cloudflare Workers
export default app;
