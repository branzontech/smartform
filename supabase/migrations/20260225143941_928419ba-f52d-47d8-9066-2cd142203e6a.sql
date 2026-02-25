
-- Add missing patient-level columns
ALTER TABLE public.pacientes 
  ADD COLUMN IF NOT EXISTS tipo_documento text DEFAULT 'CC',
  ADD COLUMN IF NOT EXISTS numero_historia text,
  ADD COLUMN IF NOT EXISTS carnet text,
  ADD COLUMN IF NOT EXISTS tipo_afiliacion text;

-- Add missing admission-level columns
ALTER TABLE public.admisiones
  ADD COLUMN IF NOT EXISTS numero_ingreso text,
  ADD COLUMN IF NOT EXISTS factura text,
  ADD COLUMN IF NOT EXISTS numero_estudio text;
