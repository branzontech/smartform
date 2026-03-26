
-- ========================================
-- TABLA: sedes (FHIR R4 Location)
-- ========================================
CREATE TABLE public.sedes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL DEFAULT 'consultorio',
  direccion TEXT,
  ciudad TEXT,
  departamento_estado TEXT,
  pais TEXT NOT NULL DEFAULT 'CO',
  codigo_postal TEXT,
  telefono TEXT,
  email TEXT,
  latitud NUMERIC(10,7),
  longitud NUMERIC(10,7),
  responsable_nombre TEXT,
  responsable_id UUID,
  sede_principal BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  datos_regulatorios JSONB DEFAULT '{}'::jsonb,
  fhir_extensions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Validation trigger instead of CHECK constraints
CREATE OR REPLACE FUNCTION public.validate_sedes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo NOT IN ('hospital','clinica','consultorio','laboratorio','centro_diagnostico','farmacia','bodega','sede_administrativa') THEN
    RAISE EXCEPTION 'tipo must be one of: hospital, clinica, consultorio, laboratorio, centro_diagnostico, farmacia, bodega, sede_administrativa';
  END IF;
  IF NEW.pais NOT IN ('CO','MX','EC','PE','AR') THEN
    RAISE EXCEPTION 'pais must be one of: CO, MX, EC, PE, AR';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_sedes
  BEFORE INSERT OR UPDATE ON sedes
  FOR EACH ROW EXECUTE FUNCTION validate_sedes();

-- Indexes
CREATE INDEX idx_sedes_pais ON sedes(pais);
CREATE INDEX idx_sedes_tipo ON sedes(tipo);
CREATE INDEX idx_sedes_activo ON sedes(activo);
CREATE INDEX idx_sedes_fhir ON sedes USING GIN(fhir_extensions);
CREATE INDEX idx_sedes_regulatorio ON sedes USING GIN(datos_regulatorios);

-- RLS
ALTER TABLE sedes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sedes"
  ON sedes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert sedes"
  ON sedes FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update sedes"
  ON sedes FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete sedes"
  ON sedes FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger
CREATE TRIGGER trg_updated_at_sedes
  BEFORE UPDATE ON sedes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
