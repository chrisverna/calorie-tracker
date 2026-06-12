create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

revoke all on table public.user_data from anon;
grant select, insert, update on table public.user_data to authenticated;

create policy "Users can read their own nutrition data"
on public.user_data
for select
using (auth.uid() = user_id);

create policy "Users can insert their own nutrition data"
on public.user_data
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own nutrition data"
on public.user_data
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
