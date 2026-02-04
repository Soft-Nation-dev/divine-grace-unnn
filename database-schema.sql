-- ============================================
-- Divine Grace UNN - Database Schema
-- For use with Supabase PostgreSQL
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE (Extended Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  title TEXT,
  phone_number TEXT,
  residential_address TEXT,
  gender TEXT,
  is_student BOOLEAN DEFAULT FALSE,
  department_in_school TEXT,
  level TEXT,
  is_baptized BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only read their own profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- 2. ADMIN ASSIGNMENTS TABLE (Created early for dependencies)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role TEXT DEFAULT 'admin', -- admin, moderator, etc.
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS admin_assignments_user_id_idx ON admin_assignments(user_id);

-- Enable RLS
ALTER TABLE admin_assignments ENABLE ROW LEVEL SECURITY;

-- Only admins can view
CREATE POLICY "admin_assignments_select" ON admin_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_assignments a 
      WHERE a.user_id = auth.uid()
    )
  );

-- Only admins can insert
CREATE POLICY "admin_assignments_insert" ON admin_assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_assignments a 
      WHERE a.user_id = auth.uid()
    )
  );

-- ============================================
-- 3. PRAYER REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS prayer_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  prayer_request TEXT NOT NULL,
  request_type TEXT DEFAULT 'personal', -- personal, family, church, other
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS prayer_requests_user_id_idx ON prayer_requests(user_id);
CREATE INDEX IF NOT EXISTS prayer_requests_submitted_at_idx ON prayer_requests(submitted_at);

-- Enable RLS
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (for anonymous prayer requests)
CREATE POLICY "prayer_requests_insert_anyone" ON prayer_requests
  FOR INSERT WITH CHECK (TRUE);

-- Only owner and admins can view
CREATE POLICY "prayer_requests_select" ON prayer_requests
  FOR SELECT USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM admin_assignments 
      WHERE admin_assignments.user_id = auth.uid()
    )
  );

-- ============================================
-- 3. LSTS FORMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS lsts_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  surname TEXT NOT NULL,
  other_names TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  residential_address TEXT NOT NULL,
  gender TEXT NOT NULL,
  is_baptized BOOLEAN,
  department_in_church TEXT[], -- Array of departments
  position_in_church TEXT,
  is_student BOOLEAN,
  department_in_school TEXT,
  level TEXT,
  vision_goals TEXT,
  submission_date DATE DEFAULT CURRENT_DATE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS lsts_forms_user_id_idx ON lsts_forms(user_id);
CREATE INDEX IF NOT EXISTS lsts_forms_submitted_at_idx ON lsts_forms(submitted_at);
CREATE INDEX IF NOT EXISTS lsts_forms_submission_date_idx ON lsts_forms(submission_date);

-- Enable RLS
ALTER TABLE lsts_forms ENABLE ROW LEVEL SECURITY;

-- Users can insert their own
CREATE POLICY "lsts_forms_insert_own" ON lsts_forms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own, admins can view all
CREATE POLICY "lsts_forms_select" ON lsts_forms
  FOR SELECT USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM admin_assignments 
      WHERE admin_assignments.user_id = auth.uid()
    )
  );

-- ============================================
-- 4. SUMMIT FORMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS summit_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  surname TEXT NOT NULL,
  other_names TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  residential_address TEXT NOT NULL,
  gender TEXT NOT NULL,
  is_student BOOLEAN,
  department_in_school TEXT,
  level TEXT,
  expectations TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS summit_forms_user_id_idx ON summit_forms(user_id);
CREATE INDEX IF NOT EXISTS summit_forms_submitted_at_idx ON summit_forms(submitted_at);

-- Enable RLS
ALTER TABLE summit_forms ENABLE ROW LEVEL SECURITY;

-- Users can insert their own
CREATE POLICY "summit_forms_insert_own" ON summit_forms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own, admins can view all
CREATE POLICY "summit_forms_select" ON summit_forms
  FOR SELECT USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM admin_assignments 
      WHERE admin_assignments.user_id = auth.uid()
    )
  );

-- ============================================
-- 5. AUDIO MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audio_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  speaker TEXT,
  category TEXT NOT NULL, -- Sunday, Friday, Workshop, etc.
  date DATE NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_url TEXT NOT NULL, -- URL to Cloudflare R2
  duration INTEGER, -- Duration in seconds (optional)
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS audio_messages_category_idx ON audio_messages(category);
CREATE INDEX IF NOT EXISTS audio_messages_date_idx ON audio_messages(date);
CREATE INDEX IF NOT EXISTS audio_messages_uploaded_at_idx ON audio_messages(uploaded_at);

-- Enable RLS
ALTER TABLE audio_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can view
CREATE POLICY "audio_messages_select_all" ON audio_messages
  FOR SELECT USING (TRUE);

-- Only admins can insert
CREATE POLICY "audio_messages_insert_admin" ON audio_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_assignments 
      WHERE admin_assignments.user_id = auth.uid()
    )
  );

-- Only admins can delete their own uploads
CREATE POLICY "audio_messages_delete_own" ON audio_messages
  FOR DELETE USING (
    auth.uid() = uploaded_by 
    AND EXISTS (
      SELECT 1 FROM admin_assignments 
      WHERE admin_assignments.user_id = auth.uid()
    )
  );

-- ============================================
-- 7. CREATE VIEWS FOR COMMON QUERIES
-- ============================================

-- Weekly LSTS registrations
CREATE OR REPLACE VIEW weekly_lsts_registrations AS
SELECT 
  lsts_forms.*,
  users.full_name,
  users.email as user_email
FROM lsts_forms
JOIN users ON lsts_forms.user_id = users.id
WHERE DATE_TRUNC('week', lsts_forms.submitted_at) = 
      DATE_TRUNC('week', CURRENT_TIMESTAMP);

-- Admin dashboard summary
CREATE OR REPLACE VIEW admin_dashboard_summary AS
SELECT 
  (SELECT COUNT(*) FROM prayer_requests WHERE DATE(submitted_at) = CURRENT_DATE) as prayers_today,
  (SELECT COUNT(*) FROM lsts_forms WHERE DATE(submitted_at) = CURRENT_DATE) as lsts_today,
  (SELECT COUNT(*) FROM summit_forms WHERE DATE(submitted_at) = CURRENT_DATE) as summit_today,
  (SELECT COUNT(*) FROM audio_messages) as total_messages;

-- ============================================
-- 8. CREATE FUNCTIONS FOR COMMON OPERATIONS
-- ============================================

-- Function to get week range
CREATE OR REPLACE FUNCTION get_week_range(date_param DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (week_start DATE, week_end DATE) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE_TRUNC('week', date_param)::DATE,
    (DATE_TRUNC('week', date_param) + INTERVAL '6 days')::DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_assignments WHERE admin_assignments.user_id = user_id
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. CREATE TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER users_update_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER prayer_requests_update_updated_at BEFORE UPDATE ON prayer_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER lsts_forms_update_updated_at BEFORE UPDATE ON lsts_forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER summit_forms_update_updated_at BEFORE UPDATE ON summit_forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER audio_messages_update_updated_at BEFORE UPDATE ON audio_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. SEEDING DATA (Optional - Remove in production)
-- ============================================

-- Note: You'll need to manually add an admin user through Supabase Auth,
-- then execute this after getting the user ID:
-- INSERT INTO admin_assignments (user_id, role) VALUES ('your-user-id-here', 'admin');
