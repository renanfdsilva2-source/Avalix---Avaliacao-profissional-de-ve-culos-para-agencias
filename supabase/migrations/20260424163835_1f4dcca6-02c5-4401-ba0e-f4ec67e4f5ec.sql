
-- Evaluations table
CREATE TABLE public.evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'final'
  placa TEXT,
  marca TEXT,
  modelo TEXT,
  ano TEXT,
  cor TEXT,
  fipe NUMERIC,
  km TEXT,
  cambio TEXT,
  pintura_pecas INT NOT NULL DEFAULT 0,
  pneus INT NOT NULL DEFAULT 0,
  higienizacao BOOLEAN NOT NULL DEFAULT false,
  outros_descontos NUMERIC NOT NULL DEFAULT 0,
  multas NUMERIC NOT NULL DEFAULT 0,
  manutencao_status TEXT,
  manutencao_valor NUMERIC NOT NULL DEFAULT 0,
  gnv TEXT,
  pintura_total TEXT,
  repairs JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{label, checked, value}]
  custom_repairs JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{label, value}]
  documentation JSONB NOT NULL DEFAULT '{}'::jsonb, -- {ipva, licenciamento, multas, transferencia, observacoes}
  photos JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{label, url}]
  signature TEXT,
  fipe_value NUMERIC NOT NULL DEFAULT 0,
  total_descontos NUMERIC NOT NULL DEFAULT 0,
  valor_final NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- Public access (no login)
CREATE POLICY "public read evaluations"
  ON public.evaluations FOR SELECT USING (true);
CREATE POLICY "public insert evaluations"
  ON public.evaluations FOR INSERT WITH CHECK (true);
CREATE POLICY "public update evaluations"
  ON public.evaluations FOR UPDATE USING (true);
CREATE POLICY "public delete evaluations"
  ON public.evaluations FOR DELETE USING (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER evaluations_set_updated_at
  BEFORE UPDATE ON public.evaluations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket for photos (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('evaluation-photos', 'evaluation-photos', true);

CREATE POLICY "public read photos"
  ON storage.objects FOR SELECT USING (bucket_id = 'evaluation-photos');
CREATE POLICY "public upload photos"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'evaluation-photos');
CREATE POLICY "public update photos"
  ON storage.objects FOR UPDATE USING (bucket_id = 'evaluation-photos');
CREATE POLICY "public delete photos"
  ON storage.objects FOR DELETE USING (bucket_id = 'evaluation-photos');
