-- Validate entry labels in the database too (any logged-in client can call the
-- API directly and skip the UI checks). Re-runnable.
alter table entries drop constraint if exists entries_label_length;
alter table entries
  add constraint entries_label_length check (char_length(btrim(label)) between 1 and 100);
