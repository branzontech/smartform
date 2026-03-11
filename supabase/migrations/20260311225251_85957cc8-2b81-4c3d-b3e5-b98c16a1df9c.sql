
-- Tabla de clientes de cotización
CREATE TABLE public.clientes_cotizacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_persona TEXT NOT NULL DEFAULT 'natural',
  tipo_documento TEXT NOT NULL,
  numero_documento TEXT NOT NULL,
  nombre_razon_social TEXT NOT NULL,
  correo TEXT,
  telefono_contacto TEXT,
  direccion TEXT,
  ciudad TEXT,
  pais TEXT DEFAULT 'CO',
  pagador_id UUID REFERENCES pagadores(id),
  fhir_extensions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tipo_documento, numero_documento)
);

CREATE INDEX idx_clientes_cotizacion_documento ON clientes_cotizacion(tipo_documento, numero_documento);
CREATE INDEX idx_clientes_cotizacion_fhir ON clientes_cotizacion USING GIN (fhir_extensions);

ALTER TABLE clientes_cotizacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados gestionan clientes cotización"
  ON clientes_cotizacion FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Tabla de cotizaciones
CREATE TABLE public.cotizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_cotizacion TEXT NOT NULL UNIQUE,
  cliente_cotizacion_id UUID NOT NULL REFERENCES clientes_cotizacion(id),
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_validez DATE NOT NULL,
  estado TEXT NOT NULL DEFAULT 'borrador',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  descuento_porcentaje NUMERIC(5,2) DEFAULT 0,
  descuento_valor NUMERIC(12,2) DEFAULT 0,
  impuesto_porcentaje NUMERIC(5,2) DEFAULT 0,
  impuesto_valor NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  moneda TEXT DEFAULT 'COP',
  observaciones TEXT,
  leyenda_validez TEXT,
  creado_por UUID NOT NULL,
  fhir_extensions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cotizaciones_cliente ON cotizaciones(cliente_cotizacion_id);
CREATE INDEX idx_cotizaciones_estado ON cotizaciones(estado);
CREATE INDEX idx_cotizaciones_fecha ON cotizaciones(fecha_emision);
CREATE INDEX idx_cotizaciones_fhir ON cotizaciones USING GIN (fhir_extensions);

ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados gestionan cotizaciones"
  ON cotizaciones FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Items de cotización
CREATE TABLE public.cotizacion_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id UUID NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  tarifario_servicio_id UUID REFERENCES tarifarios_servicios(id),
  codigo_servicio TEXT,
  descripcion_servicio TEXT NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  valor_unitario NUMERIC(12,2) NOT NULL,
  descuento_porcentaje NUMERIC(5,2) DEFAULT 0,
  valor_total NUMERIC(12,2) NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  fhir_extensions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cotizacion_items_cotizacion ON cotizacion_items(cotizacion_id);
CREATE INDEX idx_cotizacion_items_fhir ON cotizacion_items USING GIN (fhir_extensions);

ALTER TABLE cotizacion_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados gestionan items cotización"
  ON cotizacion_items FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Función para auto-generar número de cotización
CREATE OR REPLACE FUNCTION generar_numero_cotizacion()
RETURNS TRIGGER AS $$
DECLARE
  siguiente INTEGER;
  anio TEXT;
BEGIN
  anio := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(numero_cotizacion, '-', 3) AS INTEGER)
  ), 0) + 1 INTO siguiente
  FROM cotizaciones
  WHERE numero_cotizacion LIKE 'COT-' || anio || '-%';
  
  NEW.numero_cotizacion := 'COT-' || anio || '-' || LPAD(siguiente::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_numero_cotizacion
  BEFORE INSERT ON cotizaciones
  FOR EACH ROW
  WHEN (NEW.numero_cotizacion IS NULL OR NEW.numero_cotizacion = '')
  EXECUTE FUNCTION generar_numero_cotizacion();

-- Configuración de cotizaciones
CREATE TABLE public.configuracion_cotizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dias_validez INTEGER NOT NULL DEFAULT 30,
  leyenda_validez_defecto TEXT DEFAULT 'Esta cotización tiene una validez de {dias} días calendario a partir de la fecha de emisión.',
  moneda_defecto TEXT DEFAULT 'COP',
  impuesto_defecto NUMERIC(5,2) DEFAULT 0,
  nombre_impuesto TEXT DEFAULT 'IVA',
  notas_legales TEXT,
  fhir_extensions JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE configuracion_cotizaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gestionan config cotizaciones"
  ON configuracion_cotizaciones FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuarios leen config cotizaciones"
  ON configuracion_cotizaciones FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Seed de configuración por defecto
INSERT INTO configuracion_cotizaciones (dias_validez, leyenda_validez_defecto, moneda_defecto, impuesto_defecto, nombre_impuesto)
VALUES (30, 'Esta cotización tiene una validez de {dias} días calendario a partir de la fecha de emisión.', 'COP', 19.00, 'IVA');
