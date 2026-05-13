
-- Fix function search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Restrict bucket listing: allow direct file access via public URL but disallow listing all objects
DROP POLICY IF EXISTS "public read photos" ON storage.objects;
-- (Public bucket still serves files via public URL without needing a SELECT policy.)
