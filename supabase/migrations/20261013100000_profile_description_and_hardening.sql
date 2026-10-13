-- 1) A short description on the profile.
alter table profiles
  add column if not exists description text check (description is null or char_length(description) <= 140);

-- 2) A name must have a real length. NOT VALID: it is enforced for every new write, without
--    failing the migration if an old row happened to be out of range.
alter table profiles drop constraint if exists profiles_display_name_length;
alter table profiles
  add constraint profiles_display_name_length
  check (char_length(btrim(display_name)) between 1 and 40) not valid;

-- 3) What a client may change. Before, the update policy had no WITH CHECK and the grant covered
--    every column, so a user could rewrite any field of their row, even its id.
--    Two layers, each enough on its own:
--    - column privilege: only display_name and description can be updated
--    - policy: only your own row, and it must still be yours afterwards
revoke update on profiles from authenticated;
grant update (display_name, description) on profiles to authenticated;

drop policy if exists "profiles: update own" on profiles;
create policy "profiles: update own" on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());
