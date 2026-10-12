-- An action is worth 1, 2 or 3 points. Enforced here and not only in the app:
-- any logged-in client can call the API directly, and without a ceiling someone
-- could log 1,000,000 points and wreck every balance in the group.
-- Re-runnable. Existing rows are all 1, so the check passes.
alter table entries drop constraint if exists entries_points_range;
alter table entries
  add constraint entries_points_range check (points between 1 and 3);
