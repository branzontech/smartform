
-- Remove old CHECK constraint if exists, update existing data
UPDATE public.formularios SET tipo = 'historia_clinica' WHERE tipo = 'formato';
UPDATE public.formularios SET tipo = 'encuesta' WHERE tipo = 'forms';
