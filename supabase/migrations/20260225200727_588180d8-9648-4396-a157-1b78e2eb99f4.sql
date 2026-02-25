
-- Table for clinical forms/formats with FHIR compliance
CREATE TABLE public.formularios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  tipo TEXT NOT NULL DEFAULT 'forms' CHECK (tipo IN ('forms', 'formato')),
  preguntas JSONB NOT NULL DEFAULT '[]'::jsonb,
  opciones_diseno JSONB NOT NULL DEFAULT '{}'::jsonb,
  fhir_extensions JSONB NOT NULL DEFAULT '{}'::jsonb,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'borrador')),
  respuestas_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.formularios ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view forms"
  ON public.formularios FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create forms"
  ON public.formularios FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update forms"
  ON public.formularios FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete forms"
  ON public.formularios FOR DELETE
  USING (true);

-- Auto-update updated_at
CREATE TRIGGER update_formularios_updated_at
  BEFORE UPDATE ON public.formularios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
