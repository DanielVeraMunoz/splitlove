-- Editing an entry never updates it in place: the balances are computed from entries, so a
-- silent change of an old entry would silently rewrite a debt. Instead the old entry is voided
-- and a new one is inserted, linked to it. Everything happens in ONE transaction: either both
-- steps happen or none.
--
-- Clients cannot do this themselves (they can only set voided_at on their own entries), so it is
-- a security definer function that checks the rules by hand.

alter table entries add column if not exists replaces_entry_id uuid references entries(id);

create or replace function edit_entry(
  p_entry_id  uuid,
  p_label     text,
  p_category  text,
  p_points    integer,
  p_author_id uuid
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  old_entry entries%rowtype;
  new_id    uuid;
begin
  -- lock the row, so two edits at once can't both replace it
  select * into old_entry from entries where id = p_entry_id for update;

  -- Only whoever logged it, and only while it is still live. "is distinct from" so that a
  -- missing session (null) is never treated as a match.
  if not found
     or old_entry.created_by is distinct from auth.uid()
     or old_entry.voided_at is not null then
    raise exception 'cannot edit this entry' using errcode = 'EE001';
  end if;

  update entries set voided_at = now() where id = old_entry.id;

  -- The new row keeps the original date, so it stays where it was in the list. The table's
  -- checks (label length, 1 to 3 points, author must be a member) apply to it as usual.
  insert into entries (group_id, author_id, label, category, points, created_by, created_at, replaces_entry_id)
  values (old_entry.group_id, p_author_id, btrim(p_label), p_category, p_points, auth.uid(), old_entry.created_at, old_entry.id)
  returning id into new_id;

  return new_id;
end;
$$;

revoke execute on function edit_entry(uuid, text, text, integer, uuid) from public, anon;
grant  execute on function edit_entry(uuid, text, text, integer, uuid) to authenticated;
