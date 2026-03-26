
-- Tabla catalogo_productos (FHIR: Medication / Device / Supply)
CREATE TABLE public.catalogo_productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  nombre_generico TEXT NOT NULL,
  nombre_comercial TEXT,
  tipo_producto TEXT NOT NULL,
  principio_activo TEXT,
  codigo_atc TEXT,
  codigo_snomed TEXT,
  fhir_resource_type TEXT NOT NULL DEFAULT 'Medication',
  fabricante TEXT,
  requiere_cadena_frio BOOLEAN DEFAULT false,
  controlado BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  fhir_extensions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE UNIQUE INDEX idx_catalogo_productos_codigo ON public.catalogo_productos (codigo);
CREATE INDEX idx_catalogo_productos_fhir ON public.catalogo_productos USING GIN (fhir_extensions);
CREATE INDEX idx_catalogo_productos_atc ON public.catalogo_productos (codigo_atc);
CREATE INDEX idx_catalogo_productos_tipo ON public.catalogo_productos (tipo_producto);

-- Trigger updated_at
CREATE TRIGGER update_catalogo_productos_updated_at
  BEFORE UPDATE ON public.catalogo_productos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Validation trigger for tipo_producto
CREATE OR REPLACE FUNCTION public.validate_catalogo_productos()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.tipo_producto NOT IN ('medicamento', 'insumo', 'dispositivo_medico') THEN
    RAISE EXCEPTION 'tipo_producto must be one of: medicamento, insumo, dispositivo_medico';
  END IF;
  IF NEW.fhir_resource_type NOT IN ('Medication', 'Device', 'Supply') THEN
    RAISE EXCEPTION 'fhir_resource_type must be one of: Medication, Device, Supply';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_catalogo_productos
  BEFORE INSERT OR UPDATE ON public.catalogo_productos
  FOR EACH ROW EXECUTE FUNCTION public.validate_catalogo_productos();

-- RLS
ALTER TABLE public.catalogo_productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view catalogo productos"
  ON public.catalogo_productos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert catalogo productos"
  ON public.catalogo_productos FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update catalogo productos"
  ON public.catalogo_productos FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete catalogo productos"
  ON public.catalogo_productos FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
