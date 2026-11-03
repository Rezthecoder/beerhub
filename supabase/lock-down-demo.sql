-- Lock down the database for the public demo.
-- Run once in Supabase: Dashboard → SQL Editor → paste this file → Run.
--
-- After this:
--   * anyone can still READ products (the shop pages need them)
--   * nobody can write products, or read/write orders and payments, with the public (anon) key
--   * the website's server code keeps working, because it uses the service role key,
--     which bypasses row level security

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Remove every existing policy on these three tables (including the old "Anyone can ..." ones)
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('products', 'orders', 'payments')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Products: read-only for everyone
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

-- Orders and payments: no policies on purpose = no access with the public key.
-- Only the server (service role key) can read and write them.
