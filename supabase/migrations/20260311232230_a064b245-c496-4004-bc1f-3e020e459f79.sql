CREATE POLICY "Authenticated users can view all profile names"
ON public.profiles FOR SELECT
TO authenticated
USING (true);