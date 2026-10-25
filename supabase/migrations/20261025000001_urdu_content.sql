-- Urdu versions of the public content.
--
-- Each table that has text visitors read gains an optional "_ur" column
-- beside it. Empty (null) means "not translated yet": the Urdu page then
-- shows the English, with a note saying so. Names of universities,
-- scholarships, programmes and providers stay in English, so most have no
-- Urdu column; a university gets name_ur only for a well-known Urdu name,
-- and field-of-study names are ordinary words, so they have one.
--
-- Row-level security is unchanged. These are columns on the same rows, so
-- the same policies (anyone reads published rows; team members edit) and
-- the same table grants apply to them.
--
-- The editors' save functions are replaced with the same code plus the
-- Urdu fields, so Urdu text is saved and logged like the rest. Fields of
-- study, resources and guidance have no editor yet; their Urdu comes from
-- 20261025000002_urdu_translations.sql and the review sheet
-- (docs/urdu-review.csv, npm run urdu:apply).
--
-- Safe to run again: columns are added only if missing, and the functions
-- are replaced in place.

alter table public.universities
  add column if not exists name_ur text,
  add column if not exists campuses_note_ur text,
  add column if not exists overview_ur text,
  add column if not exists how_to_apply_ur text,
  add column if not exists required_documents_ur text[],
  add column if not exists fee_note_ur text,
  add column if not exists admissions_window_ur text,
  add column if not exists admission_test_ur text;

alter table public.programmes
  add column if not exists entry_requirements_ur text,
  add column if not exists entry_test_ur text;

