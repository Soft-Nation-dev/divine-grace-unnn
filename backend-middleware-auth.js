// =============================================
// Authentication Middleware
// =============================================

const { supabaseAdmin } = require("./backend-config-supabase");

// Verify JWT token from Authorization header
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token with Supabase
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Attach user to request object
    req.user = data.user;
    req.userId = data.user.id;
    req.userEmail = data.user.email;

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(401).json({ error: "Unauthorized" });
  }
};

// Check if user is admin
const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check admin_assignments table
    const { data, error } = await supabaseAdmin
      .from("admin_assignments")
      .select("*")
      .eq("user_id", req.userId)
      .single();

    if (error || !data) {
      return res.status(403).json({ error: "User is not an admin" });
    }

    req.isAdmin = true;
    next();
  } catch (err) {
    console.error("Admin middleware error:", err);
    res.status(403).json({ error: "Permission denied" });
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware,
};
