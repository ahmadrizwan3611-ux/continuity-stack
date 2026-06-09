-- Continuity Stack v1.6 Supabase Schema
-- Safe to run in Supabase SQL Editor. It creates/updates tables without deleting data.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  full_name text,
  birth_year int,
  age int,
  address text,
  city text,
  country text,
  current_position text,
  profession text,
  phone_model text,
  phone_health_status text,
  phone_battery_percent int,
  food_taste text,
  social_status text,
  financial_status text,
  behavior_notes text,
  language_preference text default 'English',
  communication_style text,
  life_summary text,
  personality_notes text,
  tone_preference text default 'direct',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists birth_year int;
alter table public.profiles add column if not exists age int;
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists country text;
alter table public.profiles add column if not exists current_position text;
alter table public.profiles add column if not exists profession text;
alter table public.profiles add column if not exists phone_model text;
alter table public.profiles add column if not exists phone_health_status text;
alter table public.profiles add column if not exists phone_battery_percent int;
alter table public.profiles add column if not exists food_taste text;
alter table public.profiles add column if not exists social_status text;
alter table public.profiles add column if not exists financial_status text;
alter table public.profiles add column if not exists behavior_notes text;
alter table public.profiles add column if not exists language_preference text default 'English';
alter table public.profiles add column if not exists communication_style text;
alter table public.profiles add column if not exists life_summary text;
alter table public.profiles add column if not exists personality_notes text;
alter table public.profiles add column if not exists tone_preference text default 'direct';
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

-- MEMORIES
create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  content text,
  memory_type text default 'life',
  memory_format text default 'written',
  mood text default 'neutral',
  event_date date,
  tags text[] default '{}',
  importance int default 3,
  privacy_level text default 'private',
  hidden_from_ai boolean default false,
  media_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.memories add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.memories add column if not exists title text;
alter table public.memories add column if not exists content text;
alter table public.memories add column if not exists memory_type text default 'life';
alter table public.memories add column if not exists memory_format text default 'written';
alter table public.memories add column if not exists mood text default 'neutral';
alter table public.memories add column if not exists event_date date;
alter table public.memories add column if not exists tags text[] default '{}';
alter table public.memories add column if not exists importance int default 3;
alter table public.memories add column if not exists privacy_level text default 'private';
alter table public.memories add column if not exists hidden_from_ai boolean default false;
alter table public.memories add column if not exists media_url text;
alter table public.memories add column if not exists created_at timestamptz default now();
alter table public.memories add column if not exists updated_at timestamptz default now();

-- RELATIONSHIP MAP
create table if not exists public.relationships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text,
  relation_type text default 'friend',
  phone text,
  notes text,
  closeness int default 3,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.relationships add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.relationships add column if not exists name text;
alter table public.relationships add column if not exists relation_type text default 'friend';
alter table public.relationships add column if not exists phone text;
alter table public.relationships add column if not exists notes text;
alter table public.relationships add column if not exists closeness int default 3;
alter table public.relationships add column if not exists created_at timestamptz default now();
alter table public.relationships add column if not exists updated_at timestamptz default now();

-- PERSONAL FACTS
create table if not exists public.personal_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  category text default 'Personal',
  key text,
  value text,
  confidence int default 3,
  source text default 'manual',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.personal_facts add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.personal_facts add column if not exists category text default 'Personal';
alter table public.personal_facts add column if not exists key text;
alter table public.personal_facts add column if not exists value text;
alter table public.personal_facts add column if not exists confidence int default 3;
alter table public.personal_facts add column if not exists source text default 'manual';
alter table public.personal_facts add column if not exists created_at timestamptz default now();
alter table public.personal_facts add column if not exists updated_at timestamptz default now();

-- CHAT HISTORY
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text default 'New chat',
  summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.chat_sessions add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.chat_sessions add column if not exists title text default 'New chat';
alter table public.chat_sessions add column if not exists summary text;
alter table public.chat_sessions add column if not exists created_at timestamptz default now();
alter table public.chat_sessions add column if not exists updated_at timestamptz default now();

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_id uuid references public.chat_sessions(id) on delete cascade,
  role text,
  content text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.chat_messages add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.chat_messages add column if not exists session_id uuid references public.chat_sessions(id) on delete cascade;
