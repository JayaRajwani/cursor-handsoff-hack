-- =====================================================================
--  Make yourself an admin
--  1. Sign up on your website first.
--  2. Replace the email below with YOUR email address.
--  3. Paste into Supabase → SQL Editor and click Run.
-- =====================================================================
update public.profiles
set role = 'admin'
where email = 'you@example.com';

-- Check it worked (you should see role = admin):
select id, email, full_name, role from public.profiles where role = 'admin';
