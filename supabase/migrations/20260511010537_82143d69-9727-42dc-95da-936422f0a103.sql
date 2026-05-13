UPDATE storage.buckets SET public = false WHERE id = 'evaluation-photos';

DROP POLICY IF EXISTS "Users insert own evaluations" ON public.evaluations;

CREATE POLICY "Users insert own evaluations"
ON public.evaluations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);