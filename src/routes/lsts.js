// =============================================
// Cloudflare Worker - LSTS Routes
// Stores registrations in Cloudflare KV
// =============================================

import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth';
import {
  saveLstsRegistration,
  getLstsRegistration,
  getUserLstsRegistrations,
  getWeeklyLstsRegistrations,
  getAllLstsRegistrations
} from '../storage/kv';
import { getSupabaseClient } from '../storage/supabase';

const app = new Hono();

// =============================================
// Helper: Get week range
// =============================================
const getWeekRange = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7;

  const monday = new Date(d);
  monday.setDate(d.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);

  return { monday, friday };
};

// =============================================
// POST /api/lsts - Submit LSTS registration
// =============================================
app.post('/', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const userId = c.get('userId');
    const userEmail = c.get('userEmail');

    const {
      title = '',
      surname = '',
      other_names = body.otherNames || '',
      phone_number = body.phoneNumber || '',
      email = userEmail,
      residential_address = body.residentialAddress || '',
      gender = '',
      is_baptized = body.baptized === 'Yes' || body.is_baptized === true,
      department_in_church = body.departmentInChurch || [],
      position_in_church = body.positionInChurch || '',
      is_student = body.Student === 'Yes' || body.is_student === true,
      department_in_school = body.departmentInSchool || '',
      level = '',
      vision_goals = body.visionGoals || ''
    } = body;

    // Validation
    if (!surname || !other_names || !phone_number || !email || !residential_address || !gender) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const registration = {
      id: uuidv4(),
      user_id: userId,
      title,
      surname,
      other_names,
      phone_number,
      email,
      residential_address,
      gender,
      is_baptized,
      department_in_church,
      position_in_church,
      is_student,
      department_in_school,
      level,
      vision_goals,
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    // Save to Cloudflare KV
    await saveLstsRegistration(c.env.LSTS_KV, registration);

    // Update user metadata in Supabase
    const supabase = getSupabaseClient(c.env);
    await supabase.database.update('users', {
      full_name: `${title} ${surname} ${other_names}`.trim(),
      phone_number,
      is_student,
      department_in_school,
      level
    }, { id: userId });

    return c.json({
      message: '✅ LSTS registration submitted successfully',
      registration
    }, 201);

  } catch (err) {
    console.error('LSTS submit error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// =============================================
// GET /api/lsts/user/week - Get user's current week LSTS
// =============================================
app.get('/user/week', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { monday, friday } = getWeekRange();

    const registrations = await getUserLstsRegistrations(c.env.LSTS_KV, userId);
    const weekFiltered = registrations.filter(reg => {
      const d = new Date(reg.submitted_at);
      return d >= monday && d <= friday;
    });

    return c.json({
      registrations: weekFiltered,
      count: weekFiltered.length,
      week_range: {
        start: monday.toISOString(),
        end: friday.toISOString()
      },
      has_registered_this_week: weekFiltered.length > 0
    });

  } catch (err) {
    console.error('User week LSTS fetch error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// =============================================
// GET /api/lsts/user/all - Get user's all LSTS registrations
// =============================================
app.get('/user/all', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const registrations = await getUserLstsRegistrations(c.env.LSTS_KV, userId);

    return c.json({
      registrations,
      count: registrations.length
    });

  } catch (err) {
    console.error('User LSTS fetch error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// =============================================
// GET /api/lsts/weekly - Get current week LSTS (Admin only)
// =============================================
app.get('/weekly', authMiddleware, async (c) => {
  try {
    // Check admin status
    const adminEmails = (c.env.ADMIN_EMAILS || '').split(',');
    if (!adminEmails.includes(c.get('userEmail'))) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { monday } = getWeekRange();
    const weekNum = Math.ceil(monday.getDate() / 7);
    const monthName = monday.toLocaleString('default', { month: 'long' });
    const year = monday.getFullYear();

    const registrations = await getWeeklyLstsRegistrations(c.env.LSTS_KV);

    return c.json({
      weekLabel: `LSTS registrations for the ${weekNum} week of ${monthName} ${year}`,
      registrations,
      count: registrations.length,
      weekRange: {
        start: monday.toISOString().split('T')[0],
        end: new Date(monday.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    });

  } catch (err) {
    console.error('Weekly LSTS fetch error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// =============================================
// GET /api/lsts - Get all LSTS (Admin only)
// =============================================
app.get('/', authMiddleware, async (c) => {
  try {
    // Check admin status
    const adminEmails = (c.env.ADMIN_EMAILS || '').split(',');
    if (!adminEmails.includes(c.get('userEmail'))) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const registrations = await getAllLstsRegistrations(c.env.LSTS_KV);

    return c.json({
      registrations,
      count: registrations.length
    });

  } catch (err) {
    console.error('LSTS fetch error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// =============================================
// GET /api/lsts/:id - Get specific LSTS registration
// =============================================
app.get('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const registration = await getLstsRegistration(c.env.LSTS_KV, id);

    if (!registration) {
      return c.json({ error: 'Registration not found' }, 404);
    }

    // Only owner or admin can view
    const userId = c.get('userId');
    const adminEmails = (c.env.ADMIN_EMAILS || '').split(',');
    
    if (registration.user_id !== userId && !adminEmails.includes(c.get('userEmail'))) {
      return c.json({ error: 'Permission denied' }, 403);
    }

    return c.json({ registration });

  } catch (err) {
    console.error('LSTS fetch error:', err);
    return c.json({ error: err.message }, 500);
  }
});

export default app;
