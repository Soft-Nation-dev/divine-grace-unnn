// =============================================
// Admin Routes
// =============================================

const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require('./backend-config-supabase');
const { authMiddleware, adminMiddleware } = require('./backend-middleware-auth');

// =============================================
// GET /api/admin/check - Check if user is admin
// =============================================

router.get("/check", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("admin_assignments")
      .select("*")
      .eq("user_id", req.userId)
      .single();

    if (error || !data) {
      return res.json({
        isAdmin: false,
        message: "User is not an admin",
      });
    }

    res.json({
      isAdmin: true,
      admin: data,
      message: "User is an admin",
    });
  } catch (err) {
    console.error("Admin check error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// POST /api/admin/assign - Assign admin role
// =============================================

router.post("/assign", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Get user by email
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    const targetUser = users.users.find(u => u.email === email);

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already admin
    const { data: existingAdmin } = await supabaseAdmin
      .from("admin_assignments")
      .select("*")
      .eq("user_id", targetUser.id)
      .single();

    if (existingAdmin) {
      return res.status(400).json({ error: "User is already an admin" });
    }

    // Assign admin role
    const { data, error } = await supabaseAdmin
      .from("admin_assignments")
      .insert({
        user_id: targetUser.id,
        assigned_by: req.userId,
        role: "admin",
      })
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: "✅ Admin role assigned successfully",
      admin: data[0],
    });
  } catch (err) {
    console.error("Assign admin error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// GET /api/admin/dashboard - Get admin dashboard data
// =============================================

router.get("/dashboard", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Get counts for all submissions
    const [prayersResult, lstsResult, summitResult, messagesResult] = await Promise.all([
      supabaseAdmin
        .from("prayer_requests")
        .select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("lsts_forms")
        .select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("summit_forms")
        .select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("audio_messages")
        .select("*", { count: "exact", head: true }),
    ]);

    // Get today's counts
    const today = new Date().toISOString().split("T")[0];
    const [prayersToday, lstsToday, summitToday] = await Promise.all([
      supabaseAdmin
        .from("prayer_requests")
        .select("*", { count: "exact", head: true })
        .gte("submitted_at", today),
      supabaseAdmin
        .from("lsts_forms")
        .select("*", { count: "exact", head: true })
        .gte("submitted_at", today),
      supabaseAdmin
        .from("summit_forms")
        .select("*", { count: "exact", head: true })
        .gte("submitted_at", today),
    ]);

    res.json({
      dashboard: {
        totalPrayers: prayersResult.count || 0,
        totalLsts: lstsResult.count || 0,
        totalSummit: summitResult.count || 0,
        totalMessages: messagesResult.count || 0,
        today: {
          prayers: prayersToday.count || 0,
          lsts: lstsToday.count || 0,
          summit: summitToday.count || 0,
        },
      },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// GET /api/admin/users - Get all users (Admin only)
// =============================================

router.get("/users/all", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      users: data,
      count: data.length,
    });
  } catch (err) {
    console.error("Users fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// GET /api/admin/admins - Get all admins
// =============================================

router.get("/admins/all", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("admin_assignments")
      .select(`
        *,
        user:users(id, email, full_name)
      `)
      .order("assigned_at", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      admins: data,
      count: data.length,
    });
  } catch (err) {
    console.error("Admins fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
