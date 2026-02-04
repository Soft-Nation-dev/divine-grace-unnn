// =============================================
// Cloudflare Worker - Admin Routes
// Handles admin-only operations
// =============================================

import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { getSupabaseClient } from '../storage/supabase';

const app = new Hono();

// GET /api/admin/check - Check if user is admin
app.get('/check', authMiddleware, async (c) => {
  try {
    const userEmail = c.get('userEmail');
    const adminEmails = (c.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());

    const isAdmin = adminEmails.includes(userEmail);

    return c.json({
      is_admin: isAdmin,
      isAdmin,
      email: userEmail
    });

  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/admin/assign - Assign admin role
app.post('/assign', authMiddleware, async (c) => {
  try {
    const userEmail = c.get('userEmail');
    const adminEmails = (c.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());

    // Only super admin can assign roles
    const superAdminEmail = c.env.SUPER_ADMIN_EMAIL;
    if (userEmail !== superAdminEmail) {
      return c.json({ error: 'Only super admin can assign roles' }, 403);
    }

    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json({ error: 'Email required' }, 400);
    }

    // Note: In production, you'd update this in your admin database or secret
    // For now, this returns a guide for manual update
    return c.json({
      message: 'To assign admin role, add email to ADMIN_EMAILS environment variable in Cloudflare',
      email,
      instruction: `Add "${email}" to ADMIN_EMAILS comma-separated list in your Cloudflare Worker settings`
    });

  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /api/admin/dashboard - Get admin dashboard stats
app.get('/dashboard', authMiddleware, async (c) => {
  try {
    const adminEmails = (c.env.ADMIN_EMAILS || '').split(',');
    if (!adminEmails.includes(c.get('userEmail'))) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    // Get stats from KV
    const lstsCount = await c.env.LSTS_KV.get('index:lsts:stats:count') || '0';
    const prayersCount = await c.env.PRAYERS_KV.get('index:prayers:stats:count') || '0';
    const summitCount = await c.env.SUMMIT_KV.get('index:summit:stats:count') || '0';

    return c.json({
      stats: {
        lsts_registrations: parseInt(lstsCount),
        prayer_requests: parseInt(prayersCount),
        summit_registrations: parseInt(summitCount)
      },
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

export default app;
