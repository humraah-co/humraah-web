-- Content editing in the admin portal (Day 5): universities and scholarships.
--
--   * The activity log tells restoring an archived entry ("restored") apart
--     from unpublishing one ("draft"), and logs "verified" when an entry is
--     marked as checked against its source.
--   * Publishing, and marking an entry as verified, needs a source link.
--   * save_university() / save_scholarship(): the editors save an entry and
--     its programmes or fields of study in one transaction. They run as the
--     signed-in member (security invoker), so row-level security, the
--     restore rule and the activity log all apply as usual.

-- ---------------------------------------------------------------------------
-- Activity log wording
-- ---------------------------------------------------------------------------
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
  elsif old.status is distinct from new.status then
    rec := new;
    act := case when old.status = 'archived' then 'restored' else new.status::text end;
  elsif new.last_verified_at is not null and old.last_verified_at is distinct from new.last_verified_at then
    rec := new; act := 'verified';
  else rec := new; act := 'updated';
  end if;

  label := coalesce(to_jsonb(rec) ->> 'name', to_jsonb(rec) ->> 'title', to_jsonb(rec) ->> 'full_name', to_jsonb(rec) ->> 'email', to_jsonb(rec) ->> 'slug');

  insert into public.activity_log (actor_id, action, entity_type, entity_id, summary)
  values (auth.uid(), act, tg_table_name, coalesce(to_jsonb(rec) ->> 'id', to_jsonb(rec) ->> 'user_id'), label);

  return null;
end;
$$;

-- The editor's "Recent changes" and the activity log's filters.
create index if not exists activity_log_entity_idx on public.activity_log (entity_type, entity_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Publishing and verifying need a source link
-- ---------------------------------------------------------------------------
-- Only checked when an entry becomes published or is newly verified, so
-- entries published before this rule (the seed data) keep working; the
-- editor itself also asks for a source when a published entry is updated.
-- Seeding runs without a signed-in user and is left alone.
create or replace function public.guard_content_source()
returns trigger language plpgsql set search_path = ''
as $$
declare
  publishing boolean := new.status = 'published';
  verifying boolean := new.last_verified_at is not null;
begin
  if auth.uid() is null then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    publishing := publishing and old.status <> 'published';
    verifying := verifying and old.last_verified_at is distinct from new.last_verified_at;
  end if;
  if (publishing or verifying) and nullif(btrim(coalesce(new.source_url, '')), '') is null then
    if publishing then
      raise exception 'Add the official source link before publishing' using errcode = '23514';
    end if;
    raise exception 'Add the official source link before marking this as verified' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists universities_guard_source on public.universities;
create trigger universities_guard_source before insert or update on public.universities
  for each row execute function public.guard_content_source();
drop trigger if exists scholarships_guard_source on public.scholarships;
create trigger scholarships_guard_source before insert or update on public.scholarships
  for each row execute function public.guard_content_source();

-- ---------------------------------------------------------------------------
-- Saving from the editors
-- ---------------------------------------------------------------------------
-- p_values holds the editor's columns; anything else in it (id, created_by,
-- last_verified_at …) is ignored. Saving with no changes writes nothing, so
-- the log only shows real changes. Edits and a status change in the same
-- save are logged separately ("updated", then "published").

