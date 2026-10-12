# Splitlove

Mobile app (Expo + TypeScript + Expo Router + Supabase) to log who does what for
the group, as points. See `PLAN.md` for product decisions and `supabase/schema.sql`
for the data model.

## Language

- Chat with Dani in Spanish, explaining the *why* (Dani is a junior dev).
- Code, comments, commits, PR titles and issues in English.

## Git workflow

- Never commit directly to `main` after the initial setup. Flow:
  issue -> branch -> small commits -> PR -> review -> merge.
- Branch names: `feat/...`, `fix/...`, `chore/...`, `docs/...`, `refactor/...`.
- Commits follow Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`).
- Before merging a PR, run `/code-review` and make sure lint and typecheck pass.
- Merge with squash so `main` stays readable.

## Commands

- `npx expo start` - dev server (open with Expo Go)
- `npx expo lint` - lint
- `npx tsc --noEmit` - typecheck (known template errors about CSS imports in
  `animated-icon.web.tsx` and `theme.ts`; web only)
- Add dependencies with `npx expo install <pkg>`, never `npm install`.

## Rules of the domain

- Every entry is done **for the group**; it is charged in full to every other member.
  Debt between two members = difference of points done.
- `supabase/schema.sql` is the baseline; every later DB change is a new file in
  `supabase/migrations/` (14-digit timestamp prefix), written to be re-runnable.
  Dani applies them by hand in the Supabase SQL editor. Say so in the PR.
- Balances are computed (views), never stored.
- Entries are voided (`voided_at`), never deleted.
- Never commit secrets. Supabase keys live in `.env` (gitignored). The `anon` key
  is meant for the client; the `service_role` key must never reach the app or the repo.
