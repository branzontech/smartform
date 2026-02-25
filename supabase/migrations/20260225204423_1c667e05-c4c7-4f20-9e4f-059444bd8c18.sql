
-- Refactor configuracion_encabezado for multi-country/entity support
ALTER TABLE public.configuracion_encabezado
  ADD COLUMN IF NOT EXISTS tipo_entidad text NOT NULL DEFAULT 'institucion',
  ADD COLUMN IF NOT EXISTS pais text NOT NULL DEFAULT 'CO',
  ADD COLUMN IF NOT EXISTS identificacion_fiscal jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS datos_regulatorios jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Rename nombre_institucion to nombre_principal (universal)
ALTER TABLE public.configuracion_encabezado RENAME COLUMN nombre_institucion TO nombre_principal;

-- Migrate existing data: move nit and resolucion into JSONB columns
UPDATE public.configuracion_encabezado
SET 
  identificacion_fiscal = jsonb_build_object('tipo', 'NIT', 'numero', COALESCE(nit, '')),
  datos_regulatorios = jsonb_build_object('tipo', 'Resolución de Habilitación', 'valor', COALESCE(resolucion_habilitacion, ''))
WHERE nit IS NOT NULL OR resolucion_habilitacion IS NOT NULL;

-- Drop legacy columns
ALTER TABLE public.configuracion_encabezado DROP COLUMN IF EXISTS nit;
ALTER TABLE public.configuracion_encabezado DROP COLUMN IF EXISTS resolucion_habilitacion;
