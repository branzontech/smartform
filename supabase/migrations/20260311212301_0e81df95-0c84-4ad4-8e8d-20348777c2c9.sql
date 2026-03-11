ALTER TABLE public.pacientes ADD COLUMN IF NOT EXISTS genero TEXT DEFAULT NULL;
COMMENT ON COLUMN pacientes.genero IS 'FHIR Patient.gender: male | female | other | unknown';