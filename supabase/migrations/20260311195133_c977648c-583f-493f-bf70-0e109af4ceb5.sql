
CREATE TABLE public.configuracion_encabezado_paciente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campo TEXT NOT NULL,
  etiqueta TEXT NOT NULL,
  fhir_path TEXT,
  fhir_element_type TEXT,
  orden INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  grupo TEXT DEFAULT 'principal',
  formato TEXT DEFAULT 'text',
  icono TEXT,
  pais TEXT[] DEFAULT '{}',
  fhir_extensions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campo)
);

CREATE INDEX idx_config_encabezado_orden ON configuracion_encabezado_paciente(orden);
CREATE INDEX idx_config_encabezado_fhir ON configuracion_encabezado_paciente USING GIN (fhir_extensions);

ALTER TABLE configuracion_encabezado_paciente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gestionan configuración encabezado"
  ON configuracion_encabezado_paciente FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuarios autenticados leen configuración encabezado"
  ON configuracion_encabezado_paciente FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

INSERT INTO configuracion_encabezado_paciente
  (campo, etiqueta, fhir_path, fhir_element_type, orden, visible, grupo, formato, icono, pais)
VALUES
  ('nombre_completo',    'Paciente',        'Patient.name',       'HumanName',       1,  true,  'principal',   'text',               'User',       '{}'),
  ('numero_documento',   'Documento',        'Patient.identifier', 'Identifier',      2,  true,  'principal',   'document_with_type', 'CreditCard', '{}'),
  ('fecha_nacimiento',   'Edad',             'Patient.birthDate',  'date',            3,  true,  'principal',   'age_from_date',      'Calendar',   '{}'),
  ('telefono_principal', 'Teléfono',         'Patient.telecom',    'ContactPoint',    4,  true,  'principal',   'phone',              'Phone',      '{}'),
  ('email',              'Email',            'Patient.telecom',    'ContactPoint',    5,  false, 'secundario',  'text',               'Mail',       '{}'),
  ('numero_historia',    'Historia Clínica', 'Patient.identifier', 'Identifier',      6,  true,  'principal',   'text',               'FileText',   '{}'),
  ('tipo_afiliacion',    'Afiliación',       'Patient.extension',  'CodeableConcept', 7,  true,  'secundario',  'badge',              'Shield',     '{CO}'),
  ('regimen',            'Régimen',          'Patient.extension',  'CodeableConcept', 8,  true,  'secundario',  'badge',              'Heart',      '{CO}'),
  ('direccion',          'Dirección',        'Patient.address',    'Address',         9,  false, 'secundario',  'text',               'MapPin',     '{}'),
  ('ciudad',             'Ciudad',           'Patient.address.city','string',         10, false, 'secundario',  'text',               'Building',   '{}'),
  ('ocupacion',          'Ocupación',        'Patient.extension',  'string',          11, false, 'regulatorio', 'text',               'Briefcase',  '{CO,EC}'),
  ('carnet',             'Carnet',           'Patient.identifier', 'Identifier',      12, false, 'regulatorio', 'text',               'IdCard',     '{CO}');
