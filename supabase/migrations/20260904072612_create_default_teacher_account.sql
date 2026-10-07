/*
# Create default teacher account

1. Purpose
- Create a ready-to-use teacher account so the platform owner can log in immediately.
- Email: teacher@math-platform.edu / Password: Math@2026

2. Security
- Seeded default account. Owner can change password later from Supabase dashboard.
- Auto-confirm trigger sets email_confirmed_at automatically.

3. Important Notes
- Only insert if no user with this email exists yet (guarded by NOT EXISTS).
- Password hash uses crypt() with bf (blowfish) compatible with Supabase auth.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'teacher@math-platform.edu') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_sso_user,
      email_change_confirm_status
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'teacher@math-platform.edu',
      crypt('Math@2026', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{}'::jsonb,
      '{}'::jsonb,
      false,
      0
    );
  END IF;
END $$;
