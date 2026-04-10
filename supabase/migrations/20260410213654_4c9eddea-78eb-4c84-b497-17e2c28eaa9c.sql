
-- 1. CATÁLOGO DE PROCEDIMIENTOS (FHIR ActivityDefinition)
CREATE TABLE public.catalogo_procedimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  sistema_codificacion TEXT NOT NULL DEFAULT 'CUPS',
  fhir_system_uri TEXT NOT NULL DEFAULT 'urn:oid:2.16.170.1.113883.6.255',
  capitulo TEXT,
  tipo TEXT DEFAULT 'procedimiento',
  activo BOOLEAN DEFAULT true,
  fhir_extensions JSONB DEFAULT '{}'::jsonb,
  datos_regulatorios JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(codigo, sistema_codificacion)
);

CREATE INDEX idx_cat_proc_codigo ON catalogo_procedimientos(codigo);
CREATE INDEX idx_cat_proc_descripcion ON catalogo_procedimientos USING GIN (to_tsvector('spanish', descripcion));
CREATE INDEX idx_cat_proc_fhir ON catalogo_procedimientos USING GIN (fhir_extensions);

ALTER TABLE catalogo_procedimientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view procedimientos" ON catalogo_procedimientos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage procedimientos" ON catalogo_procedimientos
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_catalogo_procedimientos()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  IF NEW.tipo NOT IN ('procedimiento', 'laboratorio', 'imagenologia', 'terapia', 'otro') THEN
    RAISE EXCEPTION 'tipo must be one of: procedimiento, laboratorio, imagenologia, terapia, otro';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_catalogo_procedimientos
  BEFORE INSERT OR UPDATE ON catalogo_procedimientos
  FOR EACH ROW EXECUTE FUNCTION validate_catalogo_procedimientos();

-- 2. SERVICIOS CLÍNICOS (FHIR HealthcareService)
CREATE TABLE public.servicios_clinicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT NOT NULL,
  centro_costo TEXT,
  activo BOOLEAN DEFAULT true,
  fhir_extensions JSONB DEFAULT '{}'::jsonb,
  datos_regulatorios JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_serv_clin_fhir ON servicios_clinicos USING GIN (fhir_extensions);

ALTER TABLE servicios_clinicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view servicios" ON servicios_clinicos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage servicios" ON servicios_clinicos
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_servicios_clinicos()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  IF NEW.tipo NOT IN ('procedimientos', 'laboratorio', 'imagenologia', 'consulta_externa', 'urgencias', 'hospitalizacion', 'cirugia', 'terapia', 'odontologia', 'otro') THEN
    RAISE EXCEPTION 'tipo must be one of: procedimientos, laboratorio, imagenologia, consulta_externa, urgencias, hospitalizacion, cirugia, terapia, odontologia, otro';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_servicios_clinicos
  BEFORE INSERT OR UPDATE ON servicios_clinicos
  FOR EACH ROW EXECUTE FUNCTION validate_servicios_clinicos();

-- 3. TABLA PUENTE: Servicio ↔ Procedimientos (N:N)
CREATE TABLE public.servicio_procedimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id UUID NOT NULL REFERENCES servicios_clinicos(id) ON DELETE CASCADE,
  procedimiento_id UUID NOT NULL REFERENCES catalogo_procedimientos(id) ON DELETE CASCADE,
  es_predeterminado BOOLEAN DEFAULT false,
  orden_visualizacion INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(servicio_id, procedimiento_id)
);

CREATE INDEX idx_serv_proc_servicio ON servicio_procedimientos(servicio_id);
CREATE INDEX idx_serv_proc_procedimiento ON servicio_procedimientos(procedimiento_id);

ALTER TABLE servicio_procedimientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view servicio_procedimientos" ON servicio_procedimientos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage servicio_procedimientos" ON servicio_procedimientos
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
