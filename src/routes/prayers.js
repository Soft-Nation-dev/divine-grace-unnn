// =============================================
// Cloudflare Worker - Prayer Routes
// Stores prayer requests in Cloudflare KV
// =============================================

import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth';
import { savePrayerRequest, getPrayerRequest, getAllPrayers } from '../storage/kv';

const app = new Hono();

// POST /api/prayers - Submit prayer request
app.post('/', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const userId = c.get('userId');

    const prayer = {
      id: uuidv4(),
      user_id: userId,
      name: body.name || '',
      prayer_request: body.prayer_request || body.prayerRequest || '',
      submitted_at: new Date().toISOString()
    };

    await savePrayerRequest(c.env.PRAYERS_KV, prayer);

    return c.json({
      message: 'Prayer request submitted',
      prayer
    }, 201);

  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /api/prayers - Get all prayers (Admin only)
app.get('/', authMiddleware, async (c) => {
  try {
    const adminEmails = (c.env.ADMIN_EMAILS || '').split(',');
    if (!adminEmails.includes(c.get('userEmail'))) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const prayers = await getAllPrayers(c.env.PRAYERS_KV);

    return c.json({
      data: prayers,
      count: prayers.length
    });

  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

export default app;
