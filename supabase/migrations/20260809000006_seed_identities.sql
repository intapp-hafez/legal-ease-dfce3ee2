DO $$
DECLARE
  super_admin_id uuid := '00000000-0000-0000-0000-000000000001';
  admin_id uuid := '00000000-0000-0000-0000-000000000002';
  employee_id uuid := '00000000-0000-0000-0000-000000000003';
BEGIN
  -- Super Admin
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = super_admin_id) THEN
    INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      super_admin_id::text,
      super_admin_id, 
      format('{"sub":"%s","email":"superadmin@int.local"}', super_admin_id)::jsonb, 
      'email', 
      now(), now(), now()
    );
  END IF;

  -- Admin
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = admin_id) THEN
    INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      admin_id::text,
      admin_id, 
      format('{"sub":"%s","email":"admin@int.local"}', admin_id)::jsonb, 
      'email', 
      now(), now(), now()
    );
  END IF;

  -- Employee
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = employee_id) THEN
    INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      employee_id::text,
      employee_id, 
      format('{"sub":"%s","email":"employee@int.local"}', employee_id)::jsonb, 
      'email', 
      now(), now(), now()
    );
  END IF;
END $$;
