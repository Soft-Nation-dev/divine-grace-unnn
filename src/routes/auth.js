// =============================================
// Cloudflare Worker - Auth Routes
// Handles signup, login, and profile management with Supabase
// =============================================

import { Hono } from 'hono';
import { getSupabaseClient } from '../storage/supabase';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const app = new Hono();

const normalizeEmail = (email) => (email || '').trim().toLowerCase();

const getRecoveryRedirectUrl = (c) => {
  const configured = c.env.FRONTEND_URL;
  if (configured) {
    return `${configured.replace(/\/$/, '')}/login`;
  }

  const origin = c.req.header('Origin');
  if (origin) {
    return `${origin.replace(/\/$/, '')}/login`;
  }

  const referer = c.req.header('Referer');
  if (referer) {
    try {
      const url = new URL(referer);
      return `${url.origin}/login`;
    } catch (err) {
      console.warn('Invalid referer URL:', err?.message || err);
    }
  }

  return null;
};

const generateStrongPassword = (length = 18) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+[]{}';
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
};

const listAdminUsers = async (env, page = 1, perPage = 100) => {
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
    {
      method: 'GET',
      headers: {
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`
      }
    }
  );

  const data = await res.json();
  if (!res.ok) {
    const message = data?.error?.message || data?.error || data?.message || 'Failed to list users';
    return { error: message, statusCode: res.status };
  }

  return data;
};

// =============================================
// POST /api/auth/signup - User registration
// =============================================
app.post('/signup', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, title, fullName, full_name } = body;
    const resolvedName = fullName || full_name || '';
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return c.json({ error: 'Email and password required' }, 400);
    }

    const supabase = getSupabaseClient(c.env);

    const signUpRes = await supabase.auth.signUp(normalizedEmail, password, {
      title: title || '',
      full_name: resolvedName,
      email_confirmed: true
    });

    if (signUpRes.error) {
      return c.json({ error: signUpRes.error.message }, 400);
    }

    const userId = signUpRes.user?.id;
    if (userId) {
      try {
        await supabase.auth.updateUserMetadata(userId, {
          title: title || '',
          full_name: resolvedName
        }, c.env.SUPABASE_SERVICE_KEY);
      } catch (err) {
        console.warn('Could not update user metadata:', err?.message || err);
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
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = (password || '').trim();

    if (!normalizedEmail || !normalizedPassword) {
      return c.json({ error: 'Email and password required' }, 400);
    }

    const supabase = getSupabaseClient(c.env);
    const signInRes = await supabase.auth.signIn(normalizedEmail, normalizedPassword);

    if (signInRes.error || !signInRes.access_token) {
      let errorMsg = 'Invalid email or password';

      if (typeof signInRes.error === 'string') {
        errorMsg = signInRes.error;
      } else if (signInRes.error?.message) {
        errorMsg = signInRes.error.message;
      }

      try {
        const lookup = await supabase.auth.getUserByEmail(normalizedEmail, c.env.SUPABASE_SERVICE_KEY);
        const user = lookup?.users?.[0] || lookup?.user || null;
        const metadata = user?.user_metadata || {};

        if (metadata.migrated && !metadata.password_reset_complete) {
          return c.json({ error: 'Password reset required', code: 'MIGRATION_RESET_REQUIRED' }, 403);
        }
      } catch (lookupErr) {
        console.warn('Login lookup failed:', lookupErr?.message || lookupErr);
      }

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
// POST /api/auth/forgot-password - Send recovery email
// =============================================
app.post('/forgot-password', async (c) => {
  try {
    const body = await c.req.json();
    const email = normalizeEmail(body?.email);

    if (!email) {
      return c.json({ error: 'Email required' }, 400);
    }

    const redirectTo = getRecoveryRedirectUrl(c);
    if (!redirectTo) {
      return c.json({ error: 'Missing redirect URL for password recovery' }, 500);
    }

    const res = await fetch(`${c.env.SUPABASE_URL}/auth/v1/recover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: c.env.SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ email, redirect_to: redirectTo })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data?.error_description || data?.error || data?.msg || data?.message || 'Failed to send reset link';
      return c.json({ error: message }, res.status);
    }

    return c.json({ success: true });
  } catch (err) {
    console.error('Forgot password error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// =============================================
// POST /api/auth/recover-password - Set new password via recovery token
// =============================================
app.post('/recover-password', async (c) => {
  try {
    const body = await c.req.json();
    const accessToken = (body?.access_token || '').trim();
    const newPassword = (body?.newPassword || '').trim();
    const confirmPassword = (body?.confirmPassword || '').trim();

    if (!accessToken || !newPassword || !confirmPassword) {
      return c.json({ error: 'Token and password required' }, 400);
    }

    if (newPassword !== confirmPassword) {
      return c.json({ error: 'Passwords do not match' }, 400);
    }

    const res = await fetch(`${c.env.SUPABASE_URL}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        apikey: c.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ password: newPassword })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = data?.error_description || data?.error || data?.msg || data?.message || 'Password update failed';
      return c.json({ error: message }, res.status);
    }

    const userId = data?.id || data?.user?.id || null;
    if (userId) {
      try {
        const supabase = getSupabaseClient(c.env);
        await supabase.auth.updateUserMetadata(userId, {
          migrated: true,
          password_reset_complete: true
        }, c.env.SUPABASE_SERVICE_KEY);
      } catch (metaErr) {
        console.warn('Recover password metadata update failed:', metaErr?.message || metaErr);
      }
    }

    return c.json({ success: true });
  } catch (err) {
    console.error('Recover password error:', err);
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
    const metadata = user?.user_metadata || {};

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
// POST /api/auth/logout - User logout
// =============================================
app.post('/logout', authMiddleware, async (c) => c.json({ message: 'Logout successful' }));

// =============================================
// POST /api/auth/admin/reissue-passwords - Batch reset migrated users
// =============================================
app.post('/admin/reissue-passwords', authMiddleware, adminMiddleware, async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const limit = Number(body?.limit ?? 50);
    const includePasswords = body?.includePasswords !== false;
    const probe = body?.probe !== false;
    const perPage = Number(body?.perPage ?? 100);

    const supabase = getSupabaseClient(c.env);
    const results = [];
    let processed = 0;
    let page = 1;

    while (true) {
      const listRes = await listAdminUsers(c.env, page, perPage);
      if (listRes?.error) {
        return c.json({ error: listRes.error }, listRes.statusCode || 500);
      }

      const users = Array.isArray(listRes?.users) ? listRes.users : [];
      if (users.length === 0) break;

      for (const user of users) {
        const metadata = user?.user_metadata || {};
        if (!metadata.migrated) continue;

        const tempPassword = generateStrongPassword();
        const updateRes = await supabase.auth.updateUserPassword(user.id, tempPassword, c.env.SUPABASE_SERVICE_KEY);
        const updateError = updateRes?.error?.message || updateRes?.error || null;

        let probeError = null;
        let probeStatus = null;

        if (!updateError && probe) {
          const signInProbe = await supabase.auth.signIn(user.email, tempPassword);
          probeError = signInProbe?.error || null;
          probeStatus = signInProbe?.statusCode || null;
        }

        if (!updateError) {
          try {
            await supabase.auth.updateUserMetadata(user.id, {
              ...metadata,
              password_reset_complete: true
            }, c.env.SUPABASE_SERVICE_KEY);
          } catch (metaErr) {
            console.warn('Password reissue metadata update failed:', metaErr?.message || metaErr);
          }
        }

        const entry = {
          email: user.email,
          user_id: user.id,
          status: updateError ? 'error' : 'updated',
          error: updateError || null,
          login_probe_error: probeError || null,
          login_probe_status: probeStatus || null
        };

        if (includePasswords) {
          entry.temp_password = tempPassword;
        }

        results.push(entry);
        processed += 1;

        if (limit > 0 && processed >= limit) break;
      }

      if (limit > 0 && processed >= limit) break;
      page += 1;
    }

    return c.json({
      success: true,
      processed,
      results
    });
  } catch (err) {
    console.error('Reissue passwords error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// =============================================
// GET /api/auth/admin/migrated-count - Count migrated users
// =============================================
app.get('/admin/migrated-count', authMiddleware, adminMiddleware, async (c) => {
  try {
    const perPage = Number(c.req.query('perPage') ?? 200);
    let page = 1;
    let total = 0;

    while (true) {
      const listRes = await listAdminUsers(c.env, page, perPage);
      if (listRes?.error) {
        return c.json({ error: listRes.error }, listRes.statusCode || 500);
      }

      const users = Array.isArray(listRes?.users) ? listRes.users : [];
      if (users.length === 0) break;

      for (const user of users) {
        if (user?.user_metadata?.migrated) total += 1;
      }

      page += 1;
    }

    return c.json({ success: true, migrated_count: total });
  } catch (err) {
    console.error('Migrated count error:', err);
    return c.json({ error: err.message }, 500);
  }
});

export default app;