create or replace function public.save_university(p_id uuid, p_values jsonb, p_programmes jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  cols text[] := array[
    'slug', 'name', 'short_name', 'city', 'campuses_note', 'province', 'type', 'hec_recognised',
    'women_only', 'has_hostel', 'need_based_aid', 'admission_test', 'website_url', 'admissions_url',
    'overview', 'how_to_apply', 'required_documents', 'fee_min_pkr', 'fee_max_pkr', 'fee_note',
    'admissions_window', 'source_url', 'status'];
  v jsonb;
  cur public.universities;
  rec public.universities;
  progs jsonb;
  cur_progs jsonb;
  entry_id uuid := p_id;
begin
  if not public.is_team_member() then
    raise exception 'Only team members can edit entries' using errcode = '42501';
  end if;
  if jsonb_typeof(coalesce(p_programmes, '[]'::jsonb)) <> 'array' then
    raise exception 'Programmes must be a list' using errcode = '22023';
  end if;

  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) into v
  from jsonb_each(coalesce(p_values, '{}'::jsonb)) where key = any(cols);

  select coalesce(jsonb_agg(jsonb_build_object(
      'field_id', (p ->> 'field_id')::uuid,
      'name', btrim(p ->> 'name'),
      'level', coalesce(nullif(btrim(p ->> 'level'), ''), 'Undergraduate'),
      'entry_requirements', nullif(btrim(p ->> 'entry_requirements'), ''),
      'entry_test', nullif(btrim(p ->> 'entry_test'), '')) order by ord), '[]'::jsonb)
  into progs
  from jsonb_array_elements(coalesce(p_programmes, '[]'::jsonb)) with ordinality as t(p, ord);

  if entry_id is null then
    -- New entries start as drafts; publishing is a second step below.
    rec := jsonb_populate_record(null::public.universities, v);
    insert into public.universities (
      slug, name, short_name, city, campuses_note, province, type, hec_recognised, women_only,
      has_hostel, need_based_aid, admission_test, website_url, admissions_url, overview, how_to_apply,
      required_documents, fee_min_pkr, fee_max_pkr, fee_note, admissions_window, source_url, status)
    values (
      rec.slug, rec.name, rec.short_name, rec.city, rec.campuses_note, rec.province, rec.type,
      coalesce(rec.hec_recognised, true), coalesce(rec.women_only, false), rec.has_hostel,
      rec.need_based_aid, rec.admission_test, rec.website_url, rec.admissions_url, rec.overview,
      rec.how_to_apply, coalesce(rec.required_documents, '{}'), rec.fee_min_pkr, rec.fee_max_pkr,
      rec.fee_note, rec.admissions_window, rec.source_url, 'draft')
    returning * into cur;
    entry_id := cur.id;
    cur_progs := '[]'::jsonb;
  else
    select * into cur from public.universities where id = entry_id for update;
    if not found then
      raise exception 'This entry no longer exists' using errcode = 'P0002';
    end if;
    if cur.status = 'archived' then
      raise exception 'Archived entries can''t be edited. Restore it first' using errcode = '42501';
    end if;
    rec := jsonb_populate_record(cur, v);

    select coalesce(jsonb_agg(jsonb_build_object(
        'field_id', field_id, 'name', name, 'level', level,
        'entry_requirements', entry_requirements, 'entry_test', entry_test) order by sort_order, created_at), '[]'::jsonb)
    into cur_progs
    from public.programmes where university_id = entry_id;

    -- Programme changes alone still touch the university, so they're logged.
    if (to_jsonb(rec) - 'status') is distinct from (to_jsonb(cur) - 'status') or progs is distinct from cur_progs then
      update public.universities set
        slug = rec.slug, name = rec.name, short_name = rec.short_name, city = rec.city,
        campuses_note = rec.campuses_note, province = rec.province, type = rec.type,
        hec_recognised = rec.hec_recognised, women_only = rec.women_only, has_hostel = rec.has_hostel,
        need_based_aid = rec.need_based_aid, admission_test = rec.admission_test,
        website_url = rec.website_url, admissions_url = rec.admissions_url, overview = rec.overview,
        how_to_apply = rec.how_to_apply, required_documents = rec.required_documents,
        fee_min_pkr = rec.fee_min_pkr, fee_max_pkr = rec.fee_max_pkr, fee_note = rec.fee_note,
        admissions_window = rec.admissions_window, source_url = rec.source_url
      where id = entry_id;
    end if;
  end if;

  if progs is distinct from cur_progs then
    delete from public.programmes where university_id = entry_id;
    insert into public.programmes (university_id, field_id, name, level, entry_requirements, entry_test, sort_order)
    select entry_id, (p ->> 'field_id')::uuid, p ->> 'name', p ->> 'level', p ->> 'entry_requirements',
      p ->> 'entry_test', ord::int
    from jsonb_array_elements(progs) with ordinality as t(p, ord);
  end if;

  if rec.status is not null and rec.status is distinct from cur.status then
    update public.universities set status = rec.status where id = entry_id;
  end if;

  return entry_id;
