-- Splitlove schema (Supabase / Postgres)
-- Run in the Supabase SQL editor. Order matters: tables -> views -> helpers -> RLS -> RPCs.

-- ---------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------

create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at   timestamptz not null default now()
);

create type group_kind as enum (
  'couple', 'flatmates', 'throuple', 'family', 'lovers', 'other'
);

create table groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  kind        group_kind not null default 'other',
  invite_code text not null unique,
  created_by  uuid not null references profiles(id),
  created_at  timestamptz not null default now()
);

create table group_members (
  group_id  uuid not null references groups(id) on delete cascade,
  user_id   uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- One row = "author did <label> for the group" (like a Splitwise expense).
-- There is no receiver: every action is done for the whole group.
-- author_id is who DID it; created_by is who LOGGED it (they can differ:
-- Dani can log "Isaac picked up the kids").
-- Rows are never deleted: they are voided, so the history stays auditable.
create table entries (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references groups(id) on delete cascade,
  author_id  uuid not null,
  label      text not null,
  category   text not null default 'other', -- validated in the app (so adding categories needs no migration)
  points     integer not null default 1 check (points > 0),
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  voided_at  timestamptz,
  foreign key (group_id, author_id) references group_members(group_id, user_id)
);

create index entries_group_idx on entries (group_id, created_at desc);

-- ---------------------------------------------------------------
-- Balances are computed, never stored (so they can't get out of sync).
-- Rule: an action is charged IN FULL to every other member (no splitting).
-- So between two members the debt is just the difference in points done:
--   Dani did 5, Isaac did 2  ->  Isaac owes Dani 3.
-- ---------------------------------------------------------------

create view member_points as
select
  m.group_id,
  m.user_id,
  coalesce(sum(e.points) filter (where e.voided_at is null), 0)::int as points_done
from group_members m
left join entries e on e.group_id = m.group_id and e.author_id = m.user_id
group by m.group_id, m.user_id;

-- One row per (creditor, debtor) with a positive debt.
create view pair_debts as
select
  a.group_id,
  a.user_id as creditor_id,
  b.user_id as debtor_id,
  a.points_done - b.points_done as points
from member_points a
join member_points b on b.group_id = a.group_id and b.user_id <> a.user_id
where a.points_done > b.points_done;

alter view member_points set (security_invoker = true);
alter view pair_debts    set (security_invoker = true);

-- ---------------------------------------------------------------
-- RLS: you only see and touch groups you belong to.
-- security definer avoids infinite recursion on group_members' own policy.
-- ---------------------------------------------------------------

create function is_group_member(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from group_members where group_id = gid and user_id = auth.uid()
  );
$$;

alter table profiles      enable row level security;
alter table groups        enable row level security;
alter table group_members enable row level security;
alter table entries       enable row level security;

create policy "profiles: read own and groupmates" on profiles for select using (
  id = auth.uid() or exists (
    select 1 from group_members me
    join group_members other on other.group_id = me.group_id
    where me.user_id = auth.uid() and other.user_id = profiles.id
  )
);
create policy "profiles: insert own" on profiles for insert with check (id = auth.uid());
create policy "profiles: update own" on profiles for update using (id = auth.uid());

create policy "groups: members read" on groups for select using (is_group_member(id));

create policy "members: read same group" on group_members for select using (is_group_member(group_id));
create policy "members: leave" on group_members for delete using (user_id = auth.uid());

create policy "entries: members read" on entries for select using (is_group_member(group_id));
create policy "entries: members insert" on entries for insert with check (
  is_group_member(group_id) and created_by = auth.uid()
);
-- Only whoever logged an entry can void it (that's the only allowed update).
create policy "entries: creator voids" on entries for update using (created_by = auth.uid());

-- ---------------------------------------------------------------
-- RPCs: creating/joining a group touches several tables at once,
-- so it runs server-side as a single atomic step.
-- ---------------------------------------------------------------

create function create_group(p_name text, p_kind group_kind) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  gid uuid;
begin
  insert into groups (name, kind, invite_code, created_by)
  values (p_name, p_kind, substr(md5(random()::text), 1, 8), auth.uid())
  returning id into gid;

  insert into group_members (group_id, user_id) values (gid, auth.uid());
  return gid;
end;
$$;

create function join_group(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  gid uuid;
begin
  select id into gid from groups where invite_code = p_code;
  if gid is null then
    raise exception 'invalid invite code';
  end if;

  insert into group_members (group_id, user_id) values (gid, auth.uid())
  on conflict do nothing;
  return gid;
end;
$$;

-- ---------------------------------------------------------------
-- Grants: "automatically expose new tables" is disabled in Supabase,
-- so we choose by hand what the logged-in role can do. RLS then filters rows.
-- ---------------------------------------------------------------

grant usage on schema public to authenticated;

grant select, insert, update on profiles      to authenticated;
grant select                 on groups        to authenticated;
grant select, delete         on group_members to authenticated;
grant select, insert, update on entries       to authenticated;
grant select                 on member_points, pair_debts to authenticated;

revoke execute on function create_group(text, group_kind), join_group(text) from public, anon;
grant  execute on function create_group(text, group_kind), join_group(text) to authenticated;
