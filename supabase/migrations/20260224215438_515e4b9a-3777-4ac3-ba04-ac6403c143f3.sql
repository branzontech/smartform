
-- =============================================
-- Tabla: configuracion_campos_paciente
-- Gestiona campos dinámicos del formulario de pacientes
-- =============================================
CREATE TABLE public.configuracion_campos_paciente (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  tipo_dato TEXT NOT NULL DEFAULT 'text' CHECK (tipo_dato IN ('text', 'number', 'date')),
  es_requerido BOOLEAN NOT NULL DEFAULT false,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.configuracion_campos_paciente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view field config"
  ON public.configuracion_campos_paciente FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage field config"
  ON public.configuracion_campos_paciente FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- Tabla: pacientes (FHIR Patient Resource)
-- Modelada según HL7 FHIR R4 Patient
-- =============================================
CREATE TABLE public.pacientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  numero_documento TEXT NOT NULL UNIQUE,
  fecha_nacimiento DATE,
  telefono_principal TEXT NOT NULL,
  telefono_secundario TEXT,
  email TEXT,
  regimen TEXT,
  zona TEXT,
  direccion TEXT,
  ciudad TEXT,
  estado TEXT,
  ocupacion TEXT,
  fhir_extensions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view patients"
  ON public.pacientes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create patients"
  ON public.pacientes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update patients"
  ON public.pacientes FOR UPDATE
  TO authenticated
  USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_pacientes_updated_at
  BEFORE UPDATE ON public.pacientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_config_campos_updated_at
  BEFORE UPDATE ON public.configuracion_campos_paciente
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para búsqueda
CREATE INDEX idx_pacientes_documento ON public.pacientes(numero_documento);
CREATE INDEX idx_pacientes_nombres ON public.pacientes USING gin(to_tsvector('spanish', nombres || ' ' || apellidos));
