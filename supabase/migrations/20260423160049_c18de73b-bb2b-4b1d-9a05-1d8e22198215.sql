-- ============================================================
-- 1. TABLA DE CONFIGURACIÓN DE CORRECCIONES POR TIPO DE REGISTRO
-- ============================================================
CREATE TABLE IF NOT EXISTS public.correccion_configuracion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_table TEXT NOT NULL UNIQUE,
  nombre_legible TEXT NOT NULL,
  ventana_edicion_rapida_minutos INTEGER NOT NULL DEFAULT 0,
  requiere_motivo BOOLEAN NOT NULL DEFAULT true,
  permite_anulacion_sin_reemplazo BOOLEAN NOT NULL DEFAULT true,
  permite_correccion_con_reemplazo BOOLEAN NOT NULL DEFAULT true,
  bloquear_si_facturado BOOLEAN NOT NULL DEFAULT true,
  activo BOOLEAN NOT NULL DEFAULT true,
  fhir_extensions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.correccion_configuracion 
  (target_table, nombre_legible, ventana_edicion_rapida_minutos) VALUES
  ('respuestas_formularios', 'Respuestas de formularios clínicos', 15),
  ('ordenes_medicas', 'Órdenes médicas', 10),
  ('observaciones', 'Observaciones y signos vitales', 15)
ON CONFLICT (target_table) DO NOTHING;

ALTER TABLE public.correccion_configuracion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin puede gestionar configuración de correcciones" ON public.correccion_configuracion;
CREATE POLICY "Admin puede gestionar configuración de correcciones"
  ON public.correccion_configuracion FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Cualquier usuario autenticado puede leer configuración" ON public.correccion_configuracion;
CREATE POLICY "Cualquier usuario autenticado puede leer configuración"
  ON public.correccion_configuracion FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE TRIGGER trg_correccion_config_updated_at
  BEFORE UPDATE ON public.correccion_configuracion
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. TABLA PROVENANCE_CLINICO (FHIR Provenance) — INMUTABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.provenance_clinico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_table TEXT NOT NULL,
  target_record_id UUID NOT NULL,
  replacement_record_id UUID,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'entered-in-error',
    'correction',
    'amendment'
  )),
  reason_code TEXT,
  reason_text TEXT NOT NULL CHECK (char_length(reason_text) >= 10),
  agent_user_id UUID NOT NULL,
  agent_role TEXT NOT NULL,
  agent_nombre_completo TEXT NOT NULL,
  client_ip INET,
  user_agent TEXT,
  previous_snapshot JSONB NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  country_code TEXT CHECK (country_code IN ('CO','MX','EC','PE','AR')),
  interop_broadcast_status TEXT DEFAULT 'not_required' CHECK (interop_broadcast_status IN (
    'not_required','pending','sent','failed'
  )),
  interop_broadcast_attempts INTEGER DEFAULT 0,
  interop_last_error TEXT,
  fhir_extensions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provenance_target ON public.provenance_clinico (target_table, target_record_id);
