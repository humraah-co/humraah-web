-- Rate limit for the contact form (Day 6, launch).
--
-- Each accepted contact submission leaves one row here: a keyed hash of the
-- sender's IP address and the time. The web server computes the hash with a
-- secret that only it knows (CONTACT_IP_HASH_SECRET), so the table never holds
-- an IP address and the hashes can't be turned back into one without that
-- secret.
--
--   anon / authenticated   no access to the table, and cannot call the function
--   service_role           the web server: calls check_contact_rate() only
--   nobody else            reads, adds, changes or deletes rows directly
--
-- check_contact_rate(hash) answers "may this sender send another message now?".
-- When yes, it records the attempt; when no, it records nothing. Rows older
-- than a day are removed each time it runs, so the table stays small.
--
-- Safe to run again.

create table if not exists public.contact_rate_limits (
  id         bigint generated always as identity primary key,
  ip_hash    text not null check (char_length(ip_hash) between 16 and 128),
  created_at timestamptz not null default now()
);

create index if not exists contact_rate_limits_hash_idx
  on public.contact_rate_limits (ip_hash, created_at desc);

alter table public.contact_rate_limits enable row level security;
-- No policies: with row-level security on, that refuses every direct query
-- from the browser roles. The grants below close the same door a second time.
revoke all on public.contact_rate_limits from anon, authenticated;

create or replace function public.check_contact_rate(
  p_ip_hash text,
  p_limit integer default 5,
  p_window interval default interval '1 hour'
)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  recent integer;
begin
  if p_ip_hash is null or char_length(p_ip_hash) < 16 then
    raise exception 'a keyed hash is required';
  end if;

  -- One sender at a time, so two requests at once can't both squeeze in under the limit.
  perform pg_advisory_xact_lock(hashtextextended(p_ip_hash, 0));

  delete from public.contact_rate_limits where created_at < now() - interval '1 day';

  select count(*) into recent
  from public.contact_rate_limits
  where ip_hash = p_ip_hash and created_at > now() - p_window;

  if recent >= p_limit then
    return false;
  end if;

  insert into public.contact_rate_limits (ip_hash) values (p_ip_hash);
  return true;
end;
$$;

revoke all on function public.check_contact_rate(text, integer, interval) from public, anon, authenticated;
grant execute on function public.check_contact_rate(text, integer, interval) to service_role;
