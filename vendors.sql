-- Vendor management system schema

-- Create categories table first
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4 (),
  name text NOT NULL,
  description text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_name_key UNIQUE (name)
) TABLESPACE pg_default;

-- Create vendors table
CREATE TABLE public.vendors (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4 (),
  v_id uuid NULL DEFAULT extensions.uuid_generate_v4 (),
  v_name text NOT NULL,
  v_type uuid NULL,
  v_phonenumber text NOT NULL,
  v_address text NOT NULL,
  v_listing_count integer NULL DEFAULT 0,
  total_price integer NOT NULL,
  verified_photo_url text NULL,
  business_photo_url text NULL,
  salesperson_id uuid NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending'::text,
  approved_listing_count integer NULL,
  approved_earnings numeric(10, 2) NULL,
  approved_at timestamp with time zone NULL,
  approved_by uuid NULL,
  rejection_reason text NULL,
  admin_notes text NULL,
  CONSTRAINT vendors_pkey PRIMARY KEY (id),
  CONSTRAINT vendors_v_id_key UNIQUE (v_id),
  CONSTRAINT vendors_v_type_fkey FOREIGN KEY (v_type) REFERENCES categories (id),
  CONSTRAINT vendors_salesperson_id_fkey FOREIGN KEY (salesperson_id) REFERENCES auth.users (id),
  CONSTRAINT vendors_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users (id),
  CONSTRAINT vendors_status_check CHECK (
    (
      status = ANY (
        ARRAY[
          'pending'::text,
          'approved'::text,
          'rejected'::text
        ]
      )
    )
  ),
  CONSTRAINT vendors_v_phonenumber_check CHECK ((v_phonenumber ~ '^\d{10}$'::text))
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vendors_status
ON public.vendors USING btree (status) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_vendors_salesperson_status
ON public.vendors USING btree (salesperson_id, status) TABLESPACE pg_default;

-- Create function for updating approved earnings
CREATE OR REPLACE FUNCTION update_approved_earnings()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate earnings: approved_listing_count * 20 (₹20 per listing)
  NEW.approved_earnings := COALESCE(NEW.approved_listing_count, 0) * 20;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating approved earnings
CREATE TRIGGER trigger_update_approved_earnings
  BEFORE INSERT OR UPDATE OF approved_listing_count
  ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_approved_earnings();

-- Insert default categories
INSERT INTO public.categories (name) VALUES
  ('Decorator'),
  ('Private Theater')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust as needed for your application)
-- Policy for salespeople to view their own vendors
CREATE POLICY "Salespeople can view their own vendors" ON public.vendors
  FOR SELECT USING (auth.uid() = salesperson_id);

-- Policy for salespeople to insert their own vendors
CREATE POLICY "Salespeople can insert their own vendors" ON public.vendors
  FOR INSERT WITH CHECK (auth.uid() = salesperson_id);

-- Admin policy to view all vendors (adjust based on your admin role)
CREATE POLICY "Admins can view all vendors" ON public.vendors
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Public read access for categories
CREATE POLICY "Categories are publicly readable" ON public.categories
  FOR SELECT USING (true);

-- Salesperson earnings view
CREATE OR REPLACE VIEW public.salesperson_earnings AS
SELECT
  salesperson_id,
  COUNT(*) FILTER (WHERE status = 'pending'::text) AS pending_count,
  COUNT(*) FILTER (WHERE status = 'approved'::text) AS approved_count,
  COUNT(*) FILTER (WHERE status = 'rejected'::text) AS rejected_count,
  COALESCE(
    SUM(approved_earnings) FILTER (WHERE status = 'approved'::text),
    0::numeric
  ) AS total_earnings
FROM
  vendors
GROUP BY
  salesperson_id;

-- Grant access to the view
GRANT SELECT ON public.salesperson_earnings TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.vendors IS 'Main table for storing vendor information with approval workflow';
COMMENT ON TABLE public.categories IS 'Categories for vendor types (Decorator, Private Theater, etc.) with optional descriptions';
COMMENT ON COLUMN public.categories.description IS 'Optional description for the category';
COMMENT ON VIEW public.salesperson_earnings IS 'Aggregated earnings and vendor statistics per salesperson';
COMMENT ON COLUMN public.vendors.status IS 'Approval status: pending, approved, rejected';
COMMENT ON COLUMN public.vendors.approved_earnings IS 'Calculated earnings (approved_listing_count * 20)';
COMMENT ON COLUMN public.vendors.v_phonenumber IS 'Must be exactly 10 digits';
COMMENT ON COLUMN public.vendors.total_price IS 'Base price 200 + listing count * 20';
COMMENT ON COLUMN public.salesperson_earnings.pending_count IS 'Number of pending vendor applications';
COMMENT ON COLUMN public.salesperson_earnings.approved_count IS 'Number of approved vendors';
COMMENT ON COLUMN public.salesperson_earnings.rejected_count IS 'Number of rejected vendors';
COMMENT ON COLUMN public.salesperson_earnings.total_earnings IS 'Total earnings from approved vendors (₹)';
