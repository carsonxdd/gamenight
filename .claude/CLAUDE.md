# Game Night — CLAUDE.md

## Quick Reference

- **Production:** pvpers.us (Raspberry Pi + Cloudflare Tunnel)
- **Dev:** localhost:3000
- **Database:** SQLite at `prisma/dev.db` (NOT in git — each env has its own)
- **Discord:** Separate OAuth apps for prod vs dev (dev client ID: `1481158977093107793`)

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript (strict) | 5 |
| Styling | Tailwind CSS | 4 |
| Database | SQLite via Prisma | 5.22.0 |
| Auth | NextAuth.js (Discord OAuth) | 4.24.13 |
| Animations | Framer Motion | 12.34.5 |
| Icons | Lucide React | 0.577.0 |
| Testing | Vitest | 4.0.18 |
| Runtime | React | 19.2.3 |

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm start            # Start production server
npm test             # Run Vitest tests
npx prisma db push   # Sync schema to DB (no migration)
npx prisma studio    # GUI for browsing/editing DB
npx tsx prisma/seed-test-users.ts    # Seed dev data (NEVER on prod)
npx tsx prisma/seed-badges.ts        # Upsert badge definitions (safe for prod)
npx tsx prisma/backfill-badges.ts    # Backfill badges + streaks (safe for prod)
```

## Environment Variables (.env)

```
DATABASE_URL="file:./dev.db"
DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET
NEXTAUTH_SECRET
NEXTAUTH_URL
```

No other env vars needed — Discord webhooks are configured in admin settings UI, not env.

## Deployment Workflow

1. Edit and push from dev PC only
2. Pi pulls from GitHub, rebuilds (`npm run build`), restarts
3. **Never push from Pi** (though hotfixes from Pi are OK if dev PC is idle — just `git pull` on dev PC before resuming)
4. `git pull` does NOT touch the database — user data is always safe
5. **CRITICAL:** Never run `seed-test-users.ts` or `prisma db push --force-reset` on production

## Architecture

### File Structure

```
src/
├── app/                    # Pages + server actions (App Router)
│   ├── [page]/actions.ts   # Server actions per feature
│   ├── [page]/page.tsx     # Server components (data fetching)
│   ├── api/auth/           # NextAuth route handler
│   └── layout.tsx          # Root layout (providers, metadata, accent CSS vars)
├── components/
│   ├── [feature]/          # Feature-specific components
│   ├── layout/             # Navbar, Footer
│   ├── providers/          # SessionProvider, SiteSettingsProvider, PageTransition
│   └── ui/                 # Reusable: Button, Card, Badge, Modal, etc.
├── lib/
│   ├── auth.ts             # NextAuth config (Discord OAuth, JWT callbacks)
│   ├── prisma.ts           # Singleton Prisma client
│   ├── constants.ts        # Game catalog, ranks, time slots, limits
│   ├── timezone-utils.ts   # UTC conversion, slot computation, display formatting
│   ├── access-guard.ts     # Server-side auth + approval check
│   ├── permissions.ts      # canEditEvent() role checks
│   ├── audit.ts            # Fire-and-forget logAudit()
│   ├── discord-webhook.ts  # Auto-notifications + direct webhook send
│   ├── badges/             # constants.ts, engine.ts, streaks.ts
│   ├── bracket-utils.ts    # Tournament bracket generation
│   └── [feature]-utils.ts  # Feature-specific helpers
├── types/next-auth.d.ts    # Session/JWT type extensions
└── middleware.ts            # Route protection
```

### Key Patterns

**Server Actions:** Every feature has its own `actions.ts` file with `"use server"` functions. These handle auth checks, validation, Prisma queries, and return `{ error: string }` or `{ success: true }`.

**Authentication Flow:**
- Discord OAuth → NextAuth JWT session
- `getServerSession(authOptions)` in server actions/pages
- `middleware.ts` protects routes: `/polls`, `/admin`, `/profile`, `/members`, `/teams`
- Admin routes require `isAdmin || isModerator`
- JWT carries: id, gamertag, isAdmin, isModerator, isOwner, timezone, approvalStatus

**Role Hierarchy:** Owner > Admin > Moderator > Member
- Owner: cannot be modified by anyone
- Admin: full access including user management and settings
- Moderator: content moderation, can mute regular members only
- Member: own profile, own events, RSVP

**Timezone Handling:**
- All times stored in UTC in the database
- Converted to user's IANA timezone on display boundaries
- `localTimeToUtc()` / `utcToLocalTime()` in `timezone-utils.ts`
- User timezone is in the session JWT (no extra DB queries)
- `UserAvailability` dayOfWeek/startTime/endTime are UTC
- Events store host's timezone for display context
- Cross-midnight entries are split when rendering heatmaps

**Site Settings:** Singleton `SiteSettings` row in DB. Loaded once in root layout, distributed via `SiteSettingsProvider` React context. `useSiteSettings()` hook for client components. Controls feature toggles, branding, access modes, limits.

**Badge Engine:** Fire-and-forget evaluation after qualifying actions. Dynamic imports to avoid circular deps. `evaluateBadges()` checks threshold-based triggers. Streaks tracked in `UserStreak` model. Attendance streaks use history-based calculation (`computeStreakFromHistory`) — walks confirmed events newest-first and breaks on first no-show (RSVP'd confirmed but didn't attend).

**Discord Webhooks:** Two channels (updates + announcements). Auto-notifications are fire-and-forget. Manual announcements via admin UI with templates and preview.

**Audit Logging:** `logAudit()` is fire-and-forget (no await, catches errors silently). Covers all high-impact actions. Displayed in admin Activity tab.

**Cache Invalidation:** `revalidatePath()` after server action mutations. Production Next.js caches aggressively — missing revalidation = stale pages.

### Database Schema (Prisma — SQLite)

**Core:** User, UserGame, UserGameRank, UserAvailability

**Events:** GameNight, GameNightAttendee, GameNightInvite, InviteGroup, InviteGroupMember

**Polls:** Poll, PollOption, PollVote, PollComment

**Tournaments:** Tournament, TournamentSession, TournamentTeam, TournamentTeamMember, TournamentEntrant, TournamentMatch, TournamentPrediction, TournamentComment, TournamentTemplate

**Teams:** Team, TeamMember, TeamInvite

**Badges:** BadgeDefinition, UserBadge, UserStreak

**Admin:** SiteSettings (singleton), AuditLog, Suggestion, InviteCode

Key constraints:
- `UserAvailability`: unique on userId + dayOfWeek + startTime
- `TeamMember`: unique on teamId + userId
- `PollVote`: unique on pollId + optionId + voterId
- `UserBadge`: unique on userId + badgeId
- `UserStreak`: unique on userId + type

## Gotchas

1. **Production caching:** Next.js production builds cache pages. After code changes on the Pi, you MUST rebuild (`npm run build`). `revalidatePath()` in server actions is essential.

2. **Timezone math:** All availability is UTC in DB. The `:30` slot of the last hour in a time range has historically been dropped — watch `computeTimeSlotsForViewer()` and `generateTimeSlots()`.

3. **Midnight crossing:** `parseSlot()` wraps hours with `% 24` and tracks `endDayOfWeek` separately. Heatmap split logic uses `"24:00"` as sentinel for end-of-day.

4. **Badge evaluation:** Uses dynamic `import()` to avoid circular dependencies. The engine is called from multiple server actions — don't add heavy synchronous work to it.

5. **SiteSettings singleton:** `getSiteSettings()` creates the row with defaults if it doesn't exist. Never assume the row is there — always use this function.

6. **Discord OAuth scope:** Only `identify` — no email. Don't add email scope without updating privacy notices.

7. **Seed scripts:** `seed-test-users.ts` WIPES existing data. Badge seed/backfill scripts are idempotent and safe.

8. **SQLite limitations:** No concurrent writes under heavy load. Fine for this community size.

## Current State (v1.0)

Everything is built and deployed. Full feature set:
- Auth (Discord OAuth, roles, join modes)
- Profiles (games, ranks, availability, social links, groups)
- Schedule (calendar, events, RSVP, attendance, recurring)
- Polls (voting, comments, pinning)
- Tournaments (6 bracket types, drafts, pick'ems, templates)
- Teams (persistent rosters, invites, tournament registration)
- Members page (cards, games tab, availability heatmap)
- Admin dashboard (analytics, roster, insights, settings, badges, audit log)
- Badges & Streaks (18 system badges, attendance/weekly streaks)
- Discord notifications (auto + manual announcements)
- Site settings (branding, feature toggles, access controls)
