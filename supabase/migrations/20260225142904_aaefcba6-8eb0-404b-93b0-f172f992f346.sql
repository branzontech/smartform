
-- Tabla de configuración de campos personalizados para admisiones (FHIR Extensions)
CREATE TABLE public.configuracion_campos_admision (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  tipo_dato TEXT NOT NULL DEFAULT 'text',
  es_requerido BOOLEAN NOT NULL DEFAULT false,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.configuracion_campos_admision ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view admission field config"
  ON public.configuracion_campos_admision
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage admission field config"
  ON public.configuracion_campos_admision
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger updated_at
CREATE TRIGGER update_configuracion_campos_admision_updated_at
  BEFORE UPDATE ON public.configuracion_campos_admision
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