alter table public.chat_messages add column if not exists role text;
alter table public.chat_messages add column if not exists content text;
alter table public.chat_messages add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.chat_messages add column if not exists created_at timestamptz default now();

-- AI QUESTIONS
create table if not exists public.ai_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  question text,
  category text default 'Personal',
  answer text,
  status text default 'open',
  created_at timestamptz default now(),
  answered_at timestamptz
);

alter table public.ai_questions add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.ai_questions add column if not exists question text;
alter table public.ai_questions add column if not exists category text default 'Personal';
alter table public.ai_questions add column if not exists answer text;
alter table public.ai_questions add column if not exists status text default 'open';
alter table public.ai_questions add column if not exists created_at timestamptz default now();
alter table public.ai_questions add column if not exists answered_at timestamptz;

-- PERSONALITY / IDENTITY GRAPH INSIGHTS
create table if not exists public.personality_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  insight_type text default 'behavior_pattern',
  title text,
  content text,
  confidence int default 3,
  source text default 'manual',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.personality_insights add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.personality_insights add column if not exists insight_type text default 'behavior_pattern';
alter table public.personality_insights add column if not exists title text;
alter table public.personality_insights add column if not exists content text;
alter table public.personality_insights add column if not exists confidence int default 3;
alter table public.personality_insights add column if not exists source text default 'manual';
alter table public.personality_insights add column if not exists created_at timestamptz default now();
alter table public.personality_insights add column if not exists updated_at timestamptz default now();


-- v1.6 SMART MEMORY QUALITY COLUMNS
alter table public.personal_facts add column if not exists needs_confirmation boolean default false;
alter table public.personal_facts add column if not exists is_sensitive boolean default false;
alter table public.personal_facts add column if not exists evidence text;
alter table public.personal_facts add column if not exists source_message_id uuid references public.chat_messages(id) on delete set null;
alter table public.personal_facts add column if not exists last_seen_at timestamptz default now();

alter table public.relationships add column if not exists confidence int default 3;
alter table public.relationships add column if not exists needs_confirmation boolean default false;
alter table public.relationships add column if not exists emotional_tone text default 'unknown';
alter table public.relationships add column if not exists evidence text;
alter table public.relationships add column if not exists last_mentioned_at timestamptz default now();

alter table public.memories add column if not exists confidence int default 3;
alter table public.memories add column if not exists evidence text;
alter table public.memories add column if not exists source_message_id uuid references public.chat_messages(id) on delete set null;

alter table public.personality_insights add column if not exists evidence text;
alter table public.personality_insights add column if not exists last_seen_at timestamptz default now();

create table if not exists public.identity_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  summary_text text,
  strengths jsonb default '[]'::jsonb,
  growth_areas jsonb default '[]'::jsonb,
  communication_rules jsonb default '[]'::jsonb,
  caution_rules jsonb default '[]'::jsonb,
  next_questions jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.identity_summaries add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.identity_summaries add column if not exists summary_text text;
alter table public.identity_summaries add column if not exists strengths jsonb default '[]'::jsonb;
alter table public.identity_summaries add column if not exists growth_areas jsonb default '[]'::jsonb;
alter table public.identity_summaries add column if not exists communication_rules jsonb default '[]'::jsonb;
alter table public.identity_summaries add column if not exists caution_rules jsonb default '[]'::jsonb;
alter table public.identity_summaries add column if not exists next_questions jsonb default '[]'::jsonb;
alter table public.identity_summaries add column if not exists created_at timestamptz default now();
alter table public.identity_summaries add column if not exists updated_at timestamptz default now();


-- CHECK CONSTRAINTS
alter table public.profiles drop constraint if exists profiles_phone_battery_check;
alter table public.profiles add constraint profiles_phone_battery_check check (phone_battery_percent is null or (phone_battery_percent >= 0 and phone_battery_percent <= 100));

alter table public.memories drop constraint if exists memories_importance_check;
alter table public.memories add constraint memories_importance_check check (importance is null or (importance >= 1 and importance <= 5));

alter table public.relationships drop constraint if exists relationships_closeness_check;
alter table public.relationships add constraint relationships_closeness_check check (closeness is null or (closeness >= 1 and closeness <= 5));

alter table public.personal_facts drop constraint if exists personal_facts_confidence_check;
alter table public.personal_facts add constraint personal_facts_confidence_check check (confidence is null or (confidence >= 1 and confidence <= 5));

