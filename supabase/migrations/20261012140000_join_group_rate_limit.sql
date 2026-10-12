-- Invite codes act like a password for the group, so limit guessing:
-- max 5 failed codes per user in 15 minutes. Done in the database because
-- a limit in the app is trivial to bypass by calling the API directly.

-- Idempotent on purpose: safe to re-run if it was already applied once.
create table if not exists join_failures (
  user_id      uuid not null references profiles(id) on delete cascade,
  attempted_at timestamptz not null default now()
);

create index if not exists join_failures_user_idx on join_failures (user_id, attempted_at desc);

-- RLS on and no policies/grants: clients can never read or write this table.
-- Only join_group (security definer) touches it.
alter table join_failures enable row level security;

-- Returns the group id, or NULL if the code doesn't exist.
-- It must NOT raise on a wrong code: an exception rolls back the whole call,
-- including the failure we just recorded, and the limit would never kick in.
create or replace function join_group(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  gid uuid;
  recent_failures int;
begin
  -- Serialize this user's calls. Without it, 200 parallel requests would all
  -- count 0 recent failures before any of them records its own, bypassing the limit.
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));

  -- housekeeping; limited to this user's rows so the index can serve it
  delete from join_failures
  where user_id = auth.uid() and attempted_at < now() - interval '1 day';

  select count(*) into recent_failures
  from join_failures
  where user_id = auth.uid() and attempted_at > now() - interval '15 minutes';

  if recent_failures >= 5 then
    raise exception 'too_many_attempts' using errcode = 'JG001';
  end if;

  select id into gid from groups where invite_code = lower(btrim(p_code));

  if gid is null then
    insert into join_failures (user_id) values (auth.uid());
    return null;
  end if;

  insert into group_members (group_id, user_id) values (gid, auth.uid())
  on conflict do nothing;
  return gid;
end;
$$;
