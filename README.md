# Humraah web

Higher-education guidance for girls in Pakistan: what to study, where, and how to pay for it.
_Har raah mein Humraah._

**Stack:** Next.js 15 (App Router, TypeScript) · Tailwind CSS 4 · Supabase (Postgres + Auth) · Vercel
**Design:** [Figma – Humraah Website Design (v0.1)](https://www.figma.com/design/npSm1HQ8escFnOZ0a43vfO)

## Run it locally

Needs Node 20.9 or newer.

```bash
npm install
cp .env.example .env.local   # then fill in the dev Supabase URL and anon key
npm run dev                  # http://localhost:3000
```

Without `.env.local` the site still runs and shows a "database isn't connected" note.

## Scripts

| Command                | What it does                                                         |
| ---------------------- | -------------------------------------------------------------------- |
| `npm run dev`          | Local dev server                                                     |
| `npm run build`        | Production build (what Vercel runs)                                  |
| `npm run lint`         | ESLint                                                               |
| `npm run typecheck`    | TypeScript                                                           |
| `npm run format`       | Prettier (also sorts Tailwind classes)                               |
| `npm run test:db`      | Applies every migration + seed to an in-memory Postgres and checks the access rules for each role |
| `npm run test:theme`   | Checks WCAG AA contrast of every colour pair in both themes, and that the theme script sets the theme before first paint |
| `npm run db:types`     | Regenerates `src/lib/database.types.ts` from the linked Supabase project |

CI runs lint, type-check, format check, the access-rule tests and the build on every pull request.

## Light and dark theme

Colours are tokens in `src/app/globals.css`; the dark values are one block (`:root[data-theme="dark"]`) that overrides the same names, so components don't change. `data-theme` on `<html>` is set before first paint by a fixed inline script (`src/lib/theme/script.ts`), from the saved choice (localStorage `humraah-theme`) or else the device setting. Text on the coral, sage and lavender fills uses `text-ink`, which stays dark in both themes.

**For the Content-Security-Policy (Day 6):** the theme script is inline. Allow it by hash, not a nonce (a nonce would make every page render per request): add `THEME_SCRIPT_CSP_SOURCE` from `src/lib/theme/hash.ts` to `script-src`.

## Database

Migrations live in `supabase/migrations`, seed data in `supabase/seed.sql`.

```bash
npx supabase login                         # once, opens the browser
npx supabase link --project-ref <dev-ref>  # humraah-dev
npx supabase db push                       # apply new migrations
```

Content moves **draft → published → archived**. The public site only ever sees published rows; row-level
security enforces this, not the app code.

| Role       | Can                                                                    |
| ---------- | ---------------------------------------------------------------------- |
| Researcher | Create, edit, mark verified, publish, unpublish, archive               |
| Admin      | All of the above + restore archived entries, delete permanently (archived entries only), manage researchers, read and manage contact messages |
| Owner      | All of the above + add or remove admins                                |

The team workspace edits universities, scholarships, fields of study, resources and guidance articles
the same way (a source link is needed to publish or verify; each has optional Urdu text). The messages
inbox at `/admin/messages` is for admins and the owner only, because contact messages hold visitors'
personal details; researchers can't read them, and nobody can edit or delete one.

Every change to content or the team is written to `activity_log` by a database trigger.

Seed content comes from Humraah's Higher Education Guide and is **unverified**: researchers must check each
entry on the official website, add the source link and mark it verified before launch.

## Working together

1. Branch from `main` (`feature/universities-list`), one page or feature per pull request.
2. Open a PR. Vercel posts a preview link; CI must pass.
3. Talha tests the preview against Figma and the checklist in the PR template, files bugs as issues with the
   `qa` label, and approves.
4. Squash and merge. `main` deploys to production.

`main` is protected: no direct pushes, 1 approval, conversations resolved, squash merge only.

## Project layout

```
src/app/            routes (one folder per page)
src/app/fonts/      self-hosted brand fonts (SIL Open Font License)
src/components/     brand/ (logo) · layout/ (header, footer, bottom bar)
src/lib/            nav, Supabase clients, data access, database types
public/brand/       logo SVGs exported from Figma
supabase/           config, migrations, seed, access-rule tests
```
