-- =====================================================================
--  MedAI Academy — Row Level Security (step 2 of 3)
--  Users can only see their own data; admins can see everything.
-- =====================================================================

-- Helper: is the current user an admin?
-- SECURITY DEFINER lets it read profiles without triggering RLS recursion.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Helper: does the current user have active access to a course?
create or replace function public.has_course_access(p_course_slug text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.enrollments
    where user_id = (select auth.uid()) and course_slug = p_course_slug and status = 'active'
  );
$$;

-- Public certificate check: returns one certificate by its code (no listing possible)
create or replace function public.verify_certificate(p_code text)
returns table (verification_code text, recipient_name text, course_title text, course_slug text, issued_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select c.verification_code, c.recipient_name, c.course_title, c.course_slug, c.issued_at
  from public.certificates c
  where c.verification_code = upper(trim(p_code))
  limit 1;
$$;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.has_course_access(text) to authenticated;
grant execute on function public.verify_certificate(text) to anon, authenticated;

-- Turn on RLS for every table
alter table public.profiles               enable row level security;
alter table public.enrollments            enable row level security;
alter table public.payments               enable row level security;
alter table public.lesson_progress        enable row level security;
alter table public.course_activity        enable row level security;
alter table public.certificates           enable row level security;
alter table public.contact_messages       enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.institution_enquiries  enable row level security;

-- ---------------- profiles ----------------
drop policy if exists "profiles: read own or admin" on public.profiles;
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Users may only change these columns (NOT role or email).
revoke update on public.profiles from anon, authenticated;
grant update (full_name, profession, organization) on public.profiles to authenticated;

-- ---------------- enrollments ----------------
drop policy if exists "enrollments: read own or admin" on public.enrollments;
create policy "enrollments: read own or admin" on public.enrollments
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- Learners can only create PENDING enrolments for themselves.
drop policy if exists "enrollments: create own pending" on public.enrollments;
create policy "enrollments: create own pending" on public.enrollments
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending' and source = 'payment');

-- Learners can re-submit a REJECTED enrolment (back to pending), nothing else.
drop policy if exists "enrollments: resubmit own rejected" on public.enrollments;
create policy "enrollments: resubmit own rejected" on public.enrollments
  for update to authenticated
  using (user_id = (select auth.uid()) and status = 'rejected')
  with check (user_id = (select auth.uid()) and status = 'pending' and source = 'payment');

drop policy if exists "enrollments: admin insert" on public.enrollments;
create policy "enrollments: admin insert" on public.enrollments
  for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "enrollments: admin update" on public.enrollments;
create policy "enrollments: admin update" on public.enrollments
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "enrollments: admin delete" on public.enrollments;
create policy "enrollments: admin delete" on public.enrollments
  for delete to authenticated
  using ((select public.is_admin()));

-- ---------------- payments ----------------
drop policy if exists "payments: read own or admin" on public.payments;
create policy "payments: read own or admin" on public.payments
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "payments: create own pending" on public.payments;
create policy "payments: create own pending" on public.payments
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and (
      enrollment_id is null
      or exists (select 1 from public.enrollments e where e.id = enrollment_id and e.user_id = (select auth.uid()))
    )
  );

drop policy if exists "payments: admin update" on public.payments;
create policy "payments: admin update" on public.payments
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------- lesson_progress ----------------
drop policy if exists "progress: read own or admin" on public.lesson_progress;
create policy "progress: read own or admin" on public.lesson_progress
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- Only for courses the user is actively enrolled in
drop policy if exists "progress: add own" on public.lesson_progress;
create policy "progress: add own" on public.lesson_progress
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.has_course_access(course_slug));

drop policy if exists "progress: remove own" on public.lesson_progress;
create policy "progress: remove own" on public.lesson_progress
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------- course_activity ----------------
drop policy if exists "activity: read own" on public.course_activity;
create policy "activity: read own" on public.course_activity
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "activity: insert own" on public.course_activity;
create policy "activity: insert own" on public.course_activity
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.has_course_access(course_slug));

drop policy if exists "activity: update own" on public.course_activity;
create policy "activity: update own" on public.course_activity
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.has_course_access(course_slug));

-- ---------------- certificates ----------------
-- Read own (or admin). Certificates are ISSUED by the server with the secret key,
-- so there is deliberately no insert policy for users.
drop policy if exists "certificates: read own or admin" on public.certificates;
create policy "certificates: read own or admin" on public.certificates
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- ---------------- admin-only tables ----------------
-- Public forms are saved by the server with the secret key (after spam checks),
-- so the public has no direct access. Admins can read and update them.
drop policy if exists "contact: admin read" on public.contact_messages;
create policy "contact: admin read" on public.contact_messages
  for select to authenticated using ((select public.is_admin()));
drop policy if exists "contact: admin update" on public.contact_messages;
create policy "contact: admin update" on public.contact_messages
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "newsletter: admin read" on public.newsletter_subscribers;
create policy "newsletter: admin read" on public.newsletter_subscribers
  for select to authenticated using ((select public.is_admin()));
drop policy if exists "newsletter: admin delete" on public.newsletter_subscribers;
create policy "newsletter: admin delete" on public.newsletter_subscribers
  for delete to authenticated using ((select public.is_admin()));

drop policy if exists "enquiries: admin read" on public.institution_enquiries;
create policy "enquiries: admin read" on public.institution_enquiries
  for select to authenticated using ((select public.is_admin()));
drop policy if exists "enquiries: admin update" on public.institution_enquiries;
create policy "enquiries: admin update" on public.institution_enquiries
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
