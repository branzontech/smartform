-- Activar trigger para generar número consecutivo de órdenes médicas
-- La función generar_numero_orden() ya existe pero no estaba enganchada como trigger
DROP TRIGGER IF EXISTS trg_generar_numero_orden ON public.ordenes_medicas;

CREATE TRIGGER trg_generar_numero_orden
BEFORE INSERT ON public.ordenes_medicas
FOR EACH ROW
WHEN (NEW.numero_orden IS NULL OR NEW.numero_orden ~ 'TEMP')
EXECUTE FUNCTION public.generar_numero_orden();

-- Backfill: corregir órdenes existentes que quedaron con valor 'TEMP'
DO $$
DECLARE
  r RECORD;
  prefijo TEXT;
  siguiente INTEGER;
  anio TEXT;
BEGIN
  FOR r IN
    SELECT id, tipo, created_at
    FROM public.ordenes_medicas
    WHERE numero_orden ~ 'TEMP'
    ORDER BY created_at ASC
  LOOP
    anio := EXTRACT(YEAR FROM r.created_at)::TEXT;
    prefijo := CASE r.tipo
      WHEN 'medicamento' THEN 'RX'
      WHEN 'laboratorio' THEN 'LAB'
      WHEN 'imagenologia' THEN 'IMG'
      WHEN 'interconsulta' THEN 'IC'
      WHEN 'procedimiento' THEN 'PX'
      ELSE 'ORD'
    END;

    SELECT COALESCE(MAX(
      CAST(SPLIT_PART(numero_orden, '-', 3) AS INTEGER)
    ), 0) + 1 INTO siguiente
    FROM public.ordenes_medicas
    WHERE numero_orden LIKE prefijo || '-' || anio || '-%'
      AND numero_orden !~ 'TEMP';

    UPDATE public.ordenes_medicas
    SET numero_orden = prefijo || '-' || anio || '-' || LPAD(siguiente::TEXT, 5, '0')
    WHERE id = r.id;
  END LOOP;
END $$;