end;
$$;

create or replace function public.save_scholarship(p_id uuid, p_values jsonb, p_field_ids uuid[])
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  cols text[] := array[
    'slug', 'name', 'provider', 'scope', 'kind', 'summary', 'who_its_for', 'what_it_covers',
    'eligible_areas', 'women_only', 'how_to_apply', 'deadline', 'deadline_note', 'official_url',
    'covers', 'audience_note', 'source_url', 'status'];
  v jsonb;
  cur public.scholarships;
  rec public.scholarships;
  field_ids uuid[];
  cur_field_ids uuid[];
  entry_id uuid := p_id;
begin
  if not public.is_team_member() then
    raise exception 'Only team members can edit entries' using errcode = '42501';
  end if;

  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) into v
  from jsonb_each(coalesce(p_values, '{}'::jsonb)) where key = any(cols);

  select coalesce(array_agg(distinct f order by f), '{}') into field_ids
  from unnest(coalesce(p_field_ids, '{}')) as f where f is not null;

  if entry_id is null then
    rec := jsonb_populate_record(null::public.scholarships, v);
    insert into public.scholarships (
      slug, name, provider, scope, kind, summary, who_its_for, what_it_covers, eligible_areas,
      women_only, how_to_apply, deadline, deadline_note, official_url, covers, audience_note,
      source_url, status)
    values (
      rec.slug, rec.name, rec.provider, coalesce(rec.scope, 'pakistan'), rec.kind, rec.summary,
      rec.who_its_for, rec.what_it_covers, coalesce(rec.eligible_areas, '{}'),
      coalesce(rec.women_only, false), rec.how_to_apply, rec.deadline, rec.deadline_note,
      rec.official_url, coalesce(rec.covers, '{}'), rec.audience_note, rec.source_url, 'draft')
    returning * into cur;
    entry_id := cur.id;
    cur_field_ids := '{}';
  else
    select * into cur from public.scholarships where id = entry_id for update;
    if not found then
      raise exception 'This entry no longer exists' using errcode = 'P0002';
    end if;
    if cur.status = 'archived' then
      raise exception 'Archived entries can''t be edited. Restore it first' using errcode = '42501';
    end if;
    rec := jsonb_populate_record(cur, v);

    select coalesce(array_agg(field_id order by field_id), '{}') into cur_field_ids
    from public.scholarship_fields where scholarship_id = entry_id;

    -- Field-of-study changes alone still touch the scholarship, so they're logged.
    if (to_jsonb(rec) - 'status') is distinct from (to_jsonb(cur) - 'status') or field_ids is distinct from cur_field_ids then
      update public.scholarships set
        slug = rec.slug, name = rec.name, provider = rec.provider, scope = rec.scope, kind = rec.kind,
        summary = rec.summary, who_its_for = rec.who_its_for, what_it_covers = rec.what_it_covers,
        eligible_areas = rec.eligible_areas, women_only = rec.women_only,
        how_to_apply = rec.how_to_apply, deadline = rec.deadline, deadline_note = rec.deadline_note,
        official_url = rec.official_url, covers = rec.covers, audience_note = rec.audience_note,
        source_url = rec.source_url
      where id = entry_id;
    end if;
  end if;

  if field_ids is distinct from cur_field_ids then
    delete from public.scholarship_fields where scholarship_id = entry_id;
    insert into public.scholarship_fields (scholarship_id, field_id)
    select entry_id, f from unnest(field_ids) as f;
  end if;

  if rec.status is not null and rec.status is distinct from cur.status then
    update public.scholarships set status = rec.status where id = entry_id;
  end if;

  return entry_id;
end;
$$;

revoke execute on function public.save_university(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.save_university(uuid, jsonb, jsonb) to authenticated;
revoke execute on function public.save_scholarship(uuid, jsonb, uuid[]) from public, anon;
grant execute on function public.save_scholarship(uuid, jsonb, uuid[]) to authenticated;
