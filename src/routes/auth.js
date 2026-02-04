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
    const { email, password, title, fullName, full_name } = body;
    const resolvedName = fullName || full_name || '';

    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400);
    }

    const supabase = getSupabaseClient(c.env);

    // Create user in Supabase
    const signUpRes = await supabase.auth.signUp(email, password, {
      title: title || '',
      full_name: resolvedName,
      email_confirmed: true
    });

    if (signUpRes.error) {
      return c.json({ error: signUpRes.error.message }, 400);
    }

    // Update user metadata with service key to ensure it persists
    const userId = signUpRes.user?.id;
    if (userId) {
      try {
        const updateRes = await supabase.auth.updateUserMetadata(userId, {
          title: title || '',
          full_name: resolvedName
        }, c.env.SUPABASE_SERVICE_KEY);
        console.log('User metadata updated:', updateRes);
      } catch (err) {
        console.warn('Could not update user metadata:', err);
      }
    }

    return c.json({
      message: 'User created successfully',
      user: signUpRes.user || signUpRes?.user,
      session: signUpRes.session || null
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

    // Check for any error (from Supabase or from our check)
    if (signInRes.error || !signInRes.access_token) {
      // Extract error message, ensuring it's a string
      let errorMsg = 'Invalid email or password';
      
      if (typeof signInRes.error === 'string') {
        errorMsg = signInRes.error;
      } else if (signInRes.error?.message) {
        errorMsg = signInRes.error.message;
      }
      
      console.log('Login failed:', errorMsg);
      return c.json({ error: errorMsg }, 401);
    }

    return c.json({
      message: 'Login successful',
      token: signInRes.access_token,
      user: signInRes.user,
      session: {
        access_token: signInRes.access_token,
        refresh_token: signInRes.refresh_token,
        expires_in: signInRes.expires_in,
        token_type: signInRes.token_type
      }
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
    const user = c.get('user');
    const userId = c.get('userId');
    const userEmail = c.get('userEmail');

    console.log('Profile endpoint - user object:', JSON.stringify(user, null, 2));

    // Extract metadata from Supabase user object
    const metadata = user?.user_metadata || {};

    console.log('Profile endpoint - metadata:', metadata);

    const response = {
      id: userId,
      email: userEmail,
      full_name: metadata.full_name || '',
      title: metadata.title || '',
      phone_number: metadata.phone_number || '',
      is_student: metadata.is_student || false,
      department_in_school: metadata.department_in_school || '',
      level: metadata.level || ''
    };

    console.log('Profile endpoint - response:', response);

    return c.json(response);

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

    // Update user metadata in Supabase using service key
    const updateRes = await supabase.auth.updateUserMetadata(userId, body, c.env.SUPABASE_SERVICE_KEY);

    if (updateRes.error) {
      console.error('Update user metadata error:', updateRes.error);
      return c.json({ error: updateRes.error.message }, 400);
    }

    return c.json({
      message: 'Profile updated successfully',
      user: updateRes.user || updateRes
    });

  } catch (err) {
    console.error('Profile update error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// =============================================
// POST /api/auth/backfill-metadata - Backfill user metadata (temporary)
// =============================================
app.post('/backfill-metadata', async (c) => {
  try {
    const body = await c.req.json();
    const { userId, email, full_name, title } = body;

    if (!userId || !email || !full_name) {
      return c.json({ error: 'userId, email, and full_name required' }, 400);
    }

    const supabase = getSupabaseClient(c.env);

    // Update user metadata using service key
    const updateRes = await supabase.auth.updateUserMetadata(userId, {
      full_name,
      title: title || ''
    }, c.env.SUPABASE_SERVICE_KEY);

    if (updateRes.error) {
      console.error('Backfill error:', updateRes.error);
      return c.json({ error: updateRes.error.message }, 400);
    }

    console.log('Metadata backfilled for', email);

    return c.json({
      message: 'Metadata updated successfully',
      user: updateRes.user
    });

  } catch (err) {
    console.error('Backfill error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// =============================================
// DELETE /api/auth/delete-user - Delete user by ID (temporary)
// =============================================
app.delete('/delete-user', async (c) => {
  try {
    const body = await c.req.json();
    const { userId } = body;

    if (!userId) {
      return c.json({ error: 'userId required' }, 400);
    }

    const supabase = getSupabaseClient(c.env);

    // Delete user using service key
    const deleteRes = await fetch(
      `${c.env.SUPABASE_URL}/auth/v1/admin/users/${userId}`,
      {
        method: 'DELETE',
        headers: {
          apikey: c.env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${c.env.SUPABASE_SERVICE_KEY}`
        }
      }
    );

    if (!deleteRes.ok) {
      const error = await deleteRes.json();
      console.error('Delete user error:', error);
      return c.json({ error: error.message || 'Failed to delete user' }, 400);
    }

    console.log('User deleted:', userId);

    return c.json({
      message: 'User deleted successfully',
      userId
    });

  } catch (err) {
    console.error('Delete user error:', err);
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
