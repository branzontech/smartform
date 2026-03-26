ALTER TABLE public.ordenes_medicas 
ADD COLUMN alcance text NOT NULL DEFAULT 'interna';

CREATE OR REPLACE FUNCTION public.validate_ordenes_medicas_alcance()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.alcance NOT IN ('interna', 'externa') THEN
    RAISE EXCEPTION 'alcance must be one of: interna, externa';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_validate_ordenes_alcance
  BEFORE INSERT OR UPDATE ON public.ordenes_medicas
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_ordenes_medicas_alcance();