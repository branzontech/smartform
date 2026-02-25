
-- Enum for contract types
CREATE TYPE public.tipo_contratacion AS ENUM ('evento', 'capita', 'paquete', 'particular');

-- Pagadores (Payers/Organizations)
CREATE TABLE public.pagadores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo_identificacion TEXT,
  numero_identificacion TEXT,
  pais TEXT NOT NULL DEFAULT 'CO',
  es_particular BOOLEAN NOT NULL DEFAULT false,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contratos (Contracts/Agreements)
CREATE TABLE public.contratos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pagador_id UUID NOT NULL REFERENCES public.pagadores(id) ON DELETE CASCADE,
  nombre_convenio TEXT NOT NULL,
  tipo_contratacion public.tipo_contratacion NOT NULL DEFAULT 'particular',
  fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin DATE,
  estado TEXT NOT NULL DEFAULT 'activo',
  reglas_facturacion JSONB NOT NULL DEFAULT '{}'::jsonb,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated_at triggers
CREATE TRIGGER update_pagadores_updated_at
  BEFORE UPDATE ON public.pagadores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contratos_updated_at
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.pagadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pagadores"
  ON public.pagadores FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage pagadores"
  ON public.pagadores FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view contratos"
  ON public.contratos FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage contratos"
  ON public.contratos FOR ALL USING (true) WITH CHECK (true);

-- Auto-create "Paciente Particular" payer and default contract
-- This function is called by the handle_new_user trigger chain
CREATE OR REPLACE FUNCTION public.create_default_payer_and_contract()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  payer_id UUID;
BEGIN
  -- Check if a "Paciente Particular" payer already exists
  SELECT id INTO payer_id FROM public.pagadores WHERE es_particular = true LIMIT 1;

  IF payer_id IS NULL THEN
    INSERT INTO public.pagadores (nombre, es_particular, pais)
    VALUES ('Paciente Particular', true, 'CO')
    RETURNING id INTO payer_id;

    INSERT INTO public.contratos (pagador_id, nombre_convenio, tipo_contratacion, estado)
    VALUES (payer_id, 'Convenio Particular (por defecto)', 'particular', 'activo');
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on new profile creation (fires after handle_new_user inserts profile)
CREATE TRIGGER ensure_default_payer
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_payer_and_contract();

-- Seed the default payer now for existing accounts
DO $$
DECLARE
  payer_id UUID;
BEGIN
  SELECT id INTO payer_id FROM public.pagadores WHERE es_particular = true LIMIT 1;
  IF payer_id IS NULL THEN
    INSERT INTO public.pagadores (nombre, es_particular, pais)
    VALUES ('Paciente Particular', true, 'CO')
    RETURNING id INTO payer_id;

    INSERT INTO public.contratos (pagador_id, nombre_convenio, tipo_contratacion, estado)
    VALUES (payer_id, 'Convenio Particular (por defecto)', 'particular', 'activo');
  END IF;
END;
$$;
