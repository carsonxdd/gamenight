# Gamers in Heaven — Rebrand Implementation Checklist

## Context

This project was previously called "Caplan Game Night" / "Caplan's Game Night." It is being rebranded to **Gamers in Heaven** across all user-facing surfaces, and the internal codebase is being updated from `gameNight` / `GameNight` naming to `event` / `Event` naming for consistency.

**Tech stack:** Next.js, Prisma (PostgreSQL via Supabase), Railway, Cloudflare, Discord bot (discord.js)

**Two phases:**
- Phase 1: UI/brand rebrand (low-risk, no database changes)
- Phase 2: Internal code rename (database migration + full codebase refactor)

**Do Phase 1 first. Ship it. Then do Phase 2 as a separate PR.**

---

## Phase 1: UI / Brand Rebrand

This phase changes ONLY what users see. No database migrations, no model renames, no function signature changes. Everything is find-and-replace in UI copy, components, and config.

### 1.1 — Global Brand Name

- [ ] **Site title / `<title>` tag:** Change to `Gamers in Heaven`
- [ ] **`next.config.js` or layout metadata:** Update `title`, `description`, `og:title`, `og:site_name` to `Gamers in Heaven`
- [ ] **Meta description:** Update to: `"Gamers in Heaven: Organize gaming events, tournaments, and epic sessions with your squad."`
- [ ] **Favicon / og:image alt text:** Update any alt text or title attributes referencing the old name

### 1.2 — Navbar

- [ ] **Logo text:** Change to `GiH`
- [ ] **Logo link alt text / aria-label:** Update to `Gamers in Heaven`
- [ ] **Any tooltip on logo hover:** Update to `Gamers in Heaven`

### 1.3 — Landing Page / Hero

- [ ] **Hero title:** Change from `Caplan Game Night` / `Caplan's Game Night` to `Gamers in Heaven`
- [ ] **Hero subtitle:** Review and update if it references "game night" — reword to reference "events" or "sessions" as appropriate
- [ ] **CTA button text:** Keep `Join Now` or `Join Gamers in Heaven` — confirm which is used and update if needed

### 1.4 — Auth / Signup Pages

- [ ] **Signup page title/heading:** Change to `Join Gamers in Heaven`
- [ ] **Login page:** Update any branding text to `Gamers in Heaven`
- [ ] **Discord OAuth callback pages:** Update any welcome text or branding

### 1.5 — "Game Night" → "Event" Terminology (UI Copy Only)

This is the big find-and-replace pass. Search the entire `src/` directory for these patterns in JSX, string literals, and comments that render to users:

- [ ] **`+ New Game Night` button:** Change to `+ New Event`
- [ ] **`Create Game Night` modal title:** Change to `Create Event`
- [ ] **`Edit Game Night` modal title:** Change to `Edit Event`
- [ ] **InfoBubble / help text:** Update to match new button label. Example: `Use the "+ New Event" button to submit a public event.`
- [ ] **Schedule page subtitle:** Change to `Upcoming events` (lowercase "events")
- [ ] **Any toast messages** referencing "game night" (e.g., "Game night created successfully") → `Event created successfully`
- [ ] **Any confirmation dialogs** (e.g., "Delete this game night?") → `Delete this event?`
- [ ] **Any empty state text** (e.g., "No game nights scheduled") → `No events scheduled`
- [ ] **Email templates / Discord bot messages** that say "game night" → `event`

### 1.6 — Highlights / Media Gallery

- [ ] **Section title or subtitle:** Change to `Epic moments from the squad`
- [ ] **Any card labels** referencing "game night highlights" → `highlights` or `epic moments`

### 1.7 — About Page

- [ ] **Add ISunny credit in the story section:** Add a line like: `Special shoutout to ISunny for the name inspiration behind Gamers in Heaven.`
- [ ] **DO NOT change** narrative references to "game night" in the story/history section — these are historical context and read correctly as-is
- [ ] **DO NOT change** version history / changelog entries — they should reflect what the app was called at the time

