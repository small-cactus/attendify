# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Attendify is a modern attendance tracking platform for school clubs and organizations built with React, TypeScript, and Supabase. It provides features for managing clubs, events, members, and tracking attendance with location-based verification.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:5173)
npm run dev

# Build for production (runs TypeScript check then Vite build)
npm run build

# Preview production build locally
npm run preview

# Run ESLint
npm run lint
```

## Architecture & Code Structure

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite
- **Routing**: React Router v7 with file-based routing in `/src/pages/`
- **State Management**: React Context API (see `/src/contexts/AuthContext.tsx`)
- **Styling**: Tailwind CSS with custom theme + shadcn/ui components
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Custom components in `/src/components/` with shadcn/ui base components in `/src/components/ui/`

### Backend Services
- **Supabase**: Handles authentication, database (PostgreSQL), and file storage
- **Database Schema**: Complex relational structure with tables for:
  - Users, clubs, events, members, attendance records
  - Authentication (identities, sessions, mfa)
  - Storage (buckets, objects)
  - Audit logging and flow states

### Key Technical Patterns

1. **Authentication Flow**:
   - AuthContext provides user state and auth methods
   - Protected routes check authentication status
   - Supabase handles session management

2. **Data Fetching**:
   - Direct Supabase client calls in components
   - No centralized data fetching layer or caching
   - Real-time subscriptions available but not extensively used

3. **Location Features**:
   - Geolocation utilities in `/src/utils/geolocation.ts`
   - Used for event check-in verification
   - Integrates with Leaflet for map displays

4. **Component Structure**:
   - Pages handle routing and data fetching
   - Components are mostly presentational
   - UI components follow shadcn/ui patterns with Radix UI primitives

### Important Implementation Details

1. **Path Aliases**: TypeScript configured with `@/*` alias pointing to `/src/*`

2. **Deployment**: Configured for Vercel with SPA routing (see `vercel.json`)

3. **No Testing Framework**: Currently no unit or E2E tests configured

4. **Database Migrations**: Utility exists at `/src/utils/dbMigrations.ts` but implementation details vary

5. **File Uploads**: Supabase storage buckets configured for club and user avatars

6. **Analytics**: Vercel Analytics and Speed Insights integrated

## Common Development Tasks

When working on new features:
1. Check existing patterns in similar components
2. Use the established UI component library (shadcn/ui)
3. Follow the existing file structure (pages in `/src/pages/`, components in `/src/components/`)
4. Maintain TypeScript strict mode compliance
5. Use Tailwind classes for styling, avoid inline styles

When debugging:
1. Check browser console for Supabase errors
2. Verify authentication state in AuthContext
3. Check network tab for failed API calls
4. Ensure environment has correct Supabase credentials

## Code Style Guidelines

- TypeScript with strict mode enabled
- React functional components with hooks
- Tailwind CSS for styling with custom theme extensions
- ESLint configured for React and TypeScript
- Path imports using `@/` alias
- Form validation using React Hook Form + Zod

## Performance Fixes Applied

### Animation Flicker Fix (Clubs Page - December 2024)

**Problem**: Cards/list items had visible flicker during fade-in animations, appearing briefly then jumping to new position before animating properly.

**Root Causes Identified**:
1. **AuthContext creating new objects**: `useAuth()` was creating new user objects on every render even when data was identical
2. **Framer Motion animation conflicts**: Complex animation state dependencies caused restart cycles
3. **Excessive re-renders**: Component rendered 15+ times instead of ~5 legitimate renders

**Solutions Applied**:

1. **Fixed AuthContext Performance** (`/src/contexts/AuthContext.tsx`):
   ```tsx
   // Memoize user object to prevent recreation with identical data
   const stableUser = useMemo(() => {
     return user;
   }, [user?.id, user?.email, user?.created_at]);

   // Memoize context value to prevent unnecessary re-renders
   const contextValue = useMemo(() => ({
     user: stableUser,
     loading,
     signUp,
     signIn,
     signOut
   }), [stableUser, loading]);

   // Memoize functions to prevent recreation
   const signUp = useCallback(async (email: string, password: string) => {
     // ... implementation
   }, []);
   ```

2. **Replaced Framer Motion with CSS Transitions**:
   ```tsx
   // Before: Complex Framer Motion (caused restarts)
   <motion.div
     initial={{ opacity: 0, y: 20 }}
     animate={{ opacity: shouldAnimate ? 1 : 0 }}
     transition={{ duration: 0.3, delay: index * 0.08 }}
   >

   // After: Pure CSS transitions (stable)
   <div
     style={{
       opacity: shouldAnimate ? 1 : 0,
       transition: `opacity 300ms ease-out ${shouldAnimate ? index * 80 : 0}ms`
     }}
     className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
   >
   ```

3. **Optimized State Management**:
   ```tsx
   // Memoize filtered arrays to prevent recreation
   const filteredClubs = useMemo(() => {
     return clubs.filter(club =>
       club.name.toLowerCase().includes(searchQuery.toLowerCase())
     );
   }, [clubs, searchQuery]);

   // Use refs to prevent useEffect re-runs
   const isFetchingRef = useRef(false);
   
   // Batch state updates with startTransition
   startTransition(() => {
     setClubs(data);
     setError(null);
     setFetching(false);
   });
   ```

**Results**:
- ✅ Eliminated animation flicker completely
- ✅ Reduced renders from 15+ to ~5 legitimate renders
- ✅ Improved performance across all pages using AuthContext
- ✅ Stable, smooth fade-in animations

**Apply These Patterns When**:
- List items flicker during animations
- Components re-render excessively (use debug logging to identify)
- Framer Motion animations restart unexpectedly
- Context values cause unnecessary re-renders

**Debugging Tools Created**:
- Debug panel component for tracking render causes
- Render cause detection using `useRef` for previous values comparison
- AuthContext call frequency tracking