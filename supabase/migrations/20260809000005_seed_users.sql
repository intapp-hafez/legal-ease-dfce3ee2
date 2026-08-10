-- Enable pgcrypto if not enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  super_admin_id uuid := '00000000-0000-0000-0000-000000000001';
  admin_id uuid := '00000000-0000-0000-0000-000000000002';
  employee_id uuid := '00000000-0000-0000-0000-000000000003';
BEGIN
  -- Super Admin
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (super_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'superadmin@int.local', extensions.crypt('1234', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, full_name, employee_code, role)
  VALUES (super_admin_id, 'أ. حافظ رحيم', 'EMP-001', 'super_admin')
  ON CONFLICT (id) DO NOTHING;

  -- Admin
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@int.local', extensions.crypt('1234', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, full_name, employee_code, role)
  VALUES (admin_id, 'م. سارة يوسف', 'EMP-002', 'admin')
  ON CONFLICT (id) DO NOTHING;

  -- Employee
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (employee_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'employee@int.local', extensions.crypt('1234', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, full_name, employee_code, role)
  VALUES (employee_id, 'خالد الشمري', 'EMP-003', 'employee')
  ON CONFLICT (id) DO NOTHING;
END $$;
