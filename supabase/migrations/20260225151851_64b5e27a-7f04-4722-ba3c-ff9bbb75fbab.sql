
-- Catalog table for CIE-10 and CIE-11 diagnosis codes (FHIR CodeSystem)
CREATE TABLE public.catalogo_diagnosticos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sistema TEXT NOT NULL, -- 'CIE-10' or 'CIE-11'
  codigo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  capitulo TEXT, -- Chapter grouping
  fhir_system_uri TEXT NOT NULL, -- FHIR CodeSystem URI
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast search
CREATE INDEX idx_diagnosticos_sistema ON public.catalogo_diagnosticos(sistema);
CREATE INDEX idx_diagnosticos_codigo ON public.catalogo_diagnosticos(codigo);
CREATE INDEX idx_diagnosticos_search ON public.catalogo_diagnosticos USING gin(to_tsvector('spanish', codigo || ' ' || descripcion));

-- RLS
ALTER TABLE public.catalogo_diagnosticos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view diagnostics catalog"
  ON public.catalogo_diagnosticos FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage diagnostics catalog"
  ON public.catalogo_diagnosticos FOR ALL
  USING (true)
  WITH CHECK (true);

-- Seed CIE-10 codes (10 common codes with FHIR mapping)
INSERT INTO public.catalogo_diagnosticos (sistema, codigo, descripcion, capitulo, fhir_system_uri) VALUES
  ('CIE-10', 'E11', 'Diabetes mellitus tipo 2', 'IV - Enfermedades endocrinas', 'http://hl7.org/fhir/sid/icd-10'),
  ('CIE-10', 'I10', 'Hipertensión esencial (primaria)', 'IX - Enfermedades del sistema circulatorio', 'http://hl7.org/fhir/sid/icd-10'),
  ('CIE-10', 'J45', 'Asma', 'X - Enfermedades del sistema respiratorio', 'http://hl7.org/fhir/sid/icd-10'),
  ('CIE-10', 'K29.7', 'Gastritis, no especificada', 'XI - Enfermedades del aparato digestivo', 'http://hl7.org/fhir/sid/icd-10'),
  ('CIE-10', 'M54.5', 'Dolor en la región lumbar', 'XIII - Enfermedades del sistema osteomuscular', 'http://hl7.org/fhir/sid/icd-10'),
  ('CIE-10', 'G43', 'Migraña', 'VI - Enfermedades del sistema nervioso', 'http://hl7.org/fhir/sid/icd-10'),
  ('CIE-10', 'F41.1', 'Trastorno de ansiedad generalizada', 'V - Trastornos mentales', 'http://hl7.org/fhir/sid/icd-10'),
  ('CIE-10', 'F32', 'Episodio depresivo', 'V - Trastornos mentales', 'http://hl7.org/fhir/sid/icd-10'),
  ('CIE-10', 'N39.0', 'Infección de vías urinarias, sitio no especificado', 'XIV - Enfermedades del aparato genitourinario', 'http://hl7.org/fhir/sid/icd-10'),
  ('CIE-10', 'J06.9', 'Infección aguda de las vías respiratorias superiores, no especificada', 'X - Enfermedades del sistema respiratorio', 'http://hl7.org/fhir/sid/icd-10');

-- Seed CIE-11 codes (10 common codes with FHIR mapping)
INSERT INTO public.catalogo_diagnosticos (sistema, codigo, descripcion, capitulo, fhir_system_uri) VALUES
  ('CIE-11', '5A11', 'Diabetes mellitus tipo 2', '5 - Enfermedades endocrinas', 'http://id.who.int/icd/release/11/mms'),
  ('CIE-11', 'BA00', 'Hipertensión esencial', '11 - Enfermedades del aparato circulatorio', 'http://id.who.int/icd/release/11/mms'),
  ('CIE-11', 'CA23', 'Asma', '12 - Enfermedades del aparato respiratorio', 'http://id.who.int/icd/release/11/mms'),
  ('CIE-11', 'DA43.Z', 'Gastritis, sin especificación', '13 - Enfermedades del aparato digestivo', 'http://id.who.int/icd/release/11/mms'),
  ('CIE-11', 'ME84', 'Dolor lumbar', '15 - Enfermedades del sistema musculoesquelético', 'http://id.who.int/icd/release/11/mms'),
  ('CIE-11', '8A80', 'Migraña', '8 - Enfermedades del sistema nervioso', 'http://id.who.int/icd/release/11/mms'),
  ('CIE-11', '6B00', 'Trastorno de ansiedad generalizada', '6 - Trastornos mentales', 'http://id.who.int/icd/release/11/mms'),
  ('CIE-11', '6A70', 'Episodio depresivo único', '6 - Trastornos mentales', 'http://id.who.int/icd/release/11/mms'),
  ('CIE-11', 'GC08', 'Infección del tracto urinario, sitio no especificado', '16 - Enfermedades del aparato genitourinario', 'http://id.who.int/icd/release/11/mms'),
  ('CIE-11', 'CA07.Y', 'Infección aguda de las vías respiratorias superiores, no especificada', '12 - Enfermedades del aparato respiratorio', 'http://id.who.int/icd/release/11/mms');
