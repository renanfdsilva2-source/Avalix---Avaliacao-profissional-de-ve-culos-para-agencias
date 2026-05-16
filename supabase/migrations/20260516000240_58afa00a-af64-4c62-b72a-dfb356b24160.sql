-- Ensure every evaluation has an owner and timestamps are maintained
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_evaluation_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

ALTER TABLE public.evaluations
  ADD COLUMN IF NOT EXISTS client_updated_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS sync_version integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_sync_error text;

UPDATE public.evaluations
SET client_updated_at = COALESCE(client_updated_at, updated_at)
WHERE client_updated_at IS NULL;

DROP TRIGGER IF EXISTS evaluations_set_owner ON public.evaluations;
CREATE TRIGGER evaluations_set_owner
  BEFORE INSERT ON public.evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_evaluation_owner();

DROP TRIGGER IF EXISTS evaluations_set_updated_at ON public.evaluations;
CREATE TRIGGER evaluations_set_updated_at
  BEFORE UPDATE ON public.evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS evaluations_increment_sync_version ON public.evaluations;
CREATE OR REPLACE FUNCTION public.increment_evaluation_sync_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.sync_version = COALESCE(OLD.sync_version, 0) + 1;
  RETURN NEW;
END;
$$;
CREATE TRIGGER evaluations_increment_sync_version
  BEFORE UPDATE ON public.evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_evaluation_sync_version();

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Users insert own evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Users update own evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Users delete own evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "public read evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "public insert evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "public update evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "public delete evaluations" ON public.evaluations;

CREATE POLICY "Users read own evaluations"
  ON public.evaluations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own evaluations"
  ON public.evaluations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users update own evaluations"
  ON public.evaluations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own evaluations"
  ON public.evaluations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_evaluations_user_status_updated
  ON public.evaluations (user_id, status, updated_at DESC);

REVOKE EXECUTE ON FUNCTION public.set_evaluation_owner() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_evaluation_sync_version() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;