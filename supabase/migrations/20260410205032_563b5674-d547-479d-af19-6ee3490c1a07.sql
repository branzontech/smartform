
DROP TABLE IF EXISTS public.incapacidades CASCADE;
DROP FUNCTION IF EXISTS public.generate_numero_incapacidad();

CREATE TABLE public.incapacidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admision_id UUID NOT NULL REFERENCES public.admisiones(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  medico_id UUID NOT NULL,

  numero_incapacidad TEXT UNIQUE,
  fecha_inicio DATE NOT NULL,
  duracion_dias INTEGER NOT NULL CHECK (duracion_dias > 0),
  fecha_fin DATE GENERATED ALWAYS AS (fecha_inicio + duracion_dias) STORED,

  es_prorroga BOOLEAN DEFAULT false,
  prorroga_tipo TEXT CHECK (prorroga_tipo IN ('no_prorrogable', 'prorrogable')),
  incapacidad_origen_id UUID REFERENCES public.incapacidades(id),

  tipo_incapacidad TEXT NOT NULL CHECK (tipo_incapacidad IN (
    'enfermedad_general', 'accidente_trabajo', 'enfermedad_laboral',
    'licencia_maternidad', 'licencia_paternidad'
  )),
  grupo_servicios TEXT NOT NULL CHECK (grupo_servicios IN (
    'consulta_externa', 'urgencias', 'hospitalizacion', 'cirugia'
  )),
  modalidad_prestacion TEXT NOT NULL CHECK (modalidad_prestacion IN (
    'presencial',
    'extramural_domiciliaria',
    'telemedicina_interactiva',
    'telemedicina_no_interactiva',
    'telemedicina_telexperticia',
    'telemedicina_telemonitoreo'
  )),

  presunto_origen TEXT NOT NULL CHECK (presunto_origen IN ('comun', 'laboral')),
  diagnostico_principal TEXT NOT NULL,
  diagnostico_rel_1 TEXT,
  diagnostico_rel_2 TEXT,
  diagnostico_rel_3 TEXT,

  medico_nombre TEXT NOT NULL,

  es_retroactiva BOOLEAN DEFAULT false,
  causa_retroactividad TEXT CHECK (
    causa_retroactividad IS NULL OR causa_retroactividad IN (
      'no_aplica',
      'urgencia_internacion',
      'trastorno_psiquico_funcional',
      'evento_catastrofico_terrorista'
    )
  ),

  causa_atencion TEXT,
  observaciones TEXT,

  estado TEXT DEFAULT 'activa' CHECK (estado IN ('activa', 'anulada', 'cerrada')),

  fhir_extensions JSONB DEFAULT '{}'::jsonb,
  datos_regulatorios JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_incapacidades_admision ON public.incapacidades(admision_id);
CREATE INDEX idx_incapacidades_paciente ON public.incapacidades(paciente_id);
CREATE INDEX idx_incapacidades_fhir ON public.incapacidades USING GIN (fhir_extensions);
CREATE INDEX idx_incapacidades_regulatorio ON public.incapacidades USING GIN (datos_regulatorios);

ALTER TABLE public.incapacidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view incapacidades" ON public.incapacidades
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can insert incapacidades" ON public.incapacidades
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Doctors can update own incapacidades" ON public.incapacidades
  FOR UPDATE TO authenticated
  USING (medico_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.generate_numero_incapacidad()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
  year_prefix TEXT;
BEGIN
  year_prefix := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_incapacidad FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.incapacidades
  WHERE numero_incapacidad LIKE year_prefix || '%';

  NEW.numero_incapacidad := year_prefix || LPAD(next_num::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_incapacidad_numero
  BEFORE INSERT ON public.incapacidades
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_numero_incapacidad();
