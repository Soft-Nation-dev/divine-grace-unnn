// =============================================
// Authentication Routes
// =============================================

const express = require("express");
const router = express.Router();
const { supabaseAdmin, supabaseAnon } = require("./backend-config-supabase");
const { authMiddleware } = require("./backend-middleware-auth");

// =============================================
// POST /api/auth/signup - Create new account
// =============================================

router.post("/signup", async (req, res) => {
  try {
    const { email, password, fullName, full_name, displayName, display_name, title } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email (no verification required)
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Create user profile
    const resolvedName =
      fullName || full_name || displayName || display_name || "";
    const baseProfile = {
      id: authData.user.id,
      email: email,
      title: title || "",
    };

    let { error: profileError } = await supabaseAdmin
      .from("users")
      .insert({
        ...baseProfile,
        full_name: resolvedName,
      });

    if (profileError && profileError.message && profileError.message.includes("full_name")) {
      const retry = await supabaseAdmin
        .from("users")
        .insert({
          ...baseProfile,
          ["Display name "]: resolvedName,
        });
      profileError = retry.error;
    }

    if (profileError) {
      console.error("Profile creation error:", profileError);
    }

    res.status(201).json({
      message: "✅ Account created successfully",
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// POST /api/auth/login - Authenticate user
// =============================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Authenticate with Supabase
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    // Get auth user metadata (for display name fallback)
    const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(
      data.user.id
    );
    const displayName =
      authUserData?.user?.user_metadata?.display_name ||
      authUserData?.user?.user_metadata?.full_name ||
      "";
    const profileName =
      profile?.full_name ||
      profile?.display_name ||
      profile?.["Display name "] ||
      "";
    const resolvedFullName = profileName || displayName || "";

    res.json({
      message: "✅ Logged in successfully",
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: resolvedFullName,
        displayName: profileName || displayName,
        title: profile?.title || "",
      },
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// POST /api/auth/logout - Logout user
// =============================================

router.post("/logout", authMiddleware, async (req, res) => {
  try {
    // Supabase handles logout on client side
    // Backend just validates the request
    res.json({
      message: "✅ Logged out successfully",
    });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// GET /api/auth/profile - Get user profile
// =============================================

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", req.userId)
      .single();

    if (error) {
      return res.status(404).json({ error: "User not found" });
    }

    const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(
      req.userId
    );
    const displayName =
      authUserData?.user?.user_metadata?.display_name ||
      authUserData?.user?.user_metadata?.full_name ||
      "";
    const profileName =
      data?.full_name || data?.display_name || data?.["Display name "] || "";
    const resolvedFullName = profileName || displayName || "";

    res.json({
      user: {
        ...data,
        full_name: resolvedFullName,
        display_name: profileName || displayName,
      },
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// PUT /api/auth/profile - Update user profile
// =============================================

router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { fullName, full_name, displayName, display_name, title, phoneNumber, residentialAddress, gender, departmentInSchool, level, isBaptized, isStudent } = req.body;
    const resolvedName =
      fullName || full_name || displayName || display_name || "";

    let { data, error } = await supabaseAdmin
      .from("users")
      .update({
        full_name: resolvedName,
        title: title,
        phone_number: phoneNumber,
        residential_address: residentialAddress,
        gender: gender,
        department_in_school: departmentInSchool,
        level: level,
        is_baptized: isBaptized,
        is_student: isStudent,
      })
      .eq("id", req.userId)
      .select();

    if (error && error.message && error.message.includes("full_name")) {
      const retry = await supabaseAdmin
        .from("users")
        .update({
          ["Display name "]: resolvedName,
          title: title,
          phone_number: phoneNumber,
          residential_address: residentialAddress,
          gender: gender,
          department_in_school: departmentInSchool,
          level: level,
          is_baptized: isBaptized,
          is_student: isStudent,
        })
        .eq("id", req.userId)
        .select();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: "✅ Profile updated successfully",
      user: data[0],
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// POST /api/auth/refresh - Refresh access token
// =============================================

router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  } catch (err) {
    console.error("Token refresh error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
