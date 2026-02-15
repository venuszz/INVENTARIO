-- ============================================================================
-- RLS POLICY FOR RESGUARDOS TABLE
-- ============================================================================
-- This policy allows anonymous users to read resguardos for realtime subscriptions
-- Similar to the policy used for muebles, mueblesitea, and mueblestlaxcala tables

-- Enable RLS on resguardos table (if not already enabled)
ALTER TABLE resguardos ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow anon read resguardos for realtime" ON resguardos;

-- Create policy to allow anonymous read access
CREATE POLICY "Allow anon read resguardos for realtime"
ON "public"."resguardos"
AS PERMISSIVE
FOR SELECT
TO anon
USING (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After applying this policy, verify it works by running:
-- SELECT * FROM resguardos LIMIT 1;
-- (This should work even with anon key)

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. This policy only allows SELECT (read) operations
-- 2. INSERT/UPDATE/DELETE operations still require authentication
-- 3. This matches the pattern used in other inventory tables (muebles, mueblesitea, mueblestlaxcala)
-- 4. The anon key is used for:
--    - Initial data indexation on login
--    - Realtime subscriptions for live updates
-- 5. Write operations use the service role key via API routes (e.g., /api/resguardos/create)
