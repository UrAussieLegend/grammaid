# Grammaid

AI writing aid for storytellers. Sign in, create a project, paste or upload your manuscript, and get a
full craft breakdown — structure, characters, pacing, dialogue, prose, POV, theme, readability — each
scored with strengths, issues, suggestions, and line-level edits.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- NextAuth (email/password + Google) with Prisma adapter
- Prisma + SQLite (swap the datasource for Postgres in production)
- OpenAI for narrative analysis, with a built-in heuristic engine as fallback

## Features

- **Auth** — email/password signup and login; "Continue with Google" appears automatically when
  `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set.
- **Projects** — one manuscript per project with genre, audience, synopsis, and analysis history.
- **Input** — paste text directly or upload/drag-drop `.docx`, `.txt`, `.md`, `.rtf`, `.html`.
- **Analysis options** — 12 toggleable craft aspects, feedback tone, depth, intended POV/tense,
  spelling variant, line edits, example rewrites, comparable titles, preserve-voice, custom brief,
  and model selection. Defaults are saved per user in Preferences.
- **Reports** — overall score, per-aspect scores with expandable detail, text statistics
  (readability, sentence variety, dialogue ratio, adverb density), line edits with severity, and a
  revision plan. Every run is stored so versions can be compared.
- **Admin panel** — instance stats (users, projects, analyses, tokens, words), configuration status,
  and user management (promote/demote, ban/unban, delete). The first account created is an admin;
  additional admins can be seeded with `ADMIN_EMAILS`.
- **UI** — glass surfaces, aurora background, subtle animations, and light/dark/system themes.

## Local development

```bash
npm install
cp .env.example .env        # set at least DATABASE_URL and NEXTAUTH_SECRET
npx prisma migrate dev
npm run dev
```

The app runs at http://localhost:3000. Without `OPENAI_API_KEY`, analyses run on the local heuristic
engine (real text statistics and line edits, no narrative interpretation).

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Prisma connection string (`file:./dev.db` for SQLite) |
| `NEXTAUTH_SECRET` | yes in prod | Session encryption (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | yes in prod | Public base URL |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | no | Enables Google sign-in |
| `OPENAI_API_KEY` | no | Enables AI analysis |
| `ADMIN_EMAILS` | no | Comma-separated emails granted admin on signup |