alter table public.scholarships
  add column if not exists summary_ur text,
  add column if not exists who_its_for_ur text,
  add column if not exists what_it_covers_ur text,
  add column if not exists how_to_apply_ur text,
  add column if not exists audience_note_ur text,
  add column if not exists deadline_note_ur text,
  add column if not exists covers_ur text[],
  add column if not exists eligible_areas_ur text[];

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
    'admissions_window', 'source_url', 'status',
    'name_ur', 'campuses_note_ur', 'overview_ur', 'how_to_apply_ur', 'required_documents_ur',
    'fee_note_ur', 'admissions_window_ur', 'admission_test_ur'];
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
      'entry_test', nullif(btrim(p ->> 'entry_test'), ''),
      'entry_requirements_ur', nullif(btrim(p ->> 'entry_requirements_ur'), ''),
      'entry_test_ur', nullif(btrim(p ->> 'entry_test_ur'), '')) order by ord), '[]'::jsonb)
  into progs
  from jsonb_array_elements(coalesce(p_programmes, '[]'::jsonb)) with ordinality as t(p, ord);

  if entry_id is null then
    -- New entries start as drafts; publishing is a second step below.
    rec := jsonb_populate_record(null::public.universities, v);
    insert into public.universities (
      slug, name, short_name, city, campuses_note, province, type, hec_recognised, women_only,
      has_hostel, need_based_aid, admission_test, website_url, admissions_url, overview, how_to_apply,
      required_documents, fee_min_pkr, fee_max_pkr, fee_note, admissions_window, source_url, status,
      name_ur, campuses_note_ur, overview_ur, how_to_apply_ur, required_documents_ur, fee_note_ur,
      admissions_window_ur, admission_test_ur)
    values (
      rec.slug, rec.name, rec.short_name, rec.city, rec.campuses_note, rec.province, rec.type,
      coalesce(rec.hec_recognised, false), coalesce(rec.women_only, false), rec.has_hostel,
      rec.need_based_aid, rec.admission_test, rec.website_url, rec.admissions_url, rec.overview,
      rec.how_to_apply, coalesce(rec.required_documents, '{}'), rec.fee_min_pkr, rec.fee_max_pkr,
      rec.fee_note, rec.admissions_window, rec.source_url, 'draft',
      rec.name_ur, rec.campuses_note_ur, rec.overview_ur, rec.how_to_apply_ur, rec.required_documents_ur,
      rec.fee_note_ur, rec.admissions_window_ur, rec.admission_test_ur)
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

    -- Leaving "published" happens first, so a save that moves an entry to
    -- drafts can also untick something only published entries need (HEC).
    if cur.status = 'published' and rec.status is not null and rec.status <> 'published' then
      update public.universities set status = rec.status where id = entry_id;
      cur.status := rec.status;
    end if;

    select coalesce(jsonb_agg(jsonb_build_object(
        'field_id', field_id, 'name', name, 'level', level,
        'entry_requirements', entry_requirements, 'entry_test', entry_test,
        'entry_requirements_ur', entry_requirements_ur, 'entry_test_ur', entry_test_ur) order by sort_order, created_at), '[]'::jsonb)
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
        admissions_window = rec.admissions_window, source_url = rec.source_url,
        name_ur = rec.name_ur, campuses_note_ur = rec.campuses_note_ur, overview_ur = rec.overview_ur,
        how_to_apply_ur = rec.how_to_apply_ur, required_documents_ur = rec.required_documents_ur,
        fee_note_ur = rec.fee_note_ur, admissions_window_ur = rec.admissions_window_ur,
        admission_test_ur = rec.admission_test_ur
      where id = entry_id;
    end if;
  end if;

  if progs is distinct from cur_progs then
    delete from public.programmes where university_id = entry_id;
    insert into public.programmes (
      university_id, field_id, name, level, entry_requirements, entry_test, entry_requirements_ur,
      entry_test_ur, sort_order)
    select entry_id, (p ->> 'field_id')::uuid, p ->> 'name', p ->> 'level', p ->> 'entry_requirements',
      p ->> 'entry_test', p ->> 'entry_requirements_ur', p ->> 'entry_test_ur', ord::int
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
    'covers', 'audience_note', 'source_url', 'status',
    'summary_ur', 'who_its_for_ur', 'what_it_covers_ur', 'how_to_apply_ur', 'audience_note_ur',
    'deadline_note_ur', 'covers_ur', 'eligible_areas_ur'];
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
      source_url, status, summary_ur, who_its_for_ur, what_it_covers_ur, how_to_apply_ur,
      audience_note_ur, deadline_note_ur, covers_ur, eligible_areas_ur)
    values (
      rec.slug, rec.name, rec.provider, coalesce(rec.scope, 'pakistan'), rec.kind, rec.summary,
      rec.who_its_for, rec.what_it_covers, coalesce(rec.eligible_areas, '{}'),
      coalesce(rec.women_only, false), rec.how_to_apply, rec.deadline, rec.deadline_note,
      rec.official_url, coalesce(rec.covers, '{}'), rec.audience_note, rec.source_url, 'draft',
      rec.summary_ur, rec.who_its_for_ur, rec.what_it_covers_ur, rec.how_to_apply_ur,
      rec.audience_note_ur, rec.deadline_note_ur, rec.covers_ur, rec.eligible_areas_ur)
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
        source_url = rec.source_url, summary_ur = rec.summary_ur, who_its_for_ur = rec.who_its_for_ur,
        what_it_covers_ur = rec.what_it_covers_ur, how_to_apply_ur = rec.how_to_apply_ur,
        audience_note_ur = rec.audience_note_ur, deadline_note_ur = rec.deadline_note_ur,
        covers_ur = rec.covers_ur, eligible_areas_ur = rec.eligible_areas_ur
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

-- create or replace keeps the existing grants (authenticated only); stated
-- again so a fresh database ends up the same.
revoke execute on function public.save_university(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.save_university(uuid, jsonb, jsonb) to authenticated;
revoke execute on function public.save_scholarship(uuid, jsonb, uuid[]) from public, anon;
grant execute on function public.save_scholarship(uuid, jsonb, uuid[]) to authenticated;
