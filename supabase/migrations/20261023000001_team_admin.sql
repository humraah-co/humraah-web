-- Team management for the admin portal (Day 4).
--
--   * Nobody can suspend, reactivate or remove themselves (on top of the
--     existing rule that nobody can change their own role).
--   * accept_invite(): an invited person sets their name and becomes active.
--   * Team changes get their own activity-log wording (invited, joined,
--     suspended …) instead of the generic created/updated/deleted.
--   * record_invite_resent(): resending an invite changes no row, so admins
--     log it through this function.

-- ---------------------------------------------------------------------------
-- Team rules
-- ---------------------------------------------------------------------------
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
    -- The one change people make to their own status is accepting their invite.
    if tg_op = 'UPDATE' and new.user_id = auth.uid() and new.status <> old.status
      and not (old.status = 'invited' and new.status = 'active') then
      raise exception 'You cannot change your own status' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and old.role in ('admin', 'owner') and not public.is_owner() then
      raise exception 'Only the owner can change an admin' using errcode = '42501';
    end if;
  end if;

  if tg_op = 'DELETE' and old.user_id = auth.uid() then
    raise exception 'You cannot remove yourself' using errcode = '42501';
  end if;
  if tg_op = 'DELETE' and old.role in ('admin', 'owner') and not public.is_owner() then
    raise exception 'Only the owner can remove an admin' using errcode = '42501';
  end if;

  return coalesce(new, old);
end;
$$;

-- ---------------------------------------------------------------------------
-- Accepting an invite
-- ---------------------------------------------------------------------------
-- Runs as the invited person (their row isn't active yet, so the "Admins
-- update members" policy doesn't apply to them). Only touches their own row,
-- and only while it is still an invite.
create or replace function public.accept_invite(p_full_name text)
returns public.team_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  member public.team_members;
  name text := btrim(coalesce(p_full_name, ''));
begin
  if auth.uid() is null then
    raise exception 'Sign in first' using errcode = '42501';
  end if;
  if char_length(name) not between 1 and 120 then
    raise exception 'Name must be 1 to 120 characters' using errcode = '22023';
  end if;

  update public.team_members
  set full_name = name, status = 'active'
  where user_id = auth.uid() and status = 'invited'
  returning * into member;

  if not found then
    raise exception 'There is no pending invite for this account' using errcode = '42501';
  end if;
  return member;
end;
$$;

revoke execute on function public.accept_invite(text) from public, anon;
grant execute on function public.accept_invite(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Activity log wording for team changes
-- ---------------------------------------------------------------------------
create or replace function public.log_team_activity()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  rec public.team_members;
  act text;
begin
  if tg_op = 'INSERT' then
    rec := new;
    act := case when new.status = 'invited' then 'invited' else 'added' end;
  elsif tg_op = 'DELETE' then
    rec := old;
    act := case when old.status = 'invited' then 'invite_revoked' else 'removed' end;
  else
    rec := new;
    if old.status is distinct from new.status then
      act := case
        when old.status = 'invited' and new.status = 'active' then 'joined'
        when new.status = 'suspended' then 'suspended'
        when old.status = 'suspended' and new.status = 'active' then 'reactivated'
        else new.status::text
      end;
    elsif old.role is distinct from new.role then
      act := 'role_changed';
    else
      act := 'updated';
    end if;
  end if;

  insert into public.activity_log (actor_id, action, entity_type, entity_id, summary)
  values (auth.uid(), act, 'team_members', rec.user_id::text, coalesce(rec.full_name, rec.email::text));

  return null;
end;
$$;

drop trigger team_members_log on public.team_members;
create trigger team_members_log after insert or update or delete on public.team_members
  for each row execute function public.log_team_activity();

-- ---------------------------------------------------------------------------
-- Resending an invite
-- ---------------------------------------------------------------------------
-- Same rules as managing the member: admins only, and only the owner for an
-- admin invite.
create or replace function public.record_invite_resent(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  member public.team_members;
begin
  if not public.is_admin() then
    raise exception 'Only admins can resend invites' using errcode = '42501';
  end if;

  select * into member from public.team_members where user_id = p_user_id;
  if not found or member.status <> 'invited' then
    raise exception 'There is no pending invite for this person' using errcode = '22023';
  end if;
  if member.role in ('admin', 'owner') and not public.is_owner() then
    raise exception 'Only the owner can change an admin' using errcode = '42501';
  end if;

  insert into public.activity_log (actor_id, action, entity_type, entity_id, summary)
  values (auth.uid(), 'invite_resent', 'team_members', member.user_id::text,
    coalesce(member.full_name, member.email::text));
end;
$$;

revoke execute on function public.record_invite_resent(uuid) from public, anon;
grant execute on function public.record_invite_resent(uuid) to authenticated;
