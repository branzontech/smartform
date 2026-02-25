
-- Add opciones column (for select fields) and placeholder column to both config tables
ALTER TABLE public.configuracion_campos_paciente
  ADD COLUMN IF NOT EXISTS opciones jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS placeholder text,
  ADD COLUMN IF NOT EXISTS maestro text;

ALTER TABLE public.configuracion_campos_admision
  ADD COLUMN IF NOT EXISTS opciones jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS placeholder text,
  ADD COLUMN IF NOT EXISTS maestro text;
