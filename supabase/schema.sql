-- ============================================================
-- DermAgent AI — Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  age integer check (age >= 13 and age <= 80),
  gender text check (gender in ('male', 'female', 'non-binary', 'prefer_not_to_say')),
  city text,
  country text,
  skin_type text check (skin_type in ('oily', 'dry', 'combination', 'normal', 'sensitive')),
  concerns text[] default '{}',
  sensitivity_level integer check (sensitivity_level >= 1 and sensitivity_level <= 5),
  water_intake text,
  sleep_hours text,
  sun_exposure text,
  has_routine text,
  allergies text,
  medications text,
  avatar_url text,
  onboarding_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Skin Analyses
create table if not exists public.skin_analyses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  image_url text,
  analysis_json jsonb not null default '{}',
  skin_score integer check (skin_score >= 0 and skin_score <= 100),
  urgent_flag boolean default false,
  created_at timestamptz default now()
);

alter table public.skin_analyses enable row level security;

create policy "Users can view own analyses" on public.skin_analyses
  for select using (auth.uid() = user_id);
create policy "Users can insert own analyses" on public.skin_analyses
  for insert with check (auth.uid() = user_id);

-- 3. Routines
create table if not exists public.routines (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text check (type in ('morning', 'evening')) not null,
  steps_json jsonb not null default '[]',
  weather_context_json jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.routines enable row level security;

create policy "Users can view own routines" on public.routines
  for select using (auth.uid() = user_id);
create policy "Users can insert own routines" on public.routines
  for insert with check (auth.uid() = user_id);

-- 4. Journal Entries
create table if not exists public.journal_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  notes text,
  mood text check (mood in ('great', 'good', 'okay', 'bad', 'terrible')),
  skin_score integer check (skin_score >= 0 and skin_score <= 100),
  created_at timestamptz default now()
);

alter table public.journal_entries enable row level security;

create policy "Users can view own journal" on public.journal_entries
  for select using (auth.uid() = user_id);
create policy "Users can insert own journal" on public.journal_entries
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own journal" on public.journal_entries
  for delete using (auth.uid() = user_id);

-- 5. Product Recommendations
create table if not exists public.product_recommendations (
  id uuid default gen_random_uuid() primary key,
  analysis_id uuid references public.skin_analyses on delete cascade,
  name text not null,
  brand text,
  category text,
  affiliate_url text,
  match_score integer check (match_score >= 0 and match_score <= 100),
  created_at timestamptz default now()
);

alter table public.product_recommendations enable row level security;

create policy "Users can view own product recs" on public.product_recommendations
  for select using (
    exists (
      select 1 from public.skin_analyses sa
      where sa.id = analysis_id and sa.user_id = auth.uid()
    )
  );
create policy "Service can insert product recs" on public.product_recommendations
  for insert with check (true);

-- 6. Virtual Shelf Products
create table if not exists public.shelf_products (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  brand text,
  category text,
  opened_date date,
  expiry_date date,
  pao_months integer check (pao_months >= 1 and pao_months <= 60),
  notes text,
  created_at timestamptz default now()
);

alter table public.shelf_products enable row level security;

create policy "Users can view own shelf products" on public.shelf_products
  for select using (auth.uid() = user_id);
create policy "Users can insert own shelf products" on public.shelf_products
  for insert with check (auth.uid() = user_id);
create policy "Users can update own shelf products" on public.shelf_products
  for update using (auth.uid() = user_id);
create policy "Users can delete own shelf products" on public.shelf_products
  for delete using (auth.uid() = user_id);

-- ============================================================
-- MIGRATION: If tables already exist, run these ALTER statements
-- ============================================================
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sensitivity_level integer;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS water_intake text;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sleep_hours text;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sun_exposure text;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_routine text;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allergies text;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS medications text;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_complete boolean default false;
-- ALTER TABLE public.skin_analyses ADD COLUMN IF NOT EXISTS urgent_flag boolean default false;
