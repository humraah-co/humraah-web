-- Humraah schema: content tables, team roles, activity log.
--
-- Content rows move through draft -> published -> archived. The public site
-- (anon role) only ever sees published rows; row-level security enforces it.

create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.content_status as enum ('draft', 'published', 'archived');
create type public.team_role as enum ('researcher', 'admin', 'owner');
create type public.member_status as enum ('invited', 'active', 'suspended');
create type public.university_type as enum ('public', 'private');
create type public.scholarship_scope as enum ('pakistan', 'international');
create type public.scholarship_kind as enum ('merit', 'need', 'government', 'external', 'university');
create type public.resource_category as enum ('official', 'scholarships', 'tests', 'guidance');

-- ---------------------------------------------------------------------------
-- Shared columns helper: every content table carries these
--   status, source_url, last_verified_at, created_by, updated_by,
--   created_at, updated_at
-- ---------------------------------------------------------------------------

-- Fields of study (the 10 areas in the Higher Education Guide)
create table public.fields (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  emoji text,
  summary text,
  you_might_enjoy text,
  example_programmes text[] not null default '{}',
  sort_order int not null default 0,
  status public.content_status not null default 'draft',
  source_url text,
  last_verified_at timestamptz,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  updated_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.universities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  short_name text,
  city text not null,
  campuses_note text,
  province text,
  type public.university_type,
  hec_recognised boolean not null default true,
  women_only boolean not null default false,
  has_hostel boolean,
  website_url text,
  admissions_url text,
  overview text,
  how_to_apply text,
  required_documents text[] not null default '{}',
  fee_min_pkr int check (fee_min_pkr is null or fee_min_pkr >= 0),
  fee_max_pkr int check (fee_max_pkr is null or fee_max_pkr >= fee_min_pkr),
  fee_note text,
  admissions_window text,
  status public.content_status not null default 'draft',
  source_url text,
  last_verified_at timestamptz,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  updated_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Programmes belong to a university and map to one field of study.
create table public.programmes (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id) on delete cascade,
  field_id uuid references public.fields (id) on delete set null,
  name text not null,
  level text not null default 'Undergraduate',
  duration_years numeric(3, 1),
  entry_requirements text,
  entry_test text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index programmes_university_idx on public.programmes (university_id);
create index programmes_field_idx on public.programmes (field_id);

create table public.scholarships (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  provider text not null,
  scope public.scholarship_scope not null default 'pakistan',
  kind public.scholarship_kind not null,
  summary text,
  who_its_for text,
  what_it_covers text,
  eligible_areas text[] not null default '{}',
  women_only boolean not null default false,
  how_to_apply text,
  deadline date,
  deadline_note text,
  official_url text,
  status public.content_status not null default 'draft',
  source_url text,
  last_verified_at timestamptz,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  updated_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index scholarships_deadline_idx on public.scholarships (deadline) where status = 'published';

create table public.scholarship_fields (
  scholarship_id uuid not null references public.scholarships (id) on delete cascade,
  field_id uuid not null references public.fields (id) on delete cascade,
  primary key (scholarship_id, field_id)
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  url text not null,
  category public.resource_category not null,
  sort_order int not null default 0,
  status public.content_status not null default 'draft',
  source_url text,
  last_verified_at timestamptz,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  updated_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.guidance_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  summary text,
  body_markdown text not null default '',
  sort_order int not null default 0,
  status public.content_status not null default 'draft',
  source_url text,
  last_verified_at timestamptz,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  updated_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Team: one row per invited person, keyed to their auth user.
create table public.team_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email extensions.citext not null unique,
  full_name text,
  role public.team_role not null default 'researcher',
  status public.member_status not null default 'invited',
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activity_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  summary text,
  created_at timestamptz not null default now()
);
create index activity_log_created_idx on public.activity_log (created_at desc);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254 and email like '%@%'),
  message text not null check (char_length(message) between 1 and 4000),
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Role helpers (security definer so policies can read team_members safely)
-- ---------------------------------------------------------------------------
create or replace function public.current_team_role()
returns public.team_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.team_members
  where user_id = auth.uid() and status = 'active'
$$;

create or replace function public.is_team_member()
returns boolean language sql stable security definer set search_path = ''
as $$ select public.current_team_role() is not null $$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce(public.current_team_role() in ('admin', 'owner'), false) $$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce(public.current_team_role() = 'owner', false) $$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Keep updated_at / updated_by current.
create or replace function public.touch_row()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  if tg_table_name <> 'team_members' and tg_table_name <> 'programmes' then
    new.updated_by := coalesce(auth.uid(), new.updated_by);
  end if;
  return new;
end;
$$;

-- Only admins can bring a row back out of the archive.
create or replace function public.guard_restore()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if old.status = 'archived' and new.status <> 'archived' and not public.is_admin() then
    raise exception 'Only admins can restore archived entries' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Write every content change to the activity log.
create or replace function public.log_activity()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  rec record;
  act text;
  label text;
begin
  if tg_op = 'DELETE' then rec := old; act := 'deleted';
  elsif tg_op = 'INSERT' then rec := new; act := 'created';
  elsif old.status is distinct from new.status then rec := new; act := new.status::text;
  else rec := new; act := 'updated';
  end if;

  label := coalesce(to_jsonb(rec) ->> 'name', to_jsonb(rec) ->> 'title', to_jsonb(rec) ->> 'full_name', to_jsonb(rec) ->> 'email', to_jsonb(rec) ->> 'slug');

  insert into public.activity_log (actor_id, action, entity_type, entity_id, summary)
  values (auth.uid(), act, tg_table_name, coalesce(to_jsonb(rec) ->> 'id', to_jsonb(rec) ->> 'user_id'), label);

  return null;
end;
$$;

-- Team rules: only the owner can create or remove admins/owners, and nobody
-- can change their own role.
create or replace function public.guard_team_change()
returns trigger language plpgsql set search_path = ''
as $$
begin
  -- Seeding and service-role work run without a signed-in user.
  if auth.uid() is null then
    return coalesce(new, old);
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    if new.role in ('admin', 'owner') and not public.is_owner() then
      raise exception 'Only the owner can add admins' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and new.user_id = auth.uid() and new.role <> old.role then
      raise exception 'You cannot change your own role' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and old.role in ('admin', 'owner') and not public.is_owner() then
      raise exception 'Only the owner can change an admin' using errcode = '42501';
    end if;
  end if;

  if tg_op = 'DELETE' and old.role in ('admin', 'owner') and not public.is_owner() then
    raise exception 'Only the owner can remove an admin' using errcode = '42501';
  end if;

  return coalesce(new, old);
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['fields', 'universities', 'scholarships', 'resources', 'guidance_articles']
  loop
    execute format('create trigger %I_touch before update on public.%I for each row execute function public.touch_row()', t, t);
    execute format('create trigger %I_guard_restore before update on public.%I for each row execute function public.guard_restore()', t, t);
    execute format('create trigger %I_log after insert or update or delete on public.%I for each row execute function public.log_activity()', t, t);
  end loop;
end;
$$;

create trigger programmes_touch before update on public.programmes
  for each row execute function public.touch_row();
create trigger team_members_touch before update on public.team_members
  for each row execute function public.touch_row();
create trigger team_members_guard before insert or update or delete on public.team_members
  for each row execute function public.guard_team_change();
create trigger team_members_log after insert or update or delete on public.team_members
  for each row execute function public.log_activity();
