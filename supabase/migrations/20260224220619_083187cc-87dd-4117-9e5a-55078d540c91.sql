
-- Allow all authenticated users to insert/update/delete on configuracion_campos_paciente
CREATE POLICY "Authenticated users can manage field config"
  ON public.configuracion_campos_paciente
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Drop the admin-only policy that's blocking
DROP POLICY "Admins can manage field config" ON public.configuracion_campos_paciente;
