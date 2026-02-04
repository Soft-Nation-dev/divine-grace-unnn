// =============================================
// Prayer Requests Routes
// =============================================

const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { supabaseAdmin } = require("./backend-config-supabase");
const { authMiddleware, adminMiddleware } = require("./backend-middleware-auth");

// =============================================
// POST /api/prayers - Submit prayer request
// =============================================

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, email, prayerRequest, requestType } = req.body;

    if (!name || !email || !prayerRequest) {
      return res.status(400).json({
        error: "Name, email, and prayer request are required",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("prayer_requests")
      .insert({
        id: uuidv4(),
        user_id: req.userId,
        name: name,
        email: email,
        prayer_request: prayerRequest,
        request_type: requestType || "personal",
      })
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: "✅ Prayer request submitted successfully",
      prayerRequest: data[0],
    });
  } catch (err) {
    console.error("Prayer submit error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// GET /api/prayers - Get all prayer requests (Admin only)
// =============================================

router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("prayer_requests")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      prayers: data,
      count: data.length,
    });
  } catch (err) {
    console.error("Prayer fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// GET /api/prayers/:id - Get specific prayer
// =============================================

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from("prayer_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Prayer request not found" });
    }

    // Only owner or admin can view
    if (data.user_id !== req.userId) {
      const adminCheck = await supabaseAdmin
        .from("admin_assignments")
        .select("*")
        .eq("user_id", req.userId)
        .single();

      if (adminCheck.error) {
        return res.status(403).json({ error: "Permission denied" });
      }
    }

    res.json({
      prayerRequest: data,
    });
  } catch (err) {
    console.error("Prayer fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// GET /api/prayers/today - Get prayers submitted today (Admin only)
// =============================================

router.get("/today/count", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("prayer_requests")
      .select("*", { count: "exact" })
      .gte("submitted_at", new Date().toISOString().split("T")[0]);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      todayCount: data ? data.length : 0,
    });
  } catch (err) {
    console.error("Prayer count error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
