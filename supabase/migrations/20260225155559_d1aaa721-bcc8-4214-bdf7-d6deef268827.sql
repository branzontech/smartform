
-- Table: tarifarios_maestros
CREATE TABLE public.tarifarios_maestros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  moneda TEXT NOT NULL DEFAULT 'COP',
  estado BOOLEAN NOT NULL DEFAULT true,
  fhir_extensions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: tarifarios_servicios
CREATE TABLE public.tarifarios_servicios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tarifario_id UUID NOT NULL REFERENCES public.tarifarios_maestros(id) ON DELETE CASCADE,
  sistema_codificacion TEXT NOT NULL DEFAULT 'INTERNO',
  codigo_servicio TEXT NOT NULL,
  descripcion_servicio TEXT NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add tarifario_id to contratos
ALTER TABLE public.contratos ADD COLUMN tarifario_id UUID REFERENCES public.tarifarios_maestros(id);

-- RLS for tarifarios_maestros
ALTER TABLE public.tarifarios_maestros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tarifarios"
  ON public.tarifarios_maestros FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage tarifarios"
  ON public.tarifarios_maestros FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS for tarifarios_servicios
ALTER TABLE public.tarifarios_servicios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tarifarios servicios"
  ON public.tarifarios_servicios FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage tarifarios servicios"
  ON public.tarifarios_servicios FOR ALL
  USING (true)
  WITH CHECK (true);

-- Updated_at triggers
CREATE TRIGGER update_tarifarios_maestros_updated_at
  BEFORE UPDATE ON public.tarifarios_maestros
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tarifarios_servicios_updated_at
  BEFORE UPDATE ON public.tarifarios_servicios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
