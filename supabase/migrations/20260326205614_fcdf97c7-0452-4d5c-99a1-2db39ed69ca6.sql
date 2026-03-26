
-- ========================================
-- TABLA 1: inventario_stock
-- ========================================
CREATE TABLE public.inventario_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID NOT NULL REFERENCES catalogo_productos(id),
  presentacion_id UUID NOT NULL REFERENCES presentaciones_producto(id),
  sede_id UUID NOT NULL REFERENCES sedes(id),
  cantidad_disponible INTEGER NOT NULL DEFAULT 0,
  cantidad_minima INTEGER DEFAULT 0,
  cantidad_maxima INTEGER DEFAULT 0,
  ubicacion_almacen TEXT,
  fhir_extensions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_stock_sede UNIQUE(presentacion_id, sede_id)
);

CREATE INDEX idx_inv_stock_producto ON inventario_stock(producto_id);
CREATE INDEX idx_inv_stock_sede ON inventario_stock(sede_id);
CREATE INDEX idx_inv_stock_fhir ON inventario_stock USING GIN(fhir_extensions);

ALTER TABLE inventario_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stock"
  ON inventario_stock FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert stock"
  ON inventario_stock FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update stock"
  ON inventario_stock FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete stock"
  ON inventario_stock FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_updated_at_inventario_stock
  BEFORE UPDATE ON inventario_stock
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- TABLA 2: inventario_lotes
-- ========================================
CREATE TABLE public.inventario_lotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID NOT NULL REFERENCES inventario_stock(id) ON DELETE CASCADE,
  numero_lote TEXT NOT NULL,
  fecha_fabricacion DATE,
  fecha_vencimiento DATE NOT NULL,
  numero_serie TEXT,
  cantidad INTEGER NOT NULL DEFAULT 0,
  estado TEXT DEFAULT 'disponible',
  fhir_extensions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_inventario_lotes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado NOT IN ('disponible','cuarentena','vencido','agotado') THEN
    RAISE EXCEPTION 'estado must be one of: disponible, cuarentena, vencido, agotado';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_inventario_lotes
  BEFORE INSERT OR UPDATE ON inventario_lotes
  FOR EACH ROW EXECUTE FUNCTION validate_inventario_lotes();

CREATE INDEX idx_inv_lotes_vencimiento ON inventario_lotes(fecha_vencimiento);
CREATE INDEX idx_inv_lotes_stock ON inventario_lotes(stock_id);
CREATE INDEX idx_inv_lotes_fhir ON inventario_lotes USING GIN(fhir_extensions);

ALTER TABLE inventario_lotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lotes"
  ON inventario_lotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert lotes"
  ON inventario_lotes FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update lotes"
  ON inventario_lotes FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete lotes"
  ON inventario_lotes FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_updated_at_inventario_lotes
  BEFORE UPDATE ON inventario_lotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- TABLA 3: inventario_movimientos (inmutable)
-- ========================================
CREATE TABLE public.inventario_movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID NOT NULL REFERENCES inventario_stock(id),
  lote_id UUID REFERENCES inventario_lotes(id),
  tipo_movimiento TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  motivo TEXT,
  referencia_tipo TEXT,
  referencia_id UUID,
  usuario_id UUID NOT NULL,
  fecha_movimiento TIMESTAMPTZ DEFAULT now(),
  fhir_extensions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_inventario_movimientos()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo_movimiento NOT IN ('entrada','salida','ajuste_positivo','ajuste_negativo','transferencia_entrada','transferencia_salida','devolucion') THEN
    RAISE EXCEPTION 'tipo_movimiento must be one of: entrada, salida, ajuste_positivo, ajuste_negativo, transferencia_entrada, transferencia_salida, devolucion';
  END IF;
  IF NEW.cantidad <= 0 THEN
    RAISE EXCEPTION 'cantidad must be greater than 0';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_inventario_movimientos
  BEFORE INSERT OR UPDATE ON inventario_movimientos
  FOR EACH ROW EXECUTE FUNCTION validate_inventario_movimientos();

CREATE INDEX idx_inv_mov_stock ON inventario_movimientos(stock_id);
CREATE INDEX idx_inv_mov_fecha ON inventario_movimientos(fecha_movimiento);
CREATE INDEX idx_inv_mov_ref ON inventario_movimientos(referencia_id);

ALTER TABLE inventario_movimientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view movimientos"
  ON inventario_movimientos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Clinical staff can insert movimientos"
  ON inventario_movimientos FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'doctor'::app_role)
    OR has_role(auth.uid(), 'nurse'::app_role)
  );
-- No UPDATE/DELETE policies (immutability)

-- ========================================
-- TRIGGER: Auto-update stock on movement
-- ========================================
CREATE OR REPLACE FUNCTION public.fn_actualizar_stock_por_movimiento()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo_movimiento IN ('entrada','ajuste_positivo','transferencia_entrada','devolucion') THEN
    UPDATE inventario_stock SET cantidad_disponible = cantidad_disponible + NEW.cantidad, updated_at = now() WHERE id = NEW.stock_id;
    IF NEW.lote_id IS NOT NULL THEN
      UPDATE inventario_lotes SET cantidad = cantidad + NEW.cantidad, updated_at = now() WHERE id = NEW.lote_id;
    END IF;
  ELSIF NEW.tipo_movimiento IN ('salida','ajuste_negativo','transferencia_salida') THEN
    IF (SELECT cantidad_disponible FROM inventario_stock WHERE id = NEW.stock_id) < NEW.cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente para este movimiento';
    END IF;
    UPDATE inventario_stock SET cantidad_disponible = cantidad_disponible - NEW.cantidad, updated_at = now() WHERE id = NEW.stock_id;
    IF NEW.lote_id IS NOT NULL THEN
      UPDATE inventario_lotes SET cantidad = cantidad - NEW.cantidad, updated_at = now() WHERE id = NEW.lote_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_movimiento_stock
  AFTER INSERT ON inventario_movimientos
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_stock_por_movimiento();
