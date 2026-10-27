-- The messages inbox in the admin portal (Day 6, part 2).
--
-- Contact messages hold visitors' names, email addresses and whatever they
-- chose to write, so access stays as narrow as it was:
--
--   anon / visitors    send a message (name, email, message); never read one
--   researcher         nothing: they can't see that messages exist
--   admin, owner       read them, mark them read or unread, archive them
--   nobody             edits what was written, or deletes a message
--
-- What this adds:
--   * read_at / read_by and archived_at / archived_by: whether a message has
--     been read or archived, and by whom. Unread = not read and not archived.
--     The older "handled" column is left as it was and is no longer used.
--   * Column-level grants: visitors can only fill in name, email and message,
--     and signed-in admins can only change the four columns above, so the
--     text of a message can't be altered through any query.
--   * A trigger stamps the time and the person itself, so neither can be
--     sent from the browser.
--   * The activity log records reading, un-reading, archiving and
--     restoring, as "a contact message", never the sender's name or email
--     (researchers can read the log).
--
-- Safe to run again.

alter table public.contact_messages
  add column if not exists read_at timestamptz,
  add column if not exists read_by uuid references auth.users (id) on delete set null,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users (id) on delete set null;

create index if not exists contact_messages_inbox_idx on public.contact_messages (created_at desc);

-- ---------------------------------------------------------------------------
-- Grants: only what each role needs
-- ---------------------------------------------------------------------------
revoke insert on public.contact_messages from anon, authenticated;
grant insert (name, email, message) on public.contact_messages to anon, authenticated;

revoke update on public.contact_messages from anon, authenticated;
grant update (read_at, read_by, archived_at, archived_by) on public.contact_messages to authenticated;
-- select stays as granted before; the policy below limits it to admins.
-- There is no delete grant and no delete policy.

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------
drop policy if exists "Anyone can send a message" on public.contact_messages;
create policy "Anyone can send a message" on public.contact_messages
  for insert to anon, authenticated
  with check (
    handled = false and read_at is null and read_by is null and archived_at is null and archived_by is null
  );

drop policy if exists "Admins mark messages handled" on public.contact_messages;
drop policy if exists "Admins update message state" on public.contact_messages;
create policy "Admins update message state" on public.contact_messages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- "Admins read messages" (select, is_admin()) is unchanged.

-- ---------------------------------------------------------------------------
-- Stamping and logging
-- ---------------------------------------------------------------------------
-- Whatever time or person the browser sends, the database decides: the
-- moment of the change and the signed-in admin; a message already read or
-- archived keeps its original stamp.
create or replace function public.stamp_message_state()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if new.read_at is null then
    new.read_by := null;
  elsif old.read_at is null then
    new.read_at := now();
    new.read_by := auth.uid();
  else
    new.read_at := old.read_at;
    new.read_by := old.read_by;
  end if;

  if new.archived_at is null then
    new.archived_by := null;
  elsif old.archived_at is null then
    new.archived_at := now();
    new.archived_by := auth.uid();
  else
    new.archived_at := old.archived_at;
    new.archived_by := old.archived_by;
  end if;
  return new;
end;
$$;

drop trigger if exists contact_messages_stamp on public.contact_messages;
create trigger contact_messages_stamp before update on public.contact_messages
  for each row execute function public.stamp_message_state();

-- No name, email or text goes in the log: only what was done, and by whom.
create or replace function public.log_message_activity()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  act text;
begin
  if (old.read_at is null) <> (new.read_at is null) then
    act := case when new.read_at is null then 'unread' else 'read' end;
    insert into public.activity_log (actor_id, action, entity_type, entity_id, summary)
    values (auth.uid(), act, 'contact_messages', new.id::text, 'a contact message');
  end if;
  if (old.archived_at is null) <> (new.archived_at is null) then
    act := case when new.archived_at is null then 'unarchived' else 'archived' end;
    insert into public.activity_log (actor_id, action, entity_type, entity_id, summary)
    values (auth.uid(), act, 'contact_messages', new.id::text, 'a contact message');
  end if;
  return null;
end;
$$;

drop trigger if exists contact_messages_log on public.contact_messages;
create trigger contact_messages_log after update on public.contact_messages
  for each row execute function public.log_message_activity();