### 1.8 — Footer

- [ ] **Copyright text:** Change to `© 2026 Gamers in Heaven`
- [ ] **Any footer links or branding text** referencing the old name

### 1.9 — Members Page

- [ ] **Any heading or subtitle** referencing "game night" in the members context

### 1.10 — Discord Bot Messages

- [ ] **Bot announcement templates:** Replace "game night" with "event" in all outgoing messages
- [ ] **Bot embed titles:** Update branding to `Gamers in Heaven`
- [ ] **Bot status / presence text:** Update if it displays a status message

### 1.11 — README / Repo Metadata

- [ ] **README.md title and description:** Update to `Gamers in Heaven`
- [ ] **package.json `name` field:** Update to `gamers-in-heaven` (this is cosmetic, no functional impact)
- [ ] **Any `.env.example` comments** referencing the old name

### 1.12 — Domain / Hosting (Manual — Not Code)

- [ ] **If domain changes:** Update Cloudflare DNS, Railway custom domain, and any hardcoded URLs
- [ ] **If domain stays `caplangamenight.com`:** That's fine — no action needed, the copyright and branding handle the rest

---

## Phase 2: Internal Code Rename

**Prerequisites:**
- Phase 1 is merged and deployed
- You have a clean database backup
- No other branches have pending Prisma migrations

This phase renames the `GameNight` model and all references to `Event` throughout the codebase. This touches the database schema, all queries, all API routes, all components that consume game night data, and all TypeScript types.

### 2.1 — Prisma Schema Migration

- [ ] **Rename the model:** `GameNight` → `Event`
- [ ] **Rename the table:** Use `@@map("game_nights")` temporarily if you want to avoid a table rename, OR do a full rename via migration
- [ ] **Rename fields on related models:** Any field like `gameNightId` → `eventId`, `gameNights` → `events` (relation fields)
- [ ] **Update relation names:** Any `@relation` annotations referencing `GameNight`
- [ ] **Generate and review migration:** `npx prisma migrate dev --name rename-game-night-to-event`
- [ ] **Verify migration SQL:** Make sure it's using `ALTER TABLE RENAME` and `ALTER TABLE RENAME COLUMN`, NOT drop-and-recreate (which would lose data)
- [ ] **Test migration on a copy of production data** before running on prod

### 2.2 — Prisma Client Regeneration

- [ ] **Run `npx prisma generate`** after migration
- [ ] **Verify TypeScript types:** The generated client should now export `Event` instead of `GameNight`

### 2.3 — Server-Side Code (API Routes / Server Actions)

Search for all occurrences of `gameNight` and `GameNight` in server-side code:

- [ ] **Prisma queries:** `prisma.gameNight.findMany()` → `prisma.event.findMany()` (and all CRUD operations)
- [ ] **Variable names:** `const gameNight = ...` → `const event = ...` (or `const gameEvent = ...` if `event` conflicts with DOM Event type)
- [ ] **Function names:** `createGameNight()` → `createEvent()`, `getGameNights()` → `getEvents()`, etc.
- [ ] **API route file names:** If you have `/api/game-nights/` routes → rename to `/api/events/`
- [ ] **Server action file names:** e.g., `gameNightActions.ts` → `eventActions.ts`
- [ ] **Type imports:** Update any manual type definitions or re-exports

> **⚠️ Naming conflict note:** `Event` is a built-in DOM type in TypeScript. If you encounter conflicts in files that also use browser Event types, use the Prisma namespace: `Prisma.Event` or alias the import: `import { Event as GameEvent } from '@prisma/client'`. Alternatively, name the model `GamingEvent` in Prisma to avoid the conflict entirely. Decide this before starting.

### 2.4 — Client-Side Code (Components / Hooks / State)

