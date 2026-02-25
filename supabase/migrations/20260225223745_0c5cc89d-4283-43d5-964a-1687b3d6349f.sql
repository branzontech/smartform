-- Remove restrictive check constraint on formularios.tipo
-- to allow FHIR-aligned form types (e.g. historia_clinica, evaluacion, procedimiento)
ALTER TABLE public.formularios DROP CONSTRAINT IF EXISTS formularios_tipo_check;