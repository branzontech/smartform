
-- Items normalizados de procedimientos
CREATE TABLE public.orden_procedimiento_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID NOT NULL REFERENCES ordenes_medicas(id) ON DELETE CASCADE,
  procedimiento_id UUID NOT NULL REFERENCES catalogo_procedimientos(id),
  codigo_procedimiento TEXT NOT NULL,
  descripcion_procedimiento TEXT NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  dias INTEGER NOT NULL DEFAULT 1,
  notas TEXT,
  fhir_extensions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Validation trigger instead of CHECK constraints
CREATE OR REPLACE FUNCTION public.validate_orden_procedimiento_items()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  IF NEW.cantidad <= 0 THEN
    RAISE EXCEPTION 'cantidad must be greater than 0';
  END IF;
  IF NEW.dias <= 0 THEN
    RAISE EXCEPTION 'dias must be greater than 0';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_orden_procedimiento_items
  BEFORE INSERT OR UPDATE ON orden_procedimiento_items
  FOR EACH ROW EXECUTE FUNCTION validate_orden_procedimiento_items();

CREATE INDEX idx_ord_proc_items_orden ON orden_procedimiento_items(orden_id);
CREATE INDEX idx_ord_proc_items_proc ON orden_procedimiento_items(procedimiento_id);

ALTER TABLE orden_procedimiento_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view orden_procedimiento_items" ON orden_procedimiento_items
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can insert orden_procedimiento_items" ON orden_procedimiento_items
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Doctors can delete orden_procedimiento_items" ON orden_procedimiento_items
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM ordenes_medicas om
      WHERE om.id = orden_procedimiento_items.orden_id
      AND (om.medico_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- Add servicio_id to ordenes_medicas
ALTER TABLE ordenes_medicas ADD COLUMN IF NOT EXISTS servicio_id UUID REFERENCES servicios_clinicos(id);
CREATE INDEX IF NOT EXISTS idx_ord_med_servicio ON ordenes_medicas(servicio_id);
