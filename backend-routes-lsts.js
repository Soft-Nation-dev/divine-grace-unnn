// =============================================
// LSTS Forms Routes
// =============================================

const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { supabaseAdmin } = require("./backend-config-supabase");
const { authMiddleware, adminMiddleware } = require("./backend-middleware-auth");

// =============================================
// Helper: Get week range for date
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

router.post("/", authMiddleware, async (req, res) => {
  try {
    // Accept both camelCase and snake_case
    const {
      title = req.body.title,
      surname = req.body.surname,
      otherNames = req.body.otherNames || req.body.other_names,
      phoneNumber = req.body.phoneNumber || req.body.phone_number,
      email = req.body.email,
      residentialAddress = req.body.residentialAddress || req.body.residential_address,
      gender = req.body.gender,
      baptized = req.body.baptized || req.body.is_baptized,
      departmentInChurch = req.body.departmentInChurch || req.body.department_in_church,
      positionInChurch = req.body.positionInChurch || req.body.position_in_church,
      Student = req.body.Student || req.body.is_student,
      departmentInSchool = req.body.departmentInSchool || req.body.department_in_school,
      level = req.body.level,
      visionGoals = req.body.visionGoals || req.body.vision_goals,
    } = req.body;

    // Validation
    const requiredFields = {
      surname,
      otherNames,
      phoneNumber,
      email,
      residentialAddress,
      gender,
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value) {
        return res
          .status(400)
          .json({ error: `${field} is required` });
      }
    }

    const { data, error } = await supabaseAdmin
      .from("lsts_forms")
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
        is_baptized: baptized === "Yes",
        department_in_church: departmentInChurch || [],
        position_in_church: positionInChurch,
        is_student: Student === "Yes",
        department_in_school: departmentInSchool || "",
        level: level || "",
        vision_goals: visionGoals || "",
      })
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Update user profile
    await supabaseAdmin
      .from("users")
      .update({
        full_name: `${title} ${surname} ${otherNames}`,
        phone_number: phoneNumber,
        is_student: Student === "Yes",
        department_in_school: departmentInSchool,
        level: level,
      })
      .eq("id", req.userId);

    res.status(201).json({
      message: "✅ LSTS registration submitted successfully",
      registration: data[0],
    });
  } catch (err) {
    console.error("LSTS submit error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// GET /api/lsts - Get all LSTS registrations (Admin only)
// =============================================

router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("lsts_forms")
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
    console.error("LSTS fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// GET /api/lsts/weekly - Get weekly LSTS registrations (Admin only)
// =============================================

router.get("/weekly", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { monday, friday } = getWeekRange();

    const { data, error } = await supabaseAdmin
      .from("lsts_forms")
      .select("*")
      .gte("submitted_at", monday.toISOString())
      .lte("submitted_at", friday.toISOString())
      .order("submitted_at", { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Group by week
    const weekNum = Math.ceil(monday.getDate() / 7);
    const monthName = monday.toLocaleString("default", { month: "long" });
    const year = monday.getFullYear();

    res.json({
      weekLabel: `LSTS registrations for the ${weekNum} week of ${monthName} ${year}`,
      registrations: data,
      count: data.length,
      weekRange: {
        start: monday.toISOString().split("T")[0],
        end: friday.toISOString().split("T")[0],
      },
    });
  } catch (err) {
    console.error("Weekly LSTS fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// GET /api/lsts/user/week - Get user's current week LSTS registration
// =============================================

router.get("/user/week", authMiddleware, async (req, res) => {
  try {
    const { monday, friday } = getWeekRange();

    const { data, error } = await supabaseAdmin
      .from("lsts_forms")
      .select("*")
      .eq("user_id", req.userId)
      .gte("submitted_at", monday.toISOString())
      .lte("submitted_at", friday.toISOString())
      .order("submitted_at", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      registrations: data,
      count: data.length,
      week_range: { 
        start: monday.toISOString(), 
        end: friday.toISOString() 
      },
      has_registered_this_week: data.length > 0,
    });
  } catch (err) {
    console.error("User week LSTS fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// GET /api/lsts/user/all - Get user's own LSTS registrations
// =============================================

router.get("/user/all", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("lsts_forms")
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
    console.error("User LSTS fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// GET /api/lsts/:id - Get specific LSTS registration
// =============================================

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from("lsts_forms")
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
    console.error("LSTS fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
