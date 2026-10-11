-- =====================================================================
--  MedAI Academy — database schema (step 1 of 3)
--  Paste this into Supabase → SQL Editor → New query → Run.
--  Then run 0002_security.sql and 0003_storage.sql in the same way.
-- =====================================================================

-- ---------------------------------------------------------------------
-- PROFILES: one row per user (created automatically on sign-up)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text not null,
  full_name    text not null default '',
  profession   text,
  organization text,
  role         text not null default 'user' check (role in ('user', 'admin')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.profiles is 'Public profile for each user. role = admin gives access to the admin panel.';

-- ---------------------------------------------------------------------
-- ENROLMENTS: which user has (or is waiting for) access to which course
-- Courses themselves live in the code (/content/courses), identified by slug.
-- ---------------------------------------------------------------------
create table if not exists public.enrollments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  course_slug text not null,
  status      text not null default 'pending' check (status in ('pending', 'active', 'rejected')),
  source      text not null default 'payment' check (source in ('payment', 'free', 'admin')),
  created_at  timestamptz not null default now(),
  approved_at timestamptz,
  unique (user_id, course_slug)
);
create index if not exists enrollments_status_idx on public.enrollments (status);

-- ---------------------------------------------------------------------
-- PAYMENTS: each payment submission (manual now, online gateways later)
-- ---------------------------------------------------------------------
create table if not exists public.payments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  enrollment_id   uuid references public.enrollments (id) on delete set null,
  course_slug     text not null,
  provider        text not null default 'manual',        -- e.g. 'manual', later 'stripe', 'payfast'…
  method          text not null,                         -- e.g. 'bank_transfer', 'jazzcash', 'easypaisa'
  amount_pkr      integer not null check (amount_pkr >= 0),
  transaction_id  text not null,
  payer_name      text,
  screenshot_path text,                                  -- path inside the 'payment-proofs' storage bucket
  status          text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note      text,
  reviewed_by     uuid references public.profiles (id) on delete set null,
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists payments_status_idx on public.payments (status);
create index if not exists payments_user_idx on public.payments (user_id);

-- ---------------------------------------------------------------------
-- LESSON PROGRESS: one row per completed lesson
-- ---------------------------------------------------------------------
create table if not exists public.lesson_progress (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  course_slug  text not null,
  lesson_slug  text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, course_slug, lesson_slug)
);

-- Remembers the last lesson opened, for "continue where you left off"
create table if not exists public.course_activity (
  user_id          uuid not null references public.profiles (id) on delete cascade,
  course_slug      text not null,
  last_lesson_slug text not null,
  updated_at       timestamptz not null default now(),
  primary key (user_id, course_slug)
);

-- ---------------------------------------------------------------------
-- CERTIFICATES
-- ---------------------------------------------------------------------
create table if not exists public.certificates (
  id                uuid primary key default gen_random_uuid(),
  verification_code text not null unique,   -- e.g. MAI-7K3P-QX92-LM4D
  user_id           uuid not null references public.profiles (id) on delete cascade,
  course_slug       text not null,
  recipient_name    text not null,
  course_title      text not null,
  issued_at         timestamptz not null default now(),
  unique (user_id, course_slug)
);

-- ---------------------------------------------------------------------
-- PUBLIC FORMS (saved by the server; visible to admins only)
-- ---------------------------------------------------------------------
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text not null,
  message    text not null,
  handled    boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  source     text,
  created_at timestamptz not null default now()
);

create table if not exists public.institution_enquiries (
  id           uuid primary key default gen_random_uuid(),
  organization text not null,
  contact_name text not null,
  email        text not null,
  phone        text,
  role         text,
  staff_count  text,
  message      text not null,
  handled      boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- AUTOMATIC PROFILE CREATION when someone signs up
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, profession)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'profession'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.email in sync if a user changes their email address
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- Keep profiles.updated_at current
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();
