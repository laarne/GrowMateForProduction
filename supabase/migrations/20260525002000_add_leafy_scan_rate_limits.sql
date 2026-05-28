create table if not exists public.leafy_scan_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  scanned_at timestamptz not null default now()
);

create index if not exists leafy_scan_events_user_scanned_at_idx
on public.leafy_scan_events (user_id, scanned_at desc);

alter table public.leafy_scan_events enable row level security;

create policy "users read own leafy scan events"
on public.leafy_scan_events for select
using (auth.uid() = user_id);

create policy "users create own leafy scan events"
on public.leafy_scan_events for insert
with check (auth.uid() = user_id);
