/*
# Create teacher invite code table

1. New Tables
- `teacher_settings`: single-row table storing the current teacher invite code.
- `id`: fixed row identifier (always 1).
- `invite_code`: the secret code required to create a teacher account.
- `updated_at`: last change timestamp.

2. Security
- Row level security is enabled.
- Anyone (anon + authenticated) can read the invite_code column — this is required so the signup form can validate the code client-side before calling Supabase Auth. The code is a gate against casual signup, not a high-security secret.
- Only authenticated users (teachers) can update the invite code.

3. Important Notes
- A seed row is inserted with the default invite code 'RC-MATH-2026'.
- Teachers can change the code from the dashboard settings.
*/

CREATE TABLE IF NOT EXISTS public.teacher_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  invite_code text NOT NULL DEFAULT 'RC-MATH-2026',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teacher_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.teacher_settings (id, invite_code)
VALUES (1, 'RC-MATH-2026')
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can read invite code" ON public.teacher_settings;
CREATE POLICY "Anyone can read invite code"
  ON public.teacher_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Teachers can update invite code" ON public.teacher_settings;
CREATE POLICY "Teachers can update invite code"
  ON public.teacher_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Teachers can insert settings" ON public.teacher_settings;
CREATE POLICY "Teachers can insert settings"
  ON public.teacher_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);