alter table public.chat_messages drop constraint if exists chat_messages_role_check;
alter table public.chat_messages add constraint chat_messages_role_check check (role in ('user', 'assistant', 'system'));

alter table public.personality_insights drop constraint if exists personality_insights_confidence_check;
alter table public.personality_insights add constraint personality_insights_confidence_check check (confidence is null or (confidence >= 1 and confidence <= 5));


alter table public.memories drop constraint if exists memories_confidence_check;
alter table public.memories add constraint memories_confidence_check check (confidence is null or (confidence >= 1 and confidence <= 5));

alter table public.relationships drop constraint if exists relationships_confidence_check;
alter table public.relationships add constraint relationships_confidence_check check (confidence is null or (confidence >= 1 and confidence <= 5));

-- INDEXES
create unique index if not exists profiles_user_id_unique on public.profiles(user_id);
create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists memories_user_id_idx on public.memories(user_id);
create index if not exists memories_event_date_idx on public.memories(event_date);
create index if not exists memories_created_at_idx on public.memories(created_at);
create index if not exists relationships_user_id_idx on public.relationships(user_id);
create unique index if not exists relationships_user_name_unique on public.relationships(user_id, name);
create index if not exists facts_user_id_idx on public.personal_facts(user_id);
create unique index if not exists personal_facts_user_key_unique on public.personal_facts(user_id, key);
create index if not exists chat_sessions_user_id_idx on public.chat_sessions(user_id);
create index if not exists chat_sessions_updated_at_idx on public.chat_sessions(updated_at);
create index if not exists chat_messages_user_id_idx on public.chat_messages(user_id);
create index if not exists chat_messages_session_id_idx on public.chat_messages(session_id);
create index if not exists chat_messages_created_at_idx on public.chat_messages(created_at);
create index if not exists ai_questions_user_id_idx on public.ai_questions(user_id);
create index if not exists personality_insights_user_id_idx on public.personality_insights(user_id);
create unique index if not exists personality_insights_unique on public.personality_insights(user_id, insight_type, title);


create unique index if not exists identity_summaries_user_id_unique on public.identity_summaries(user_id);
create index if not exists identity_summaries_user_id_idx on public.identity_summaries(user_id);
create index if not exists facts_needs_confirmation_idx on public.personal_facts(user_id, needs_confirmation);
create index if not exists relationships_needs_confirmation_idx on public.relationships(user_id, needs_confirmation);

-- UPDATED_AT TRIGGERS
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists memories_set_updated_at on public.memories;
create trigger memories_set_updated_at before update on public.memories for each row execute function public.set_updated_at();

drop trigger if exists relationships_set_updated_at on public.relationships;
create trigger relationships_set_updated_at before update on public.relationships for each row execute function public.set_updated_at();

drop trigger if exists facts_set_updated_at on public.personal_facts;
create trigger facts_set_updated_at before update on public.personal_facts for each row execute function public.set_updated_at();

drop trigger if exists chat_sessions_set_updated_at on public.chat_sessions;
create trigger chat_sessions_set_updated_at before update on public.chat_sessions for each row execute function public.set_updated_at();

drop trigger if exists personality_insights_set_updated_at on public.personality_insights;
create trigger personality_insights_set_updated_at before update on public.personality_insights for each row execute function public.set_updated_at();


drop trigger if exists identity_summaries_set_updated_at on public.identity_summaries;
create trigger identity_summaries_set_updated_at before update on public.identity_summaries for each row execute function public.set_updated_at();

-- ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.memories enable row level security;
alter table public.relationships enable row level security;
alter table public.personal_facts enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.ai_questions enable row level security;
alter table public.personality_insights enable row level security;
alter table public.identity_summaries enable row level security;

-- POLICIES
-- Profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = user_id);

-- Memories
drop policy if exists "memories_select_own" on public.memories;
create policy "memories_select_own" on public.memories for select using (auth.uid() = user_id);
drop policy if exists "memories_insert_own" on public.memories;
create policy "memories_insert_own" on public.memories for insert with check (auth.uid() = user_id);
drop policy if exists "memories_update_own" on public.memories;
create policy "memories_update_own" on public.memories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "memories_delete_own" on public.memories;
create policy "memories_delete_own" on public.memories for delete using (auth.uid() = user_id);

