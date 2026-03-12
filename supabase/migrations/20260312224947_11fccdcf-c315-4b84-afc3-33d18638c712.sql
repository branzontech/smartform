
CREATE TABLE public.ordenes_medicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_orden TEXT NOT NULL UNIQUE,
  
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  admision_id UUID REFERENCES admisiones(id),
  medico_id UUID NOT NULL,
  medico_nombre TEXT NOT NULL,
  
  tipo TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'activa',
  prioridad TEXT DEFAULT 'routine',
  
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  diagnostico_codigo TEXT,
  diagnostico_descripcion TEXT,
  diagnostico_sistema TEXT,
  
  indicaciones TEXT,
  
  fecha_orden TIMESTAMPTZ DEFAULT now(),
  fecha_vigencia DATE,
  
  fhir_extensions JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ordenes_paciente ON ordenes_medicas(paciente_id);
CREATE INDEX idx_ordenes_admision ON ordenes_medicas(admision_id);
CREATE INDEX idx_ordenes_tipo ON ordenes_medicas(tipo);
CREATE INDEX idx_ordenes_estado ON ordenes_medicas(estado);
CREATE INDEX idx_ordenes_fecha ON ordenes_medicas(fecha_orden);
CREATE INDEX idx_ordenes_items ON ordenes_medicas USING GIN (items);
CREATE INDEX idx_ordenes_fhir ON ordenes_medicas USING GIN (fhir_extensions);

ALTER TABLE ordenes_medicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profesionales crean órdenes"
  ON ordenes_medicas FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor')
  );

CREATE POLICY "Usuarios autenticados leen órdenes"
  ON ordenes_medicas FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Profesionales actualizan órdenes"
  ON ordenes_medicas FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor')
  );

CREATE OR REPLACE FUNCTION public.generar_numero_orden()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prefijo TEXT;
  siguiente INTEGER;
  anio TEXT;
BEGIN
  anio := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  prefijo := CASE NEW.tipo
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
  FROM ordenes_medicas
  WHERE numero_orden LIKE prefijo || '-' || anio || '-%';
  
  NEW.numero_orden := prefijo || '-' || anio || '-' || LPAD(siguiente::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_numero_orden
  BEFORE INSERT ON ordenes_medicas
  FOR EACH ROW
  WHEN (NEW.numero_orden IS NULL OR NEW.numero_orden = '')
  EXECUTE FUNCTION generar_numero_orden();
