# Attendify

<p align="center">
  <img src="public/attendify-favicon.png" alt="Attendify app icon" width="140" />
</p>

Attendify is a web-based attendance platform for school clubs and organizations. It supports club owner workflows for creating clubs and events, and member/public workflows for joining clubs, checking into events, and viewing club-specific attendance information.

## What This Project Is

From an interviewer or evaluator’s perspective, Attendify is a full-stack-style frontend application that demonstrates:

- role-based attendance workflows
- QR and invite-code driven club/event access
- Supabase-backed authentication and data access
- a modern React + TypeScript SPA architecture
- production build tooling with Vite

## What The Repository Contains

- `src/pages/`: owner, member, join, check-in, dashboard, profile, and welcome flows
- `src/components/`: reusable UI, modal, map, layout, and form components
- `src/contexts/`: authentication and shared application state
- `src/utils/`: Supabase client setup and database migration helpers
- `database_schema.json` and `db_migration.sql`: backend schema reference and migration material
- Vite, Tailwind, and TypeScript configuration for the frontend build

## How It Works

Attendify is organized around two main user journeys:

1. Club owners authenticate, create/manage clubs and events, and generate join/check-in entry points.
2. Members or guests join clubs and attend events through invite codes, QR flows, and attendance screens.

Technically, the app is a React Router single-page application:

- `src/App.tsx` defines the route map for owner and public/member flows
- `src/contexts/AuthContext.tsx` manages Supabase session state
- `src/utils/supabaseClient.ts` initializes the Supabase client from Vite environment variables
- `src/main.tsx` boots the app, runs migration setup, and registers a service worker for PWA behavior

## Stack

- React 18
- TypeScript
- Vite 5
- Tailwind CSS
- Supabase
- React Router
- Ionic React components

## Required Environment Variables

Create a local `.env` from the template:

```bash
cp .env.example .env
```

Set the following values:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The repo no longer stores the Supabase anon key in source control. Without these values, the app can still compile, but live auth and database-backed flows will not function against a real backend.

## Run Locally

Install dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

## Verified During Cleanup

The following commands were run successfully during public-readiness cleanup:

```bash
npm ci
npm run dev
npm run build
npm run lint
```

`npm run lint` currently reports React Hooks / Fast Refresh warnings, but no errors.

## Notes For Evaluation

- The Tailwind config was renamed to `tailwind.config.cjs` so the project builds correctly in a `"type": "module"` package.
- Supabase auth token cleanup is now derived from the configured project instead of a hardcoded project reference.
- This public repo no longer includes agent-only markdown instruction files.
- `SECURITY.md`, Dependabot, and CodeQL were added for baseline public-repo monitoring.

## License

MIT
