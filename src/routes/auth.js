// =============================================
// Cloudflare Worker - Auth Routes
// Handles signup, login, and profile management with Supabase
// =============================================

import { Hono } from 'hono';
import { getSupabaseClient } from '../storage/supabase';
import { authMiddleware } from '../middleware/auth';

const app = new Hono();

const RESET_CODE_TTL_SECONDS = 900;

const normalizeEmail = (email) => (email || '').trim().toLowerCase();

const generateResetCode = () => {
  const code = Math.floor(100000 + Math.random() * 900000);
  return String(code);
};

const hashCode = async (code) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const sendResetCodeEmail = async (env, email, code) => {
  if (!env.RESEND_API_KEY || !env.RESEND_SENDER_EMAIL) {
    throw new Error('Email service not configured');
  }

  const senderName = env.RESEND_SENDER_NAME || 'Divine Grace UNN';
  const from = `${senderName} <${env.RESEND_SENDER_EMAIL}>`;
  const logoUrl = env.RESEND_LOGO_URL || (env.R2_PUBLIC_URL ? `${env.R2_PUBLIC_URL}/email/logo.png` : '');

  const payload = {
    from,
    to: [email],
    subject: 'Your password reset code',
    html: `
      <div style="font-family: Arial, sans-serif;">
        ${logoUrl ? `<img src="${logoUrl}" alt="${senderName}" width="140" style="display:block;margin:0 auto 16px;" />` : ''}
        <p>Hello,</p>
        <p>Your password reset code is:</p>
        <h2 style="letter-spacing: 2px;">${code}</h2>
        <p>This code expires in 15 minutes.</p>
        <p>If you did not request a reset, you can ignore this email.</p>
      </div>
    `
  };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.RESEND_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend email failed: ${text}`);
  }
};

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

      try {
        const lookup = await supabase.auth.getUserByEmail(email, c.env.SUPABASE_SERVICE_KEY);
        const user = lookup?.users?.[0] || lookup?.user || null;
        const metadata = user?.user_metadata || {};

        if (metadata.migrated && !metadata.password_reset_complete) {
          return c.json({ error: 'Password reset required', code: 'MIGRATION_RESET_REQUIRED' }, 403);
        }
      } catch (lookupErr) {
        console.warn('Login lookup failed:', lookupErr?.message || lookupErr);
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
// POST /api/auth/forgot-password - Send reset code
// =============================================
app.post('/forgot-password', async (c) => {
  try {
    const body = await c.req.json();
    const email = normalizeEmail(body?.email);

    if (!email) {
      return c.json({ error: 'Email required' }, 400);
    }

    const supabase = getSupabaseClient(c.env);
    const lookup = await supabase.auth.getUserByEmail(email, c.env.SUPABASE_SERVICE_KEY);
    const user = lookup?.users?.[0] || lookup?.user || null;

    if (!user) {
      return c.json({ success: true });
    }

    const code = generateResetCode();
    const hashed = await hashCode(code);
    const key = `reset:code:${email}`;

    await c.env.LSTS_KV.put(key, JSON.stringify({ hash: hashed, createdAt: Date.now() }), {
      expirationTtl: RESET_CODE_TTL_SECONDS
    });

    await sendResetCodeEmail(c.env, email, code);

    return c.json({ success: true });
  } catch (err) {
    console.error('Forgot password error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// =============================================
// POST /api/auth/verify-reset-code - Verify code
// =============================================
app.post('/verify-reset-code', async (c) => {
  try {
    const body = await c.req.json();
    const email = normalizeEmail(body?.email);
    const code = (body?.code || '').trim();

    if (!email || !code) {
      return c.json({ error: 'Email and code required' }, 400);
    }

    const key = `reset:code:${email}`;
    const stored = await c.env.LSTS_KV.get(key);

    if (!stored) {
      return c.json({ error: 'Code expired or invalid' }, 400);
    }

    const parsed = JSON.parse(stored);
    const hashed = await hashCode(code);

    if (hashed !== parsed.hash) {
      return c.json({ error: 'Invalid code' }, 400);
    }

    await c.env.LSTS_KV.put(`reset:verified:${email}`, 'true', {
      expirationTtl: RESET_CODE_TTL_SECONDS
    });

    return c.json({ success: true });
  } catch (err) {
    console.error('Verify reset code error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// =============================================
// POST /api/auth/reset-password - Set new password
// =============================================
app.post('/reset-password', async (c) => {
  try {
    const body = await c.req.json();
    const email = normalizeEmail(body?.email);
    const newPassword = body?.newPassword || '';
    const confirmPassword = body?.confirmPassword || '';

    if (!email || !newPassword || !confirmPassword) {
      return c.json({ error: 'Email and password required' }, 400);
    }

    if (newPassword !== confirmPassword) {
      return c.json({ error: 'Passwords do not match' }, 400);
    }

    const verified = await c.env.LSTS_KV.get(`reset:verified:${email}`);
    if (!verified) {
      return c.json({ error: 'Please verify your code first' }, 400);
    }

    const supabase = getSupabaseClient(c.env);
    const lookup = await supabase.auth.getUserByEmail(email, c.env.SUPABASE_SERVICE_KEY);
    const user = lookup?.users?.[0] || lookup?.user || null;

    if (!user?.id) {
      return c.json({ error: 'User not found' }, 404);
    }

    const updateRes = await supabase.auth.updateUserPassword(user.id, newPassword, c.env.SUPABASE_SERVICE_KEY);
    if (updateRes.error) {
      return c.json({ error: updateRes.error.message }, 400);
    }

    try {
      await supabase.auth.updateUserMetadata(user.id, {
        migrated: true,
        password_reset_complete: true
      }, c.env.SUPABASE_SERVICE_KEY);
    } catch (metaErr) {
      console.warn('Could not update migration flags:', metaErr?.message || metaErr);
    }

    await c.env.LSTS_KV.delete(`reset:verified:${email}`);
    await c.env.LSTS_KV.delete(`reset:code:${email}`);

    return c.json({ success: true });
  } catch (err) {
    console.error('Reset password error:', err);
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
// POST /api/auth/logout - User logout
// =============================================
app.post('/logout', authMiddleware, async (c) => {
  // Logout is handled on client-side by removing token
  return c.json({ message: 'Logout successful' });
});

export default app;
