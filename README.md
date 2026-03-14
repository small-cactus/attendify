# Attendify

<p align="center">
  <img src="src/assets/attendify-logo.png" alt="Attendify logo" width="220" />
</p>

<p align="center">
  Club administration, member onboarding, and event check-in in one React and Supabase application.
</p>

## Quick Start

1. Create your local environment file.

   ```bash
   cp .env.example .env
   ```

2. Add your Supabase project values.

   ```bash
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   ```

3. Install dependencies.

   ```bash
   npm ci
   ```

4. Start the app.

   ```bash
   npm start
   ```

5. Open the local Vite URL shown in the terminal.

## What This Project Does

Attendify is a single-page web app for running clubs and tracking attendance without splitting the product into separate admin and participant applications. The same frontend handles:

- club owner authentication and administration
- member join flows driven by invite codes
- member dashboards backed by local browser state
- event check-in links and QR entry points
- attendance rules such as event windows and location-aware validation

The codebase is organized so the route a user sees depends on their role and on the state already stored in the browser.

## Quick Architecture

| Path | Purpose |
| --- | --- |
| `src/App.tsx` | Top-level route map for owner, member, and public entry points |
| `src/pages/Entry.tsx` | First-route decision layer that redirects users into the correct flow |
| `src/contexts/AuthContext.tsx` | Supabase auth session management for club owners |
| `src/pages/Clubs.tsx` | Owner-facing list of clubs tied to the authenticated account |
| `src/pages/ClubDetail.tsx` | Club management, event creation, invite codes, and QR surfaces |
| `src/pages/ClubJoinPage.tsx` | Invite-code join flow that creates or reuses a member identity |
| `src/pages/Dashboard.tsx` | Member-facing dashboard built from joined clubs and upcoming events |
| `src/pages/EventCheckinPage.tsx` | Event attendance flow with invite-code lookup and attendance submission |
| `src/utils/supabaseClient.ts` | Supabase client bootstrap from Vite environment variables |
| `src/utils/dbMigrations.ts` | Startup migration helpers used to prepare member UUID support |

## How The Application Works

### Routing model

`src/App.tsx` defines one router with owner, member, and public routes:

| Route | Role |
| --- | --- |
| `/` | Entry router that decides where the user should land |
| `/clubs` and `/clubs/:clubId` | Owner dashboard and per-club management |
| `/join` and `/join/:clubId` | Member onboarding through invite codes |
| `/dashboard` | Member-facing view of joined clubs and events |
| `/attend` and `/checkin/:inviteCode` | Attendance flow for direct check-in |
| `/events/:inviteCode/checkin-qr` | QR page that points people into the check-in route |

### Dual state model

Attendify uses two forms of state together:

- Supabase auth sessions for club owners
- browser `localStorage` for member identities and joined-club data

`src/pages/Entry.tsx` reads those signals to route a user into the right experience. Member state is stored with keys such as `attendify_clubs`, `attendify_member_id`, and `owner_confirmed`, which lets a returning member go straight back to their dashboard or check-in flow.

### Owner workflow

Owners authenticate through `AuthContext` and manage their clubs through Supabase-backed pages. `src/pages/Clubs.tsx` resolves ownership through the `club_owners` table, then loads the linked club records. `src/pages/ClubDetail.tsx` expands that into operational tooling for:

- viewing club details
- managing members
- creating and editing events
- generating invite codes
- opening QR-based entry pages for join and check-in flows

### Member workflow

The member path is intentionally lightweight. `src/pages/ClubJoinPage.tsx` accepts an invite code, looks up the club, creates or reuses a `member_uuid`, and stores the resulting membership locally. `src/pages/Dashboard.tsx` then combines those stored memberships with live event data so a member can see where they belong and what they can attend next.

### Event check-in

`src/pages/EventCheckinPage.tsx` is the attendance engine. It can start from a plain `/attend` route or from a direct invite-code URL. The screen coordinates:

- event lookup by invite code
- member identification and reuse of the stored member UUID
- optional name matching when a member record already exists
- event timing rules
- location-aware attendance rules
- submission of the final check-in record

`src/pages/EventCheckinQR.tsx` generates QR entry points that turn an event invite code into a scannable handoff.

### Database preparation

`src/main.tsx` calls `setupDatabase()` before rendering the app. That startup path lives in `src/utils/dbMigrations.ts` and is responsible for ensuring the `members` table supports the `member_uuid` field used by the join and check-in flows.

### PWA behavior

`src/main.tsx` also registers `sw.js`, so the app ships with service-worker support in the frontend bootstrap.

## Environment

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key used by the frontend client |

The repository includes `database_schema.json` and `db_migration.sql` as supporting schema references for setting up the backend side of the application.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Start the Vite development server |
| `npm run build` | Type-check and build the production bundle |
| `npm run lint` | Run ESLint across the project |
| `npm run preview` | Serve the production build locally |

## Stack

- React 18
- TypeScript
- Vite 5
- React Router
- Supabase
- Tailwind CSS
- Ionic React
- Framer Motion

## License

MIT
