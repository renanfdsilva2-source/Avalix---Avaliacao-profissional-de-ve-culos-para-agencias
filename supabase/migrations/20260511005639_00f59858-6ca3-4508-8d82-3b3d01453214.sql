
ALTER TABLE public.evaluations
  ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.set_evaluation_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS evaluations_set_owner ON public.evaluations;
CREATE TRIGGER evaluations_set_owner
  BEFORE INSERT ON public.evaluations
  FOR EACH ROW EXECUTE FUNCTION public.set_evaluation_owner();

DROP TRIGGER IF EXISTS evaluations_set_updated_at ON public.evaluations;
CREATE TRIGGER evaluations_set_updated_at
  BEFORE UPDATE ON public.evaluations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

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

DROP POLICY IF EXISTS "public upload photos" ON storage.objects;
DROP POLICY IF EXISTS "public update photos" ON storage.objects;
DROP POLICY IF EXISTS "public delete photos" ON storage.objects;

CREATE POLICY "Users read own evaluation photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'evaluation-photos'
    AND EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id::text = (storage.foldername(name))[1]
        AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users upload own evaluation photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'evaluation-photos'
    AND EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id::text = (storage.foldername(name))[1]
        AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users update own evaluation photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'evaluation-photos'
    AND EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id::text = (storage.foldername(name))[1]
        AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users delete own evaluation photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'evaluation-photos'
    AND EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id::text = (storage.foldername(name))[1]
        AND e.user_id = auth.uid()
    )
  );
