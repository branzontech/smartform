
-- Tabla catalogo_productos_regulatorio (FHIR: regulatory metadata por país)
CREATE TABLE public.catalogo_productos_regulatorio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID NOT NULL REFERENCES public.catalogo_productos(id) ON DELETE CASCADE,
  pais TEXT NOT NULL,
  registro_sanitario TEXT,
  entidad_regulatoria TEXT,
  estado_registro TEXT DEFAULT 'vigente',
  fecha_vencimiento_registro DATE,
  datos_regulatorios JSONB DEFAULT '{}'::jsonb,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Validación por trigger en vez de CHECK
CREATE OR REPLACE FUNCTION public.validate_catalogo_productos_regulatorio()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.pais NOT IN ('CO','MX','EC','PE','AR') THEN
    RAISE EXCEPTION 'pais must be one of: CO, MX, EC, PE, AR';
  END IF;
  IF NEW.estado_registro NOT IN ('vigente','vencido','en_tramite','cancelado') THEN
    RAISE EXCEPTION 'estado_registro must be one of: vigente, vencido, en_tramite, cancelado';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_catalogo_productos_regulatorio
  BEFORE INSERT OR UPDATE ON public.catalogo_productos_regulatorio
  FOR EACH ROW EXECUTE FUNCTION public.validate_catalogo_productos_regulatorio();

-- Índices
CREATE UNIQUE INDEX idx_catalogo_productos_regulatorio_unique
  ON public.catalogo_productos_regulatorio (producto_id, pais);
CREATE INDEX idx_catalogo_productos_regulatorio_datos
  ON public.catalogo_productos_regulatorio USING GIN (datos_regulatorios);

-- Trigger updated_at
CREATE TRIGGER update_catalogo_productos_regulatorio_updated_at
  BEFORE UPDATE ON public.catalogo_productos_regulatorio
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.catalogo_productos_regulatorio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view producto regulatorio"
  ON public.catalogo_productos_regulatorio FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can insert producto regulatorio"
  ON public.catalogo_productos_regulatorio FOR INSERT
  TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update producto regulatorio"
  ON public.catalogo_productos_regulatorio FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete producto regulatorio"
  ON public.catalogo_productos_regulatorio FOR DELETE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));