CREATE INDEX IF NOT EXISTS idx_provenance_replacement ON public.provenance_clinico (replacement_record_id);
CREATE INDEX IF NOT EXISTS idx_provenance_agent ON public.provenance_clinico (agent_user_id);
CREATE INDEX IF NOT EXISTS idx_provenance_recorded ON public.provenance_clinico (recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_provenance_interop ON public.provenance_clinico (interop_broadcast_status) 
  WHERE interop_broadcast_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_provenance_fhir ON public.provenance_clinico USING GIN (fhir_extensions);

-- ============================================================
-- 3. TRIGGERS DE INMUTABILIDAD
-- ============================================================
CREATE OR REPLACE FUNCTION public.prevent_provenance_modification()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Los registros de provenance_clinico son inmutables. No se permiten UPDATE ni DELETE. Para corregir un error de provenance, registra una nueva entrada que lo referencie.';
END;
$$;

DROP TRIGGER IF EXISTS trg_provenance_no_update ON public.provenance_clinico;
CREATE TRIGGER trg_provenance_no_update
  BEFORE UPDATE ON public.provenance_clinico
  FOR EACH ROW EXECUTE FUNCTION public.prevent_provenance_modification();

DROP TRIGGER IF EXISTS trg_provenance_no_delete ON public.provenance_clinico;
CREATE TRIGGER trg_provenance_no_delete
  BEFORE DELETE ON public.provenance_clinico
  FOR EACH ROW EXECUTE FUNCTION public.prevent_provenance_modification();

ALTER TABLE public.provenance_clinico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios autenticados pueden leer provenance" ON public.provenance_clinico;
CREATE POLICY "Usuarios autenticados pueden leer provenance"
  ON public.provenance_clinico FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Doctores y admin pueden registrar correcciones" ON public.provenance_clinico;
CREATE POLICY "Doctores y admin pueden registrar correcciones"
  ON public.provenance_clinico FOR INSERT
  WITH CHECK (
    auth.uid() = agent_user_id AND (
      public.has_role(auth.uid(), 'doctor') OR
      public.has_role(auth.uid(), 'nurse') OR
      public.has_role(auth.uid(), 'admin')
    )
  );

-- ============================================================
-- 4. AGREGAR CAMPOS DE ESTADO A TABLAS CLÍNICAS CORREGIBLES
-- ============================================================
ALTER TABLE public.respuestas_formularios 
  ADD COLUMN IF NOT EXISTS estado_registro TEXT NOT NULL DEFAULT 'active' 
    CHECK (estado_registro IN ('active','entered-in-error','superseded')),
  ADD COLUMN IF NOT EXISTS superseded_by UUID REFERENCES public.respuestas_formularios(id),
  ADD COLUMN IF NOT EXISTS supersedes UUID REFERENCES public.respuestas_formularios(id);

CREATE INDEX IF NOT EXISTS idx_respuestas_estado ON public.respuestas_formularios (estado_registro) 
  WHERE estado_registro != 'active';

ALTER TABLE public.ordenes_medicas 
  ADD COLUMN IF NOT EXISTS estado_registro TEXT NOT NULL DEFAULT 'active' 
    CHECK (estado_registro IN ('active','entered-in-error','superseded')),
  ADD COLUMN IF NOT EXISTS superseded_by UUID REFERENCES public.ordenes_medicas(id),
  ADD COLUMN IF NOT EXISTS supersedes UUID REFERENCES public.ordenes_medicas(id);

CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON public.ordenes_medicas (estado_registro) 
  WHERE estado_registro != 'active';

-- ============================================================
-- 5. TABLA OBSERVACIONES (FHIR Observation)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.observaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  admision_id UUID REFERENCES public.admisiones(id),
  medico_id UUID NOT NULL,
  codigo TEXT NOT NULL,
  sistema_codificacion TEXT NOT NULL,
  valor NUMERIC,
  unidad TEXT,
  fecha_registro TIMESTAMPTZ DEFAULT now(),
  estado TEXT DEFAULT 'final',
  estado_registro TEXT NOT NULL DEFAULT 'active' 
    CHECK (estado_registro IN ('active','entered-in-error','superseded')),
  superseded_by UUID REFERENCES public.observaciones(id),
  supersedes UUID REFERENCES public.observaciones(id),
  fhir_extensions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.observaciones 
  ADD COLUMN IF NOT EXISTS estado_registro TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS superseded_by UUID REFERENCES public.observaciones(id),
  ADD COLUMN IF NOT EXISTS supersedes UUID REFERENCES public.observaciones(id);

CREATE INDEX IF NOT EXISTS idx_observaciones_fhir ON public.observaciones USING GIN (fhir_extensions);
CREATE INDEX IF NOT EXISTS idx_observaciones_estado ON public.observaciones (estado_registro) 
  WHERE estado_registro != 'active';
CREATE INDEX IF NOT EXISTS idx_observaciones_paciente ON public.observaciones (paciente_id);
CREATE INDEX IF NOT EXISTS idx_observaciones_admision ON public.observaciones (admision_id);

ALTER TABLE public.observaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios autenticados pueden leer observaciones" ON public.observaciones;
CREATE POLICY "Usuarios autenticados pueden leer observaciones"
  ON public.observaciones FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Personal clínico puede crear observaciones" ON public.observaciones;
CREATE POLICY "Personal clínico puede crear observaciones"
  ON public.observaciones FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Personal clínico puede actualizar observaciones" ON public.observaciones;
CREATE POLICY "Personal clínico puede actualizar observaciones"
  ON public.observaciones FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'nurse') OR
    public.has_role(auth.uid(), 'admin')
  );

DROP TRIGGER IF EXISTS trg_observaciones_updated_at ON public.observaciones;
CREATE TRIGGER trg_observaciones_updated_at
  BEFORE UPDATE ON public.observaciones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();