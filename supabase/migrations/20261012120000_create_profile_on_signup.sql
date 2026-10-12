-- Create the profiles row automatically when someone signs up.
-- Needed because groups.created_by and group_members.user_id reference profiles(id).
-- Runs as security definer: the new user has no session yet, so RLS would block the insert.

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name)
  values (
    new.id,
    -- name from the signup form, else the email prefix, else a placeholder
    -- (display_name is NOT NULL and some signups have no email)
    coalesce(
      nullif(new.raw_user_meta_data->>'display_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Someone'
    )
  );
  return new;
end;
$$;

-- Only the trigger should run this, never a client.
revoke execute on function handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();
