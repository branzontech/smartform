
-- Tabla presentaciones_producto (FHIR: Medication.form + Medication.amount)
CREATE TABLE public.presentaciones_producto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID NOT NULL REFERENCES public.catalogo_productos(id) ON DELETE CASCADE,
  forma_farmaceutica TEXT NOT NULL,
  concentracion TEXT,
  unidad_medida TEXT NOT NULL,
  via_administracion TEXT,
  codigo_barras TEXT,
  presentacion_comercial TEXT,
  activo BOOLEAN DEFAULT true,
  fhir_extensions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE UNIQUE INDEX idx_presentaciones_producto_unique
  ON public.presentaciones_producto (producto_id, forma_farmaceutica, concentracion);
CREATE INDEX idx_presentaciones_producto_fhir
  ON public.presentaciones_producto USING GIN (fhir_extensions);

-- Trigger updated_at
CREATE TRIGGER update_presentaciones_producto_updated_at
  BEFORE UPDATE ON public.presentaciones_producto
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.presentaciones_producto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view presentaciones"
  ON public.presentaciones_producto FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can insert presentaciones"
  ON public.presentaciones_producto FOR INSERT
  TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update presentaciones"
  ON public.presentaciones_producto FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete presentaciones"
  ON public.presentaciones_producto FOR DELETE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));
