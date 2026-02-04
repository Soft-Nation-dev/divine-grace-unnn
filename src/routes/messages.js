// =============================================
// Cloudflare Worker - Messages Routes
// Handles message uploads to Cloudflare R2
// =============================================

import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth';

const app = new Hono();

// POST /api/messages/upload - Upload audio/media
app.post('/upload', authMiddleware, async (c) => {
  try {
    const body = await c.req.formData();
    const file = body.get('file');
    const title = body.get('title') || 'Untitled';
    const category = body.get('category') || 'Sunday';
    const speaker = body.get('speaker') || 'Unknown';
    const date = body.get('date') || new Date().toISOString().split('T')[0];

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    const buffer = await file.arrayBuffer();
    const filename = `${category}/${date}-${uuidv4()}-${file.name}`;

    // Upload to R2
    await c.env.R2_BUCKET.put(filename, buffer, {
      metadata: {
        title,
        category,
        speaker,
        date,
        uploadedAt: new Date().toISOString()
      }
    });

    const url = `${c.env.R2_PUBLIC_URL}/${filename}`;

    return c.json({
      message: 'File uploaded successfully',
      url,
      filename
    }, 201);

  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /api/messages - Get all messages (Admin only)
app.get('/', authMiddleware, async (c) => {
  try {
    const adminEmails = (c.env.ADMIN_EMAILS || '').split(',');
    if (!adminEmails.includes(c.get('userEmail'))) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const list = await c.env.R2_BUCKET.list();

    const messages = list.objects.map(obj => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
      metadata: obj.customMetadata || {}
    }));

    return c.json({
      messages,
      count: messages.length
    });

  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /api/messages/public/all - Get all public messages
app.get('/public/all', async (c) => {
  try {
    const list = await c.env.R2_BUCKET.list();

    const messages = list.objects.map(obj => ({
      key: obj.key,
      url: `${c.env.R2_PUBLIC_URL}/${obj.key}`,
      metadata: obj.customMetadata || {}
    }));

    return c.json({
      messages,
      count: messages.length
    });

  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// DELETE /api/messages/:filename - Delete a message (Admin only)
app.delete('/:filename', authMiddleware, async (c) => {
  try {
    const adminEmails = (c.env.ADMIN_EMAILS || '').split(',');
    if (!adminEmails.includes(c.get('userEmail'))) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const filename = c.req.param('filename');
    await c.env.R2_BUCKET.delete(filename);

    return c.json({ message: 'File deleted successfully' });

  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

export default app;
