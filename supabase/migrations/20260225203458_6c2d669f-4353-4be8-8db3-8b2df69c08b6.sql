
-- Storage bucket for institution logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('institution-assets', 'institution-assets', true);

-- RLS for the bucket
CREATE POLICY "Authenticated users can upload assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'institution-assets');

CREATE POLICY "Authenticated users can update assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'institution-assets');

CREATE POLICY "Anyone can view assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'institution-assets');

CREATE POLICY "Authenticated users can delete assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'institution-assets');

-- Table for global institution header configuration
CREATE TABLE public.configuracion_encabezado (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_institucion TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  nit TEXT,
  direccion TEXT,
  telefono TEXT,
  email_institucion TEXT,
  resolucion_habilitacion TEXT,
  campos_personalizados JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.configuracion_encabezado ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view header config"
  ON public.configuracion_encabezado FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage header config"
  ON public.configuracion_encabezado FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_configuracion_encabezado_updated_at
  BEFORE UPDATE ON public.configuracion_encabezado
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
