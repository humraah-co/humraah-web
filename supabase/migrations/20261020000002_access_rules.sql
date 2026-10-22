-- Access rules (row-level security) and table grants.
--
-- The project was created with "automatically expose new tables" OFF, so every
-- table needs explicit grants, and RLS decides which rows each role sees.
--
--   anon (public site)    read published content; send a contact message
--   researcher            create, edit, publish, unpublish, archive
--   admin                 + restore from archive, delete permanently, manage researchers
--   owner                 + add or remove admins

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------
alter table public.fields enable row level security;
alter table public.universities enable row level security;
alter table public.programmes enable row level security;
alter table public.scholarships enable row level security;
alter table public.scholarship_fields enable row level security;
alter table public.resources enable row level security;
alter table public.guidance_articles enable row level security;
alter table public.team_members enable row level security;
alter table public.activity_log enable row level security;
alter table public.contact_messages enable row level security;

-- ---------------------------------------------------------------------------
-- Grants (RLS still filters every row)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on public.fields, public.universities, public.programmes, public.scholarships,
  public.scholarship_fields, public.resources, public.guidance_articles
  to anon, authenticated;

grant insert, update, delete on public.fields, public.universities, public.programmes,
  public.scholarships, public.scholarship_fields, public.resources, public.guidance_articles
  to authenticated;

grant select, insert, update, delete on public.team_members to authenticated;
grant select on public.activity_log to authenticated;

grant insert on public.contact_messages to anon, authenticated;
grant select, update on public.contact_messages to authenticated;

grant execute on function public.current_team_role(), public.is_team_member(),
  public.is_admin(), public.is_owner() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Content tables with a status column
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['fields', 'universities', 'scholarships', 'resources', 'guidance_articles']
  loop
    execute format($f$
      create policy "Public reads published %1$s" on public.%1$I
        for select to anon, authenticated
        using (status = 'published' or public.is_team_member());

      create policy "Team creates %1$s" on public.%1$I
        for insert to authenticated
        with check (public.is_team_member());

      create policy "Team edits %1$s" on public.%1$I
        for update to authenticated
        using (public.is_team_member())
        with check (public.is_team_member());

      create policy "Admins delete %1$s" on public.%1$I
        for delete to authenticated
        using (public.is_admin());
    $f$, t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Child tables follow their parent's visibility
-- ---------------------------------------------------------------------------
create policy "Public reads programmes of published universities" on public.programmes
  for select to anon, authenticated
  using (
    public.is_team_member()
    or exists (
      select 1 from public.universities u
      where u.id = university_id and u.status = 'published'
    )
  );
create policy "Team creates programmes" on public.programmes
  for insert to authenticated with check (public.is_team_member());
create policy "Team edits programmes" on public.programmes
  for update to authenticated using (public.is_team_member()) with check (public.is_team_member());
create policy "Team deletes programmes" on public.programmes
  for delete to authenticated using (public.is_team_member());

create policy "Public reads links of published scholarships" on public.scholarship_fields
  for select to anon, authenticated
  using (
    public.is_team_member()
    or exists (
      select 1 from public.scholarships s
      where s.id = scholarship_id and s.status = 'published'
    )
  );
create policy "Team creates scholarship links" on public.scholarship_fields
  for insert to authenticated with check (public.is_team_member());
create policy "Team deletes scholarship links" on public.scholarship_fields
  for delete to authenticated using (public.is_team_member());

-- ---------------------------------------------------------------------------
-- Team, activity log, contact messages
-- ---------------------------------------------------------------------------
create policy "Team reads the team" on public.team_members
  for select to authenticated
  using (public.is_team_member() or user_id = auth.uid());
create policy "Admins add members" on public.team_members
  for insert to authenticated with check (public.is_admin());
create policy "Admins update members" on public.team_members
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins remove members" on public.team_members
  for delete to authenticated using (public.is_admin());

create policy "Team reads the activity log" on public.activity_log
  for select to authenticated using (public.is_team_member());
-- No insert/update/delete policies: only the security-definer trigger writes it.

create policy "Anyone can send a message" on public.contact_messages
  for insert to anon, authenticated with check (handled = false);
create policy "Admins read messages" on public.contact_messages
  for select to authenticated using (public.is_admin());
create policy "Admins mark messages handled" on public.contact_messages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