-- Relationships
drop policy if exists "relationships_select_own" on public.relationships;
create policy "relationships_select_own" on public.relationships for select using (auth.uid() = user_id);
drop policy if exists "relationships_insert_own" on public.relationships;
create policy "relationships_insert_own" on public.relationships for insert with check (auth.uid() = user_id);
drop policy if exists "relationships_update_own" on public.relationships;
create policy "relationships_update_own" on public.relationships for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "relationships_delete_own" on public.relationships;
create policy "relationships_delete_own" on public.relationships for delete using (auth.uid() = user_id);

-- Facts
drop policy if exists "facts_select_own" on public.personal_facts;
create policy "facts_select_own" on public.personal_facts for select using (auth.uid() = user_id);
drop policy if exists "facts_insert_own" on public.personal_facts;
create policy "facts_insert_own" on public.personal_facts for insert with check (auth.uid() = user_id);
drop policy if exists "facts_update_own" on public.personal_facts;
create policy "facts_update_own" on public.personal_facts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "facts_delete_own" on public.personal_facts;
create policy "facts_delete_own" on public.personal_facts for delete using (auth.uid() = user_id);

-- Chat sessions
drop policy if exists "chat_sessions_select_own" on public.chat_sessions;
create policy "chat_sessions_select_own" on public.chat_sessions for select using (auth.uid() = user_id);
drop policy if exists "chat_sessions_insert_own" on public.chat_sessions;
create policy "chat_sessions_insert_own" on public.chat_sessions for insert with check (auth.uid() = user_id);
drop policy if exists "chat_sessions_update_own" on public.chat_sessions;
create policy "chat_sessions_update_own" on public.chat_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "chat_sessions_delete_own" on public.chat_sessions;
create policy "chat_sessions_delete_own" on public.chat_sessions for delete using (auth.uid() = user_id);

-- Chat messages
drop policy if exists "chat_messages_select_own" on public.chat_messages;
create policy "chat_messages_select_own" on public.chat_messages for select using (auth.uid() = user_id);
drop policy if exists "chat_messages_insert_own" on public.chat_messages;
create policy "chat_messages_insert_own" on public.chat_messages for insert with check (auth.uid() = user_id);
drop policy if exists "chat_messages_delete_own" on public.chat_messages;
create policy "chat_messages_delete_own" on public.chat_messages for delete using (auth.uid() = user_id);

-- AI questions
drop policy if exists "ai_questions_select_own" on public.ai_questions;
create policy "ai_questions_select_own" on public.ai_questions for select using (auth.uid() = user_id);
drop policy if exists "ai_questions_insert_own" on public.ai_questions;
create policy "ai_questions_insert_own" on public.ai_questions for insert with check (auth.uid() = user_id);
drop policy if exists "ai_questions_update_own" on public.ai_questions;
create policy "ai_questions_update_own" on public.ai_questions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "ai_questions_delete_own" on public.ai_questions;
create policy "ai_questions_delete_own" on public.ai_questions for delete using (auth.uid() = user_id);

-- Personality insights
drop policy if exists "personality_insights_select_own" on public.personality_insights;
create policy "personality_insights_select_own" on public.personality_insights for select using (auth.uid() = user_id);
drop policy if exists "personality_insights_insert_own" on public.personality_insights;
create policy "personality_insights_insert_own" on public.personality_insights for insert with check (auth.uid() = user_id);
drop policy if exists "personality_insights_update_own" on public.personality_insights;
create policy "personality_insights_update_own" on public.personality_insights for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "personality_insights_delete_own" on public.personality_insights;
create policy "personality_insights_delete_own" on public.personality_insights for delete using (auth.uid() = user_id);


-- Identity summaries
drop policy if exists "identity_summaries_select_own" on public.identity_summaries;
create policy "identity_summaries_select_own" on public.identity_summaries for select using (auth.uid() = user_id);
drop policy if exists "identity_summaries_insert_own" on public.identity_summaries;
create policy "identity_summaries_insert_own" on public.identity_summaries for insert with check (auth.uid() = user_id);
drop policy if exists "identity_summaries_update_own" on public.identity_summaries;
create policy "identity_summaries_update_own" on public.identity_summaries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "identity_summaries_delete_own" on public.identity_summaries;
create policy "identity_summaries_delete_own" on public.identity_summaries for delete using (auth.uid() = user_id);
