-- Drop old cases policies that used Arabic role names
DROP POLICY IF EXISTS "Cases viewable by Legal and Admins" ON public.cases;
DROP POLICY IF EXISTS "Cases modifiable by Legal and Admins" ON public.cases;

-- Create new cases policies using English role names
CREATE POLICY "Cases viewable by Legal and Admins" ON public.cases FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin'))
);

CREATE POLICY "Cases modifiable by Legal and Admins" ON public.cases FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin'))
);
