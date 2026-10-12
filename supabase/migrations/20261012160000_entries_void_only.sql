-- The only thing a client may do to an existing entry is VOID it.
-- Before this, the update policy let the creator change ANY column (author_id,
-- points, label, created_at) and even un-void it, which would rewrite the history
-- the balances are computed from. Two layers, so either one alone is enough:
--
-- 1) Column privilege: clients can update voided_at and nothing else.
-- 2) Policy: only the creator, only on a not-yet-voided entry, and the result
--    must be voided (no un-voiding).

revoke update on entries from authenticated;
grant update (voided_at) on entries to authenticated;

drop policy if exists "entries: creator voids" on entries;
create policy "entries: creator voids" on entries for update
  using (created_by = auth.uid() and voided_at is null)
  with check (created_by = auth.uid() and voided_at is not null);
