-- Extend profiles with user preferences metadata
alter table public.profiles
  add column if not exists preferences jsonb default '{}'::jsonb;

update public.profiles set preferences = coalesce(preferences, '{}'::jsonb);

-- User settings table for notification toggles and onboarding answers
create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  email_updates boolean not null default true,
  push_notifications boolean not null default true,
  safe_mode boolean not null default false,
  commitment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "user_settings_owner_read"
  on public.user_settings
  for select
  using (auth.uid() = user_id);

create policy "user_settings_owner_write"
  on public.user_settings
  for insert
  with check (auth.uid() = user_id);

create policy "user_settings_owner_update"
  on public.user_settings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Notifications table so the web client can acknowledge alerts
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  kind text not null default 'system',
  title text not null,
  body text not null,
  action_url text,
  read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications_owner_read"
  on public.notifications
  for select
  using (auth.uid() = user_id);

create policy "notifications_owner_update"
  on public.notifications
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notifications_owner_insert"
  on public.notifications
  for insert
  with check (auth.uid() = user_id);

-- Chat threads and messages support
create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(user_id) on delete cascade,
  user_b uuid not null references public.profiles(user_id) on delete cascade,
  match_id uuid references public.matches(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chat_threads_unique unique (least(user_a, user_b), greatest(user_a, user_b))
);

alter table public.chat_threads enable row level security;

create policy "chat_threads_select"
  on public.chat_threads
  for select
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy "chat_threads_insert"
  on public.chat_threads
  for insert
  with check (auth.uid() = user_a or auth.uid() = user_b);

create policy "chat_threads_update"
  on public.chat_threads
  for update
  using (auth.uid() = user_a or auth.uid() = user_b)
  with check (auth.uid() = user_a or auth.uid() = user_b);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(user_id) on delete cascade,
  body text not null,
  sent_at timestamptz not null default now(),
  seen_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

create index if not exists idx_chat_messages_thread_id on public.chat_messages(thread_id, sent_at desc);

create policy "chat_messages_select"
  on public.chat_messages
  for select
  using (
    exists (
      select 1 from public.chat_threads ct
      where ct.id = chat_messages.thread_id
        and (ct.user_a = auth.uid() or ct.user_b = auth.uid())
    )
  );

create policy "chat_messages_insert"
  on public.chat_messages
  for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.chat_threads ct
      where ct.id = chat_messages.thread_id
        and (ct.user_a = auth.uid() or ct.user_b = auth.uid())
    )
  );

create policy "chat_messages_update_seen"
  on public.chat_messages
  for update
  using (
    exists (
      select 1 from public.chat_threads ct
      where ct.id = chat_messages.thread_id
        and (ct.user_a = auth.uid() or ct.user_b = auth.uid())
    )
  )
  with check (true);

create or replace function public.chat_touch_thread()
returns trigger
language plpgsql
as $$
begin
  update public.chat_threads
     set updated_at = now()
   where id = new.thread_id;
  return new;
end;
$$;

create trigger chat_messages_touch_thread
  after insert on public.chat_messages
  for each row
  execute procedure public.chat_touch_thread();
