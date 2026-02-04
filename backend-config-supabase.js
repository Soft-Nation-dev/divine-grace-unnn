// =============================================
// Supabase Configuration
// =============================================

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials in .env file");
  process.exit(1);
}

// Service client (for admin operations)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Anon client (for user operations)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

module.exports = {
  supabaseAdmin,
  supabaseAnon,
  supabaseUrl,
};
