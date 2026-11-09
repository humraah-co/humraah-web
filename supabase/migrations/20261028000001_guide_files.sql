-- The Higher Education Guide PDFs (Day 8).
--
-- The team uploads one PDF per language (English, Urdu) from the admin
-- portal and the public Guidance page links to it.
--
--   anyone               read which file is current (not who uploaded it)
--   researcher           upload a PDF and replace one
--   admin, owner         also remove one
--   invited, suspended   nothing
--
-- What this adds:
--   * public.guide_files: one row per language ('en' or 'ur').
--   * Row-level security and column grants for the rules above. Visitors
--     can read the file's path, name, size and date, but not uploaded_by.
--   * A trigger stamps uploaded_by and updated_at, so neither can be
--     sent from the browser.
--   * The activity log records "uploaded", "replaced" and "removed".
--   * The public "guides" Storage bucket (reading only). There are no
--     policies on storage.objects for anonymous or signed-in users: the
--     only writes are made by the server with the service-role key, through
--     signed upload URLs it hands to team members, and by removing files.
--     The bucket creation is skipped where there is no storage schema
--     (the PGlite test database).
--
-- Safe to run again.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
create table if not exists public.guide_files (
  language text primary key check (language in ('en', 'ur')),
  -- "<language>/<uuid>.pdf" in the "guides" bucket. A replacement gets a
  -- new path, so a stale copy is never served from a cache.
  storage_path text not null
    check (storage_path ~ '^(en|ur)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$'
           and left(storage_path, 2) = language),
  file_name text not null check (char_length(file_name) between 1 and 200),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 26214400),
  uploaded_by uuid references public.team_members (user_id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.guide_files enable row level security;

-- ---------------------------------------------------------------------------
-- Grants (row-level security still filters every row)
-- ---------------------------------------------------------------------------
revoke all on public.guide_files from anon, authenticated;
grant select (language, storage_path, file_name, size_bytes, updated_at) on public.guide_files to anon;
grant select, insert, update, delete on public.guide_files to authenticated;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------
drop policy if exists "Anyone reads guide files" on public.guide_files;
create policy "Anyone reads guide files" on public.guide_files
  for select to anon, authenticated using (true);

drop policy if exists "Team uploads guide files" on public.guide_files;
create policy "Team uploads guide files" on public.guide_files
  for insert to authenticated with check (public.is_team_member());

drop policy if exists "Team replaces guide files" on public.guide_files;
create policy "Team replaces guide files" on public.guide_files
  for update to authenticated using (public.is_team_member()) with check (public.is_team_member());

drop policy if exists "Admins remove guide files" on public.guide_files;
create policy "Admins remove guide files" on public.guide_files
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Stamping and logging
-- ---------------------------------------------------------------------------
create or replace function public.stamp_guide_file()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  -- Seeding and service-role work run without a signed-in user.
  if auth.uid() is not null then
    new.uploaded_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists guide_files_stamp on public.guide_files;
create trigger guide_files_stamp before insert or update on public.guide_files
  for each row execute function public.stamp_guide_file();

-- Only what was done, to which guide, and by whom.
create or replace function public.log_guide_file_activity()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  rec public.guide_files;
  act text;
begin
  if tg_op = 'INSERT' then
    rec := new; act := 'uploaded';
  elsif tg_op = 'DELETE' then
    rec := old; act := 'removed';
  elsif old.storage_path is distinct from new.storage_path then
    rec := new; act := 'replaced';
  else
    return null;
  end if;

  insert into public.activity_log (actor_id, action, entity_type, entity_id, summary)
  values (
    auth.uid(), act, 'guide_files', rec.language,
    case rec.language when 'ur' then 'the Urdu guide PDF' else 'the English guide PDF' end
  );
  return null;
end;
$$;

drop trigger if exists guide_files_log on public.guide_files;
create trigger guide_files_log after insert or update or delete on public.guide_files
  for each row execute function public.log_guide_file_activity();

-- ---------------------------------------------------------------------------
-- The public "guides" bucket
-- ---------------------------------------------------------------------------
-- Public, so the Guidance page can link straight to a file. PDFs only, 25 MB
-- at most (the same limits the server checks before it hands out an upload
-- URL). No policies are added on storage.objects: nobody but the server's
-- service role can write.
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('guides', 'guides', true, 26214400, array['application/pdf'])
    on conflict (id) do update
      set public = true,
          file_size_limit = excluded.file_size_limit,
          allowed_mime_types = excluded.allowed_mime_types;
  end if;
end
$$;
