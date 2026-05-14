ALTER TABLE public.evaluations
  ADD COLUMN IF NOT EXISTS blindado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS financiado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS financiado_valor numeric NOT NULL DEFAULT 0;