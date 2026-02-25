
ALTER TABLE public.admisiones 
  ADD COLUMN contrato_id uuid REFERENCES public.contratos(id),
  ADD COLUMN servicio_id uuid REFERENCES public.tarifarios_servicios(id);
