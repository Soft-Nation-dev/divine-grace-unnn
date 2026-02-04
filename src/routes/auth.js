// =============================================
// Cloudflare Worker - Auth Routes
// Handles signup, login, and profile management with Supabase
// =============================================

import { Hono } from 'hono';
import { getSupabaseClient } from '../storage/supabase';
import { authMiddleware } from '../middleware/auth';

const app = new Hono();

// =============================================
// POST /api/auth/signup - User registration
// =============================================
app.post('/signup', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, title, fullName } = body;

    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400);
    }

    const supabase = getSupabaseClient(c.env);

    // Create user in Supabase
    const signUpRes = await supabase.auth.signUp(email, password, {
      title: title || '',
      full_name: fullName || '',
      email_confirmed: true
    });

    if (signUpRes.error) {
      return c.json({ error: signUpRes.error.message }, 400);
    }

    return c.json({
      message: 'User created successfully',
      user: signUpRes.user,
      session: signUpRes.session
    }, 201);

  } catch (err) {
    console.error('Signup error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// =============================================
// POST /api/auth/login - User login
// =============================================
app.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400);
    }

    const supabase = getSupabaseClient(c.env);

    // Sign in user
    const signInRes = await supabase.auth.signIn(email, password);

    if (signInRes.error) {
      return c.json({ error: signInRes.error.message }, 401);
    }

    return c.json({
      message: 'Login successful',
      user: signInRes.user,
      session: signInRes.session
    });

  } catch (err) {
    console.error('Login error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// =============================================
// GET /api/auth/profile - Get current user profile
// =============================================
app.get('/profile', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const userEmail = c.get('userEmail');

    const supabase = getSupabaseClient(c.env);

    // Query user metadata from Supabase
    const users = await supabase.database.query('users', { id: userId });
    const user = users[0] || {};

    return c.json({
      id: userId,
      email: userEmail,
      full_name: user.full_name || '',
      title: user.title || '',
      phone_number: user.phone_number || '',
      is_student: user.is_student || false,
      department_in_school: user.department_in_school || '',
      level: user.level || ''
    });

  } catch (err) {
    console.error('Profile fetch error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// =============================================
// PUT /api/auth/profile - Update user profile
// =============================================
app.put('/profile', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();

    const supabase = getSupabaseClient(c.env);

    // Update user metadata
    await supabase.database.update('users', body, { id: userId });

    return c.json({
      message: 'Profile updated successfully',
      user: body
    });

  } catch (err) {
    console.error('Profile update error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// =============================================
// POST /api/auth/logout - User logout
// =============================================
app.post('/logout', authMiddleware, async (c) => {
  // Logout is handled on client-side by removing token
  return c.json({ message: 'Logout successful' });
});

export default app;
