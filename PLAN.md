# Splitlove

Splitwise, but for love (and for chores). Users log things they do for each other
as points; the app shows who owes whom. Deliberately **neutral**: it can be a satire
of the commodification of love or a tool to make unpaid domestic labour visible.
Each group decides how to use it (like Telegram: not our responsibility).

## Product decisions

- Mobile only (iOS + Android).
- A user has one account and can belong to **several groups**.
- On creating a group the app asks "what are you?": couple, flatmates, throuple,
  family, lovers, other. (Only changes suggested actions/texts, never the rules.)
- Everyone in a group sees the same shared ledger and **everyone can add entries**.
- The list works like Splitwise: entries grouped by month, each with a category icon.
- Every action is **done for the group** (no per-person receiver): "Dani loaded the
  dishwasher". The action is charged **in full to every other member** (never split):
  Andres cleans the bathrooms (1 pt) -> Gorka owes Andres 1, Fulanito owes Andres 1.
  Between two people the debt is the difference in points: Dani 5, Isaac 2 -> Isaac owes Dani 3.
- It is an **eternal scoreboard**: no "settle up" button. You "pay" by doing more things.
- Categories are **auto-detected from the text** (keyword dictionary, like Splitwise):
  typing "cena" suggests the food category and icon. The user can change it.
- 1 action = 1 point for now.

## Free vs Premium

**Not in this phase.** Everyone gets the same app for now. Later: custom points,
custom actions and a daily entry limit (enforced server-side).

## Stack

Expo (React Native) + TypeScript + Expo Router, Supabase (Postgres, auth, RLS),
RevenueCat for subscriptions in a later phase. Schema: `supabase/schema.sql`.

Key design choices (and why):
- **Balances are computed from entries** (`member_points` / `pair_debts` views), never stored,
  so they can never get out of sync.
- **Entries are voided, never deleted**, so the history stays auditable.
- **Row Level Security** in the database: a user can only read/write groups they
  belong to, even if the app has a bug.

## Roadmap

1. **MVP**: auth, create/join group (invite code), fixed catalogue, add entry,
   Splitwise-style balance summary, history, void entry.
2. **Personality**: Duolingo-like animations/streaks, satirical copy.
3. **Awareness layer**: chore distribution chart, weekly summary.
4. **Premium**: custom points/actions, daily limit, RevenueCat.

## Git workflow (Claude drives it)

Issue -> branch -> small commits (Conventional Commits, in English) -> PR -> review
-> merge, all done by Claude on request. Dani reviews the result and learns from the PRs.

## Working agreement

Hybrid approach: data model, rules and screen flow are decided together and
understood by Dani; boilerplate and styling are generated and reviewed.
If you can't explain what a piece of code does, we go over it before moving on.

## Next steps

- [ ] Create Supabase project, run `supabase/schema.sql`
- [ ] Add `@supabase/supabase-js`, env vars, auth screen
- [ ] Group creation screen (name + kind)
- [ ] Add-entry flow and balance summary
