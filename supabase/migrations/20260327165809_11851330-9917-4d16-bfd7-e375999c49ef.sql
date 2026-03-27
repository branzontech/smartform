
CREATE TABLE public.incapacidades (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
  admision_id uuid REFERENCES public.admisiones(id),
  medico_id uuid NOT NULL,
  medico_nombre text NOT NULL,
  fecha_inicio date NOT NULL,
  fecha_fin date NOT NULL,
  dias integer NOT NULL GENERATED ALWAYS AS (fecha_fin - fecha_inicio + 1) STORED,
  diagnostico_codigo text,
  diagnostico_descripcion text,
  tipo text NOT NULL DEFAULT 'general',
  observaciones text,
  estado text NOT NULL DEFAULT 'activa',
  fhir_extensions jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.incapacidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profesionales crean incapacidades"
  ON public.incapacidades FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Usuarios autenticados leen incapacidades"
  ON public.incapacidades FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Profesionales actualizan incapacidades"
  ON public.incapacidades FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'doctor'::app_role));

CREATE OR REPLACE FUNCTION public.validate_incapacidades()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.tipo NOT IN ('general', 'laboral', 'maternidad', 'paternidad', 'accidente') THEN
    RAISE EXCEPTION 'tipo must be one of: general, laboral, maternidad, paternidad, accidente';
  END IF;
  IF NEW.estado NOT IN ('activa', 'anulada') THEN
    RAISE EXCEPTION 'estado must be one of: activa, anulada';
  END IF;
  IF NEW.fecha_fin < NEW.fecha_inicio THEN
    RAISE EXCEPTION 'fecha_fin must be >= fecha_inicio';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_validate_incapacidades
  BEFORE INSERT OR UPDATE ON public.incapacidades
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_incapacidades();

CREATE TRIGGER update_incapacidades_updated_at
  BEFORE UPDATE ON public.incapacidades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
