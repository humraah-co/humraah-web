-- Fix: an invited admin could not accept their own invite.
--
-- accept_invite() moves the person's own row from invited to active. The
-- "Only the owner can add admins" check fired on that update because the row's
-- role is admin, even though the role isn't changing. Accepting your own
-- invite (same role, same email, only name and status change) is now allowed
-- before the owner-only checks run. Every other rule is unchanged.

create or replace function public.guard_team_change()
returns trigger language plpgsql set search_path = ''
as $$
begin
  -- Seeding and service-role work run without a signed-in user.
  if auth.uid() is null then
    return coalesce(new, old);
  end if;

  -- Accepting your own invite: only the name and status (invited -> active) change.
  if tg_op = 'UPDATE'
    and new.user_id = auth.uid()
    and old.status = 'invited' and new.status = 'active'
    and new.role = old.role
    and new.email = old.email
    and new.invited_by is not distinct from old.invited_by then
    return new;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    if new.role in ('admin', 'owner') and not public.is_owner() then
      raise exception 'Only the owner can add admins' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and new.user_id = auth.uid() and new.role <> old.role then
      raise exception 'You cannot change your own role' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and new.user_id = auth.uid() and new.status <> old.status then
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
