DROP POLICY IF EXISTS "Settings modifiable by Admins" ON public.settings;
DROP POLICY IF EXISTS "Settings modifiable by Super Admins" ON public.settings;
CREATE POLICY "Settings modifiable by Super Admins" ON public.settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', '???? ??????'))
);
