-- Better Me — initial schema. Owner-only RLS on every table; signup trigger
-- creates the profile and seeds the five launch habits.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Majedul',
  xp int not null default 0,
  shields int not null default 0,
  created_at timestamptz not null default now()
);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  evidence_type text not null check (evidence_type in ('note','count')),
  target_count int,
  active boolean not null default true,
  sort int not null default 0,
  unique (user_id, slug)
);

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  local_id text not null,
  date date not null,
  note text,
  count int,
  base_xp int not null default 0,
  bonus_xp int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, habit_id, date),
  unique (user_id, local_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  title text not null,
  due_date date,
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, local_id)
);

create table public.money_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('retainer','subscription')),
  name text not null,
  amount numeric,
  currency text not null default 'BDT',
  cycle text not null default 'monthly' check (cycle in ('monthly','yearly')),
  next_due date,
  remind_days_before int not null default 2,
  message_template text,
  whatsapp text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.prospects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  source text,
  note text,
  stage text not null default 'lead' check (stage in ('lead','contacted','in_talks','won','lost')),
  deal_value numeric,
  proposal_status text not null default 'none' check (proposal_status in ('none','draft','sent','won','lost')),
  next_touch date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  review_md text not null,
  bonus_xp int not null default 0,
  stats jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  keys jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.checkins enable row level security;
alter table public.tasks enable row level security;
alter table public.money_items enable row level security;
alter table public.prospects enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own habits" on public.habits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own checkins" on public.checkins for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own tasks" on public.tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own money" on public.money_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own prospects" on public.prospects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own reviews" on public.weekly_reviews for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own push" on public.push_subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id) values (new.id);
  insert into habits (user_id, name, slug, evidence_type, target_count, sort) values
    (new.id, 'Exercise', 'exercise', 'note', null, 1),
    (new.id, 'Guitar',   'guitar',   'note', null, 2),
    (new.id, 'Prayer',   'prayer',   'count', 5,  3),
    (new.id, 'Reading',  'reading',  'note', null, 4),
    (new.id, 'Writing',  'writing',  'note', null, 5);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
