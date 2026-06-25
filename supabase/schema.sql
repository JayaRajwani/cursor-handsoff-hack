create extension if not exists "pgcrypto";

create table if not exists public.hackos_runs (
  id uuid primary key default gen_random_uuid(),
  goal text not null,
  organizer_output jsonb not null,
  sponsorship_output jsonb not null,
  agent_sources jsonb not null,
  agent_errors jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists hackos_runs_created_at_idx
  on public.hackos_runs (created_at desc);

alter table public.hackos_runs enable row level security;

create policy "Service role can manage HackOS runs"
  on public.hackos_runs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
