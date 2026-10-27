-- Content editing for the rest of the site content (Day 6, part 2): fields of
-- study, resources and guidance articles, with the same rules Day 5 set for
-- universities and scholarships.
--
--   * Publishing, and marking an entry as verified, needs a source link
--     (the same guard_content_source() the Day 5 tables use).
--   * Only archived entries can be deleted, and only by admins and the owner
--     (the "Admins delete" policy already limits who; this limits what).
--   * The ten fields of study the quiz scores keep their web address, so
--     renaming one can't break the quiz or the field icons.
--   * A resource's link has to be a web link, since the page shows it as one.
--   * save_field(), save_resource(), save_guidance_article(): the editors
--     save an entry in one call. They run as the signed-in member (security
--     invoker), so row-level security, the restore rule and the activity log
--     all apply as usual.
--
-- Urdu: the "_ur" columns on all three tables were added in
-- 20261025000001_urdu_content.sql, and the current rows were translated in
-- 20261025000002_urdu_translations.sql. They are stated again below only so
-- this file stands on its own; adding a column that exists is a no-op.
-- Example programme names on a field stay in English, so the editor has no
-- Urdu box for them and the save function leaves that column alone.
--
-- Safe to run again.

alter table public.fields
  add column if not exists name_ur text,
  add column if not exists summary_ur text,
  add column if not exists you_might_enjoy_ur text,
  add column if not exists interests_ur text[],
  add column if not exists example_programmes_ur text[];
alter table public.resources
  add column if not exists title_ur text,
  add column if not exists description_ur text;
alter table public.guidance_articles
  add column if not exists title_ur text,
  add column if not exists summary_ur text,
  add column if not exists body_markdown_ur text;

-- ---------------------------------------------------------------------------
-- Rules
-- ---------------------------------------------------------------------------
drop trigger if exists fields_guard_source on public.fields;
create trigger fields_guard_source before insert or update on public.fields
  for each row execute function public.guard_content_source();
drop trigger if exists resources_guard_source on public.resources;
create trigger resources_guard_source before insert or update on public.resources
  for each row execute function public.guard_content_source();
drop trigger if exists guidance_articles_guard_source on public.guidance_articles;
create trigger guidance_articles_guard_source before insert or update on public.guidance_articles
  for each row execute function public.guard_content_source();

-- Deleting is a second step after archiving. Seeding and service-role work
-- run without a signed-in user and are left alone, like the other content rules.
create or replace function public.guard_delete_archived()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if auth.uid() is not null and old.status <> 'archived' then
    raise exception 'Only archived entries can be deleted. Archive it first' using errcode = '42501';
  end if;
  return old;
end;
$$;

drop trigger if exists fields_guard_delete on public.fields;
create trigger fields_guard_delete before delete on public.fields
  for each row execute function public.guard_delete_archived();
drop trigger if exists resources_guard_delete on public.resources;
create trigger resources_guard_delete before delete on public.resources
  for each row execute function public.guard_delete_archived();
drop trigger if exists guidance_articles_guard_delete on public.guidance_articles;
create trigger guidance_articles_guard_delete before delete on public.guidance_articles
  for each row execute function public.guard_delete_archived();

-- The quiz gives points to these ten by web address.
create or replace function public.guard_quiz_field_slug()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if auth.uid() is not null and new.slug is distinct from old.slug and old.slug in (
    'business-management', 'engineering', 'computing-technology', 'medicine-health',
    'social-behavioural-sciences', 'humanities-languages', 'arts-design-architecture',
    'natural-applied-sciences', 'law', 'education') then
    raise exception 'The web address of this field is used by the quiz and can''t be changed'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists fields_guard_slug on public.fields;
create trigger fields_guard_slug before update on public.fields
  for each row execute function public.guard_quiz_field_slug();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'resources_url_is_web_link') then
    alter table public.resources
      add constraint resources_url_is_web_link check (url ~* '^https?://[^[:space:]]+$');
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Saving from the editors
-- ---------------------------------------------------------------------------
-- p_values holds the editor's columns; anything else in it (id, created_by,
-- last_verified_at, columns the editor doesn't offer …) is ignored. Saving
-- with no changes writes nothing, so the log only shows real changes. Edits
-- and a status change in the same save are logged separately ("updated",
-- then "published"). New entries always start as drafts.

create or replace function public.save_field(p_id uuid, p_values jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  cols text[] := array[
    'slug', 'name', 'summary', 'you_might_enjoy', 'interests', 'example_programmes', 'sort_order',
    'source_url', 'status', 'name_ur', 'summary_ur', 'you_might_enjoy_ur', 'interests_ur'];
  v jsonb;
  cur public.fields;
  rec public.fields;
  entry_id uuid := p_id;
begin
  if not public.is_team_member() then
    raise exception 'Only team members can edit entries' using errcode = '42501';
  end if;

  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) into v
  from jsonb_each(coalesce(p_values, '{}'::jsonb)) where key = any(cols);

  if entry_id is null then
    rec := jsonb_populate_record(null::public.fields, v);
    insert into public.fields (
      slug, name, summary, you_might_enjoy, interests, example_programmes, sort_order, source_url,
      status, name_ur, summary_ur, you_might_enjoy_ur, interests_ur)
    values (
      rec.slug, rec.name, rec.summary, rec.you_might_enjoy, coalesce(rec.interests, '{}'),
      coalesce(rec.example_programmes, '{}'), coalesce(rec.sort_order, 0), rec.source_url, 'draft',
      rec.name_ur, rec.summary_ur, rec.you_might_enjoy_ur, rec.interests_ur)
    returning * into cur;
    entry_id := cur.id;
  else
    select * into cur from public.fields where id = entry_id for update;
    if not found then
      raise exception 'This entry no longer exists' using errcode = 'P0002';
    end if;
    if cur.status = 'archived' then
      raise exception 'Archived entries can''t be edited. Restore it first' using errcode = '42501';
    end if;
    rec := jsonb_populate_record(cur, v);

    if (to_jsonb(rec) - 'status') is distinct from (to_jsonb(cur) - 'status') then
      update public.fields set
        slug = rec.slug, name = rec.name, summary = rec.summary, you_might_enjoy = rec.you_might_enjoy,
        interests = rec.interests, example_programmes = rec.example_programmes,
        sort_order = rec.sort_order, source_url = rec.source_url, name_ur = rec.name_ur,
        summary_ur = rec.summary_ur, you_might_enjoy_ur = rec.you_might_enjoy_ur,
        interests_ur = rec.interests_ur
      where id = entry_id;
    end if;
  end if;

  if rec.status is not null and rec.status is distinct from cur.status then
    update public.fields set status = rec.status where id = entry_id;
  end if;

  return entry_id;
