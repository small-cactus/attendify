# Attendify

<p align="center">
  <img src="public/attendify-favicon.png" alt="Attendify app icon" width="140" />
</p>

Attendify is a React + TypeScript web application for club management and event attendance. It combines owner-facing club administration with member/public join and check-in flows, all inside a single routed SPA backed by Supabase.

## Repository Layout

- `src/App.tsx` defines the route structure for owner, member, and public flows.
- `src/pages/` contains the main product surfaces: entry routing, login, clubs, club detail, profile, join flows, dashboard, and event check-in pages.
- `src/contexts/AuthContext.tsx` manages Supabase session state and sign-in/sign-up/sign-out behavior.
- `src/utils/supabaseClient.ts` initializes the Supabase client from Vite environment variables.
- `src/utils/dbMigrations.ts` contains application-side migration/setup logic that attempts to prepare required database behavior at runtime.
- `src/components/` contains the reusable UI and workflow pieces such as layout, create-club/event modals, maps, date/time selection, and debug UI.
- `database_schema.json` and `db_migration.sql` provide schema and migration reference material.

## Application Model

Attendify is not split into separate apps for admins and members. Instead, one React Router application handles multiple user states:

- unauthenticated visitors
- authenticated club owners
- local-storage-backed club members
- event check-in visitors using invite codes or QR links

The root `Entry` page decides where to send a user based on two things:

- whether a Supabase-authenticated owner session exists
- whether local club membership data already exists in `localStorage`

That means the app is using both remote auth state and client-side persisted membership state to determine the user’s path through the product.

## Main Flows

### 1. Club owner flow

Authenticated owners are routed into the owner experience:

- `/clubs` lists clubs owned by the current user
- owners can create clubs and related records through Supabase inserts
- club detail and QR-related routes support join/check-in entry points
- owner auth is managed through `AuthContext` and Supabase auth APIs

`src/pages/Clubs.tsx` shows that owner club membership is resolved through the `club_owners` table and then expanded into club records.

### 2. Member / participant flow

Members are not modeled only as a traditional authenticated user session. The app also stores membership information locally:

- `attendify_clubs`
- `attendify_member_id`
- `owner_confirmed`

This enables the “dashboard” and join/check-in experience to work with member-specific local state even when the user is not acting as a club owner.

### 3. Event check-in flow

`src/pages/EventCheckinPage.tsx` is one of the more involved screens in the repo. It handles:

- invite-code based event lookup
- club member name matching
- optional location-aware check-in rules
- QR-based event entry points
- time-window restrictions for check-in
- local member identity reuse through stored member UUID and club memberships

This is more than a simple attendance form. The page combines event lookup, geolocation verification, member lookup/suggestions, and attendance submission in a single workflow.

### 4. Database setup and migrations

`src/main.tsx` calls `setupDatabase()` on app startup.

That setup path is defined in `src/utils/dbMigrations.ts`, which attempts to create or invoke RPC-based migration helpers related to the `members` table and `member_uuid` handling. In other words, part of the application expects certain backend migration helpers to exist or be creatable when the app starts.

## Stack

- React 18
- TypeScript
- Vite 5
- React Router
- Supabase
- Tailwind CSS
- Ionic React components
- Framer Motion

## Environment Variables

Create a local `.env` from the template:

```bash
cp .env.example .env
```

Required values:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The application now reads these values from the environment instead of committing them directly in source. Without them, the app can render and compile, but live Supabase-backed auth and data operations will not work.

## Run Locally

Install dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run lint checks:

```bash
npm run lint
```

## Verified Commands

The following commands were run successfully against this repository:

```bash
npm ci
npm run dev
npm run build
npm run lint
```

`npm run lint` currently reports React Hooks / Fast Refresh warnings, but no errors.

## Notes

- The app uses both Supabase auth state and browser `localStorage` state to drive routing and role-specific behavior.
- `tailwind.config.cjs` is intentionally CommonJS so the project builds correctly inside a `"type": "module"` package.
- The current database setup path assumes supporting Supabase tables/RPC behavior exist for the runtime migration helpers in `src/utils/dbMigrations.ts`.
- `src/main.tsx` also registers a service worker, so the app includes basic PWA behavior.

## License

MIT
