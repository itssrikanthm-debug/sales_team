-- User roles management table
-- This table extends the auth.users table to assign roles to users

CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4 (),
  user_id uuid NULL,
  role text NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_key UNIQUE (user_id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT user_roles_role_check CHECK (
    (
      role = ANY (
        ARRAY['salesperson'::text, 'admin'::text, 'user'::text]
      )
    )
  )
) TABLESPACE pg_default;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_role
ON public.user_roles USING btree (role) TABLESPACE pg_default;

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own role
CREATE POLICY "Users can view their own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all user roles
CREATE POLICY "Admins can manage all user roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Allow initial role assignment (service role inserts)
CREATE POLICY "Service role can insert user roles" ON public.user_roles
  FOR INSERT WITH CHECK (true);

-- Insert default admin user (replace with your admin's UUID)
-- IMPORTANT: Replace the user_id value with your actual admin user's ID
-- You can find this in your Supabase Auth users table
-- INSERT INTO public.user_roles (user_id, role) VALUES
--   ('your-admin-user-uuid-here', 'admin');

-- Function to automatically create user role when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Default role for new users is 'salesperson'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'salesperson');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically assign roles to new users
-- Uncomment this if you want automatic role assignment
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Comments for documentation
COMMENT ON TABLE public.user_roles IS 'User roles for access control (salesperson, admin, user)';
COMMENT ON COLUMN public.user_roles.role IS 'User role: salesperson (default), admin, user';
COMMENT ON COLUMN public.user_roles.user_id IS 'References auth.users.id with CASCADE delete';