end;
$$;

create or replace function public.save_resource(p_id uuid, p_values jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  cols text[] := array[
    'title', 'description', 'url', 'category', 'sort_order', 'source_url', 'status',
    'title_ur', 'description_ur'];
  v jsonb;
  cur public.resources;
  rec public.resources;
  entry_id uuid := p_id;
begin
  if not public.is_team_member() then
    raise exception 'Only team members can edit entries' using errcode = '42501';
  end if;

  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) into v
  from jsonb_each(coalesce(p_values, '{}'::jsonb)) where key = any(cols);

  if entry_id is null then
    rec := jsonb_populate_record(null::public.resources, v);
    insert into public.resources (
      title, description, url, category, sort_order, source_url, status, title_ur, description_ur)
    values (
      rec.title, rec.description, rec.url, rec.category, coalesce(rec.sort_order, 0), rec.source_url,
      'draft', rec.title_ur, rec.description_ur)
    returning * into cur;
    entry_id := cur.id;
  else
    select * into cur from public.resources where id = entry_id for update;
    if not found then
      raise exception 'This entry no longer exists' using errcode = 'P0002';
    end if;
    if cur.status = 'archived' then
      raise exception 'Archived entries can''t be edited. Restore it first' using errcode = '42501';
    end if;
    rec := jsonb_populate_record(cur, v);

    if (to_jsonb(rec) - 'status') is distinct from (to_jsonb(cur) - 'status') then
      update public.resources set
        title = rec.title, description = rec.description, url = rec.url, category = rec.category,
        sort_order = rec.sort_order, source_url = rec.source_url, title_ur = rec.title_ur,
        description_ur = rec.description_ur
      where id = entry_id;
    end if;
  end if;

  if rec.status is not null and rec.status is distinct from cur.status then
    update public.resources set status = rec.status where id = entry_id;
  end if;

  return entry_id;
end;
$$;

create or replace function public.save_guidance_article(p_id uuid, p_values jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  cols text[] := array[
    'slug', 'title', 'summary', 'body_markdown', 'sort_order', 'source_url', 'status',
    'title_ur', 'summary_ur', 'body_markdown_ur'];
  v jsonb;
  cur public.guidance_articles;
  rec public.guidance_articles;
  entry_id uuid := p_id;
begin
  if not public.is_team_member() then
    raise exception 'Only team members can edit entries' using errcode = '42501';
  end if;

  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) into v
  from jsonb_each(coalesce(p_values, '{}'::jsonb)) where key = any(cols);

  if entry_id is null then
    rec := jsonb_populate_record(null::public.guidance_articles, v);
    insert into public.guidance_articles (
      slug, title, summary, body_markdown, sort_order, source_url, status, title_ur, summary_ur,
      body_markdown_ur)
    values (
      rec.slug, rec.title, rec.summary, coalesce(rec.body_markdown, ''), coalesce(rec.sort_order, 0),
      rec.source_url, 'draft', rec.title_ur, rec.summary_ur, rec.body_markdown_ur)
    returning * into cur;
    entry_id := cur.id;
  else
    select * into cur from public.guidance_articles where id = entry_id for update;
    if not found then
      raise exception 'This entry no longer exists' using errcode = 'P0002';
    end if;
    if cur.status = 'archived' then
      raise exception 'Archived entries can''t be edited. Restore it first' using errcode = '42501';
    end if;
    rec := jsonb_populate_record(cur, v);

    if (to_jsonb(rec) - 'status') is distinct from (to_jsonb(cur) - 'status') then
      update public.guidance_articles set
        slug = rec.slug, title = rec.title, summary = rec.summary, body_markdown = rec.body_markdown,
        sort_order = rec.sort_order, source_url = rec.source_url, title_ur = rec.title_ur,
        summary_ur = rec.summary_ur, body_markdown_ur = rec.body_markdown_ur
      where id = entry_id;
    end if;
  end if;

  if rec.status is not null and rec.status is distinct from cur.status then
    update public.guidance_articles set status = rec.status where id = entry_id;
  end if;

  return entry_id;
end;
$$;

revoke execute on function public.save_field(uuid, jsonb) from public, anon;
grant execute on function public.save_field(uuid, jsonb) to authenticated;
revoke execute on function public.save_resource(uuid, jsonb) from public, anon;
grant execute on function public.save_resource(uuid, jsonb) to authenticated;
revoke execute on function public.save_guidance_article(uuid, jsonb) from public, anon;
grant execute on function public.save_guidance_article(uuid, jsonb) to authenticated;
