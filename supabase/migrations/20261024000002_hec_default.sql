-- New universities don't claim HEC recognition until someone confirms it.
--
-- universities.hec_recognised defaulted to true, so a new entry showed the
-- "HEC-recognised" badge on the public site even when nobody had checked.
-- It now defaults to false, like every other yes/no claim the public pages
-- show: women_only is already false, and has_hostel and need_based_aid stay
-- "not set" (null). Existing rows keep their values.
--
-- save_university() is replaced only to match: when the editor sends no
-- value for hec_recognised, a new entry is now saved as not recognised.

alter table public.universities alter column hec_recognised set default false;

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
      coalesce(rec.hec_recognised, false), coalesce(rec.women_only, false), rec.has_hostel,
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

-- create or replace keeps the existing grants (authenticated only).
