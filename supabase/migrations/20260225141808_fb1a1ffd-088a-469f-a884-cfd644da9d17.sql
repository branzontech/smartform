
-- 1. Add patient status column
ALTER TABLE public.pacientes 
ADD COLUMN IF NOT EXISTS estado_paciente text NOT NULL DEFAULT 'registrado';

-- 2. Customizable admission types table
CREATE TABLE public.tipos_admision (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  activo boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tipos_admision ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view admission types"
  ON public.tipos_admision FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage admission types"
  ON public.tipos_admision FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed default types
INSERT INTO public.tipos_admision (nombre, descripcion, orden) VALUES
  ('Consulta externa', 'Atención ambulatoria sin internación', 1),
  ('Urgencias', 'Atención de urgencias médicas', 2),
  ('Hospitalización', 'Internación con plan de tratamiento', 3),
  ('Procedimiento', 'Procedimiento quirúrgico o diagnóstico', 4);

-- 3. Admissions table (FHIR Encounter)
CREATE TABLE public.admisiones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  tipo_admision_id uuid REFERENCES public.tipos_admision(id),
  estado text NOT NULL DEFAULT 'en_curso',
  motivo text,
  profesional_nombre text,
  diagnostico_principal text,
  notas text,
  fecha_inicio timestamptz NOT NULL DEFAULT now(),
  fecha_fin timestamptz,
  fhir_extensions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admisiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view admissions"
  ON public.admisiones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create admissions"
  ON public.admisiones FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update admissions"
  ON public.admisiones FOR UPDATE
  TO authenticated
  USING (true);

-- 4. Trigger: auto-update pacientes.estado_paciente
CREATE OR REPLACE FUNCTION public.update_patient_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  has_active boolean;
BEGIN
  -- Check if the patient has any active admission
  SELECT EXISTS (
    SELECT 1 FROM public.admisiones
    WHERE paciente_id = COALESCE(NEW.paciente_id, OLD.paciente_id)
      AND estado IN ('en_curso', 'planificada')
  ) INTO has_active;

  UPDATE public.pacientes
  SET estado_paciente = CASE
    WHEN has_active THEN 'activo'
    WHEN EXISTS (
      SELECT 1 FROM public.admisiones
      WHERE paciente_id = COALESCE(NEW.paciente_id, OLD.paciente_id)
    ) THEN 'inactivo'
    ELSE 'registrado'
  END
  WHERE id = COALESCE(NEW.paciente_id, OLD.paciente_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_update_patient_status
  AFTER INSERT OR UPDATE OR DELETE ON public.admisiones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_patient_status();

-- 5. Updated_at triggers
CREATE TRIGGER update_tipos_admision_updated_at
  BEFORE UPDATE ON public.tipos_admision
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admisiones_updated_at
  BEFORE UPDATE ON public.admisiones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
