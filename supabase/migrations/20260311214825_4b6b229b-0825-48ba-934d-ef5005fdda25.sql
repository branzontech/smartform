
CREATE TABLE public.correcciones_registro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  respuesta_formulario_id UUID NOT NULL REFERENCES respuestas_formularios(id) ON DELETE CASCADE,
  admision_id UUID NOT NULL REFERENCES admisiones(id) ON DELETE CASCADE,
  medico_id UUID NOT NULL,
  medico_nombre TEXT NOT NULL,
  campo_corregido TEXT NOT NULL,
  valor_anterior JSONB,
  valor_nuevo JSONB,
  motivo TEXT NOT NULL,
  tipo_correccion TEXT NOT NULL DEFAULT 'amendment',
  fhir_provenance_target TEXT,
  fhir_extensions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_correcciones_respuesta ON correcciones_registro(respuesta_formulario_id);
CREATE INDEX idx_correcciones_admision ON correcciones_registro(admision_id);
CREATE INDEX idx_correcciones_medico ON correcciones_registro(medico_id);
CREATE INDEX idx_correcciones_fhir ON correcciones_registro USING GIN (fhir_extensions);

ALTER TABLE correcciones_registro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Médicos y admins crean correcciones"
  ON correcciones_registro FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'doctor')
  );

CREATE POLICY "Profesionales leen correcciones"
  ON correcciones_registro FOR SELECT
  USING (auth.uid() IS NOT NULL);
