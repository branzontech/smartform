
-- Create sequence for automatic medical record numbers
CREATE SEQUENCE IF NOT EXISTS public.numero_historia_seq START WITH 1000;

-- Set default for numero_historia using the sequence
ALTER TABLE public.pacientes 
  ALTER COLUMN numero_historia SET DEFAULT 'HC-' || nextval('public.numero_historia_seq');

-- Actually, DEFAULT with concatenation doesn't work directly. Use a trigger instead.
ALTER TABLE public.pacientes ALTER COLUMN numero_historia DROP DEFAULT;

CREATE OR REPLACE FUNCTION public.generate_numero_historia()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.numero_historia IS NULL OR NEW.numero_historia = '' THEN
    NEW.numero_historia := NEW.tipo_documento || NEW.numero_documento;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_generate_numero_historia ON public.pacientes;
CREATE TRIGGER trg_generate_numero_historia
  BEFORE INSERT ON public.pacientes
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_numero_historia();
