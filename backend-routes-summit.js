// =============================================
// Summit Forms Routes
// =============================================

const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { supabaseAdmin } = require("./backend-config-supabase");
const { authMiddleware, adminMiddleware } = require("./backend-middleware-auth");

// =============================================
// POST /api/summit - Submit summit registration
// =============================================

router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      surname,
      otherNames,
      phoneNumber,
      email,
      residentialAddress,
      gender,
      isStudent,
      departmentInSchool,
      level,
      expectations,
    } = req.body;

    // Validation
    const requiredFields = [
      "surname",
      "otherNames",
      "phoneNumber",
      "email",
      "residentialAddress",
      "gender",
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res
          .status(400)
          .json({ error: `${field} is required` });
      }
    }

    const { data, error } = await supabaseAdmin
      .from("summit_forms")
      .insert({
        id: uuidv4(),
        user_id: req.userId,
        title: title,
        surname: surname,
        other_names: otherNames,
        phone_number: phoneNumber,
        email: email,
        residential_address: residentialAddress,
        gender: gender,
        is_student: isStudent === "Yes",
        department_in_school: departmentInSchool || "",
        level: level || "",
        expectations: expectations || "",
      })
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: "✅ Summit registration submitted successfully",
      registration: data[0],
    });
  } catch (err) {
    console.error("Summit submit error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// GET /api/summit - Get all summit registrations (Admin only)
// =============================================

router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("summit_forms")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      registrations: data,
      count: data.length,
    });
  } catch (err) {
    console.error("Summit fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// GET /api/summit/user - Get user's own summit registrations
// =============================================

router.get("/user/all", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("summit_forms")
      .select("*")
      .eq("user_id", req.userId)
      .order("submitted_at", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      registrations: data,
      count: data.length,
    });
  } catch (err) {
    console.error("User summit fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// GET /api/summit/:id - Get specific summit registration
// =============================================

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from("summit_forms")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Registration not found" });
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
      registration: data,
    });
  } catch (err) {
    console.error("Summit fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