- [ ] **Component file names:** e.g., `GameNightCard.tsx` → `EventCard.tsx`, `GameNightModal.tsx` → `EventModal.tsx`
- [ ] **Component names:** `function GameNightCard()` → `function EventCard()`
- [ ] **Props and interfaces:** `GameNightProps` → `EventProps`, `gameNightId` → `eventId`
- [ ] **State variables:** `const [gameNights, setGameNights]` → `const [events, setEvents]`
- [ ] **Hook names:** `useGameNights()` → `useEvents()`
- [ ] **Import paths:** Update all imports to reference new file names
- [ ] **URL paths in `<Link>` components:** If routes change (e.g., `/game-nights/[id]` → `/events/[id]`)

### 2.5 — URL Routes (If Changing)

If you decide to change URL paths (e.g., `/game-nights` → `/events`):

- [ ] **Rename page directories:** `app/game-nights/` → `app/events/`
- [ ] **Add redirects:** In `next.config.js`, add a permanent redirect from `/game-nights/:path*` to `/events/:path*` so old links don't break
- [ ] **Update all internal `<Link>` hrefs** and `router.push()` calls
- [ ] **Update Discord bot links** that point to specific event pages

### 2.6 — Shared / Utility Code

- [ ] **Type definition files:** Any shared types in `types/` or `lib/` directories
- [ ] **Validation schemas:** Zod schemas, form validators referencing `gameNight` fields
- [ ] **Constants files:** Any constants like `GAME_NIGHT_STATUS` → `EVENT_STATUS`
- [ ] **Seed files:** `prisma/seed.ts` if it creates test game nights

### 2.7 — Testing

- [ ] **Run the full app locally** and click through every page
- [ ] **Test CRUD:** Create, read, update, delete an event
- [ ] **Test RSVP flow:** Make sure RSVPs still work with renamed models
- [ ] **Test Discord bot:** Verify announcements still fire correctly
- [ ] **Run any existing tests** and update test files with new naming
- [ ] **Check browser console** for any runtime errors from stale references

### 2.8 — Cleanup

- [ ] **Search entire codebase** for any remaining `gameNight` or `GameNight` strings (case-insensitive grep)
- [ ] **Search for old file names** in case any dynamic imports reference them
- [ ] **Update any Postman collections / API docs** if they exist
- [ ] **Update `.env` variable names** if any reference "game night" (e.g., `GAME_NIGHT_REMINDER_CRON`)

---

## Decision Log

| Decision | Choice | Reason |
|----------|--------|--------|
| Display name | Gamers in Heaven | Most natural, reads as a brand |
| Navbar logo | GiH | Clean monogram, works on mobile |
| Meta description | Rewritten (see 1.1) | Old one was tied to previous name |
| Signup heading | Join Gamers in Heaven | Full brand moment on signup |
| Button label | + New Event | Future-proof, not tied to "game night" |
| Modal titles | Create Event / Edit Event | Matches button terminology |
| Help text | Mirrors button label | Consistency |
| Schedule subtitle | Upcoming events | Simple, no false feature promises |
| Highlights section | Epic moments from the squad | Personality without "game night" dependency |
| ISunny credit | Story section shoutout | Visible, not buried in changelog |
| Story references | Keep "game night" in narrative | Historical accuracy |
| Changelog entries | Leave as-is | Changelog reflects what existed at the time |
| Copyright | © 2026 Gamers in Heaven | Cleaner than domain URL |
| Internal Prisma models | Rename to Event (Phase 2) | Long-term code cleanliness |
| Personal about content | Keep as-is + add ISunny credit | Maintains identity |

---

## Execution Order

1. **Branch:** Create `rebrand/gamers-in-heaven` branch
2. **Phase 1:** Do all UI changes, commit, deploy to staging, verify
3. **Ship Phase 1** to production
4. **Branch:** Create `refactor/gamenight-to-event` branch off main (after Phase 1 is merged)
5. **Phase 2:** Do schema migration + code rename, test thoroughly
6. **Ship Phase 2** to production
7. **Celebrate** — you just rebranded and cleaned up the whole codebase
