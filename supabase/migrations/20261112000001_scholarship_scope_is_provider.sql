-- scholarships.scope now means who offers the scholarship, not where the
-- student studies: 'pakistan' for a Pakistani provider, 'international' for
-- one from abroad. The public filter ("Who offers it") and the editor read it
-- this way. Safe to run again.

comment on column public.scholarships.scope is
  'Who offers the scholarship: pakistan (a Pakistani provider) or international (a provider from abroad). Not where the student studies.';

-- Offered by the Scottish Government and the British Council, for study in
-- Pakistan: an international provider.
update public.scholarships
set scope = 'international'
where slug = 'scotland-pakistan-scholarships' and scope <> 'international';
