create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  is_scored boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  prompt text not null,
  type text not null check (type in ('single','multiple')),
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  label text not null,
  is_correct boolean not null default false,
  position int not null default 0
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  taker_id uuid references auth.users(id) on delete set null,
  score int,
  max_score int,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  selected_option_ids uuid[] not null default '{}'
);

alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_options enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;

create policy "quiz owner manage quizzes" on public.quizzes
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owner manage questions" on public.quiz_questions
  for all using (auth.uid() = (select owner_id from public.quizzes q where q.id = quiz_id))
  with check (auth.uid() = (select owner_id from public.quizzes q where q.id = quiz_id));

create policy "owner manage options" on public.quiz_options
  for all using (auth.uid() = (select owner_id from public.quizzes q join public.quiz_questions qq on qq.quiz_id = q.id where qq.id = question_id))
  with check (auth.uid() = (select owner_id from public.quizzes q join public.quiz_questions qq on qq.quiz_id = q.id where qq.id = question_id));

create policy "public can read quizzes" on public.quizzes for select using (true);
create policy "public can read questions" on public.quiz_questions for select using (true);
create policy "public can read options" on public.quiz_options for select using (true);

create policy "anyone can insert attempts" on public.quiz_attempts for insert with check (true);
create policy "anyone can insert answers" on public.quiz_answers for insert with check (true);

create policy "owner or taker can read attempts" on public.quiz_attempts
  for select using (auth.uid() = (select owner_id from public.quizzes q where q.id = quiz_id) or auth.uid() = taker_id);

create policy "owner or taker can read answers" on public.quiz_answers
  for select using (
    auth.uid() = (select owner_id from public.quizzes q join public.quiz_attempts qa on qa.quiz_id = q.id where qa.id = attempt_id)
    or auth.uid() = (select taker_id from public.quiz_attempts qa where qa.id = attempt_id)
  );
