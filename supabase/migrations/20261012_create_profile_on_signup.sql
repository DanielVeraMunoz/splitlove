-- Create the profiles row automatically when someone signs up.
-- Needed because groups.created_by and group_members.user_id reference profiles(id).
-- Runs as security definer: the new user has no session yet, so RLS would block the insert.

create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();
