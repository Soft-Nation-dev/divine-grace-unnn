// =============================================
// Cloudflare Worker - Summit Routes
// Stores summit registrations in Cloudflare KV
// =============================================

import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth';
import { saveSummitRegistration, getUserSummitRegistrations, getAllSummitRegistrations } from '../storage/kv';

const app = new Hono();

// POST /api/summit - Submit summit registration
app.post('/', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const userId = c.get('userId');

    const registration = {
      id: uuidv4(),
      user_id: userId,
      name: body.name || '',
      email: body.email || c.get('userEmail'),
      phone: body.phone || '',
      submitted_at: new Date().toISOString()
    };

    await saveSummitRegistration(c.env.SUMMIT_KV, registration);

    return c.json({
      message: 'Summit registration submitted',
      registration
    }, 201);

  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /api/summit/user/all - Get user's summit registrations
app.get('/user/all', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const registrations = await getUserSummitRegistrations(c.env.SUMMIT_KV, userId);

    return c.json({
      registrations,
      count: registrations.length
    });

  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /api/summit - Get all summit registrations (Admin only)
app.get('/', authMiddleware, async (c) => {
  try {
    const adminEmails = (c.env.ADMIN_EMAILS || '').split(',');
    if (!adminEmails.includes(c.get('userEmail'))) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const registrations = await getAllSummitRegistrations(c.env.SUMMIT_KV);

    return c.json({
      registrations,
      count: registrations.length
    });

  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

export default app;
