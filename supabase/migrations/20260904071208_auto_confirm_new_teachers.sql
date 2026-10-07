/*
# Auto-confirm new teacher signups

1. Purpose
- Supabase may have email confirmation enabled by default. In this deployment emails are not deliverable, so new teachers can never confirm and sign in.
- This trigger sets email_confirmed_at immediately on insert so every new signup is instantly usable.

2. Security
- The function runs as SECURITY DEFINER so it can write to auth.users.
- It only fires BEFORE INSERT, setting the confirmation timestamp. No other fields are touched.
*/

CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_new_user();
