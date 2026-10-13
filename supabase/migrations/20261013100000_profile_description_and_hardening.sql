-- 1) A short description on the profile.
alter table profiles
  add column if not exists description text check (description is null or char_length(description) <= 140);

-- 2) A name must have a real length (spaces, tabs and line breaks do not count).
--    Old rows first: the name used to be unchecked, and a default made from an email prefix
--    could be long. Anything out of range is shortened (or replaced if it is blank), so the
--    constraint can be a normal, fully validated one, and updating such a row later won't fail.
update profiles
set display_name = case
  when char_length(btrim(display_name, E' \t\r\n')) = 0 then 'Someone'
  else left(btrim(display_name, E' \t\r\n'), 40)
end
where char_length(btrim(display_name, E' \t\r\n')) not between 1 and 40;

alter table profiles drop constraint if exists profiles_display_name_length;
alter table profiles
  add constraint profiles_display_name_length
  check (char_length(btrim(display_name, E' \t\r\n')) between 1 and 40);

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
