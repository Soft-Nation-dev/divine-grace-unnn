// =============================================
// Audio Messages Routes (with Cloudflare R2)
// =============================================

const express = require("express");
const router = express.Router();
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const { supabaseAdmin } = require("./backend-config-supabase");
const { uploadToR2, deleteFromR2 } = require("./backend-config-cloudflare");
const { authMiddleware, adminMiddleware } = require("./backend-middleware-auth");

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    // Only allow audio files
    const allowedMimes = [
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/mp3",
      "audio/aac",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed"));
    }
  },
});

// =============================================
// POST /api/messages/upload - Upload audio file
// =============================================

router.post("/upload", authMiddleware, adminMiddleware, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const { title, speaker, category, date } = req.body;

    if (!title || !category || !date) {
      return res.status(400).json({
        error: "Title, category, and date are required",
      });
    }

    // Upload to Cloudflare R2
    const r2Result = await uploadToR2(
      req.file.buffer,
      req.file.originalname,
      "audio-messages"
    );

    // Save metadata to Supabase
    const { data, error } = await supabaseAdmin
      .from("audio_messages")
      .insert({
        id: uuidv4(),
        title: title,
        speaker: speaker || "Unknown",
        category: category,
        date: date,
        file_name: r2Result.fileName,
        file_size: r2Result.size,
        file_url: r2Result.url,
        uploaded_by: req.userId,
      })
      .select();

    if (error) {
      // Delete from R2 if DB insert fails
      await deleteFromR2(r2Result.key);
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: "✅ Audio file uploaded successfully",
      message: data[0],
    });
  } catch (err) {
    console.error("Audio upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// GET /api/messages - Get all audio messages (Admin only)
// =============================================

router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("audio_messages")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      messages: data,
      count: data.length,
    });
  } catch (err) {
    console.error("Messages fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// GET /api/messages/public - Get public audio messages
// =============================================

router.get("/public/all", async (req, res) => {
  try {
    const { category, limit } = req.query;

    let query = supabaseAdmin
      .from("audio_messages")
      .select("*");

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query
      .order("date", { ascending: false })
      .limit(parseInt(limit) || 50);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      messages: data,
      count: data.length,
    });
  } catch (err) {
    console.error("Public messages fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// DELETE /api/messages/:id - Delete audio message
// =============================================

router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Get message details
    const { data, error: fetchError } = await supabaseAdmin
      .from("audio_messages")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !data) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user uploaded it
    if (data.uploaded_by !== req.userId) {
      const adminCheck = await supabaseAdmin
        .from("admin_assignments")
        .select("*")
        .eq("user_id", req.userId)
        .single();

      // Only original uploader or super admin can delete
      if (adminCheck.error) {
        return res.status(403).json({ error: "Permission denied" });
      }
    }

    // Delete from R2
    const fileKey = `audio-messages/${data.file_name}`;
    await deleteFromR2(fileKey);

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from("audio_messages")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return res.status(400).json({ error: deleteError.message });
    }

    res.json({
      message: "✅ Audio message deleted successfully",
    });
  } catch (err) {
    console.error("Audio delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
