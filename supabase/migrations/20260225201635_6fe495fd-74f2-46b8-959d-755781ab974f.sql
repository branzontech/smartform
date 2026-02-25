
-- Table: respuestas_formularios (FHIR QuestionnaireResponse equivalent)
CREATE TABLE public.respuestas_formularios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formulario_id UUID NOT NULL REFERENCES public.formularios(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  admision_id UUID REFERENCES public.admisiones(id) ON DELETE SET NULL,
  medico_id UUID NOT NULL,
  datos_respuesta JSONB NOT NULL DEFAULT '{}'::jsonb,
  fhir_extensions JSONB NOT NULL DEFAULT '{}'::jsonb,
  fecha_registro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_respuestas_formulario ON public.respuestas_formularios(formulario_id);
CREATE INDEX idx_respuestas_paciente ON public.respuestas_formularios(paciente_id);
CREATE INDEX idx_respuestas_admision ON public.respuestas_formularios(admision_id);
CREATE INDEX idx_respuestas_medico ON public.respuestas_formularios(medico_id);

-- RLS
ALTER TABLE public.respuestas_formularios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view responses"
  ON public.respuestas_formularios FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create responses"
  ON public.respuestas_formularios FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update responses"
  ON public.respuestas_formularios FOR UPDATE
  USING (true);

-- Auto-update updated_at
CREATE TRIGGER update_respuestas_formularios_updated_at
  BEFORE UPDATE ON public.respuestas_formularios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Increment respuestas_count on formularios when a response is inserted
CREATE OR REPLACE FUNCTION public.increment_form_response_count()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.formularios
  SET respuestas_count = respuestas_count + 1
  WHERE id = NEW.formulario_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_increment_response_count
  AFTER INSERT ON public.respuestas_formularios
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_form_response_count();
