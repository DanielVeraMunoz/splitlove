-- 1) Validate group names in the database, not only in the app:
--    any logged-in client can call the API directly and skip the UI checks.
alter table groups
  add constraint groups_name_length check (char_length(btrim(name)) between 1 and 50);

-- 2) Stronger invite codes. The old md5(random()) code had only 32 bits and
--    random() is not meant for secrets. gen_random_uuid() uses a secure source;
--    12 hex chars = 48 bits. Retry in the unlikely case of a collision.
create or replace function create_group(p_name text, p_kind group_kind) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  gid uuid;
  attempt int := 0;
begin
  loop
    begin
      insert into groups (name, kind, invite_code, created_by)
      values (
        btrim(p_name),
        p_kind,
        substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
        auth.uid()
      )
      returning id into gid;
      exit;
    exception when unique_violation then
      attempt := attempt + 1;
      if attempt >= 5 then
        raise;
      end if;
    end;
  end loop;

  insert into group_members (group_id, user_id) values (gid, auth.uid());
  return gid;
end;
$$;
