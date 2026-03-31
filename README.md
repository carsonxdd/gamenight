# Caplan's Game Night

A web app for organizing gaming communities. Sign up with Discord, pick your games, set your availability, RSVP to game nights, build teams, and run tournament brackets.

**Live at [pvpers.us](https://pvpers.us)**

## Features

- **Scheduling** — Friday-to-Thursday calendar, event creation with mod approval, recurring events, RSVP (confirmed/maybe/declined), post-event attendance tracking
- **Tournaments** — 6 bracket types (single elim, double elim, round robin, Swiss, constellation, FFA), solo or team, live snake draft, pick'ems, templates
- **Teams** — persistent rosters with tags, roles (captain/co-captain/member/sub), invite system, tournament registration
- **Polls** — single/multi-select voting, comments, pinning
- **Badges & Streaks** — 18 achievement badges, attendance streaks, weekly activity streaks, showcased badges on member cards
- **Discord Notifications** — auto-posts for events/tournaments/polls/new members, manual announcement templates with live preview
- **Profiles** — games, competitive ranks, availability grid, social links, timezone-aware display
- **Admin Panel** — game popularity, availability heatmap, player roster, 8 analytics queries, audit log, badge management, site settings
- **Site Settings** — accent color theming, feature toggles, branding, join modes (open/invite-only/approval), event/poll/tournament/team controls
- **Roles** — Owner, Admin, Moderator, Member with role-appropriate permissions throughout

## Tech Stack

- **Next.js 16** (App Router, Server Components, Server Actions)
- **TypeScript** (strict mode)
- **Tailwind CSS v4** (dark neon theme with configurable accent color)
- **Prisma** (SQLite)
- **NextAuth.js** (Discord OAuth, JWT sessions)
- **Framer Motion** (animations)
- **Vitest** (testing)

## Getting Started

### Prerequisites

- Node.js 18+
- A [Discord application](https://discord.com/developers/applications) with OAuth2 credentials

### Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Fill in your `.env`:

```
DATABASE_URL="file:./dev.db"
DISCORD_CLIENT_ID="your-client-id"
DISCORD_CLIENT_SECRET="your-client-secret"
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

Discord OAuth redirect URL should be `http://localhost:3000/api/auth/callback/discord`.

```bash
# Set up the database
npx prisma db push

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### First Admin

Open Prisma Studio and set `isAdmin` and `isOwner` to `true` on your user:

```bash
npx prisma studio
```

After that, use the Admin Panel's Roster tab to manage roles.

### Seed Data (optional)

```bash
npx tsx prisma/seed-test-users.ts    # 15 users, 20 events, 6 teams, 8 polls, 7 tournaments
npx tsx prisma/seed-badges.ts        # 18 badge definitions
npx tsx prisma/backfill-badges.ts    # Award badges + compute streaks for existing users
```

The test users script **wipes existing data** — dev only. Badge scripts are idempotent and safe for production.

### Tests

```bash
npm test
```

## Deployment

Hosted on a Raspberry Pi with a Cloudflare Tunnel. The database (SQLite) is not in git — deploys don't touch user data.

```bash
# On the Pi
git pull
npm run build
# Restart the process
```

## Community

Join the Discord: [discord.gg/3fyMmcSf4C](https://discord.gg/3fyMmcSf4C)

## Version History

### v1.0.2 — 2026-03-22
- Fix roster availability timezone display (was showing raw UTC days)

### v1.0.1 — 2026-03-13
- Admin rank management (lock, override, unlock with audit trail)

### v1.0 — 2026-03-12
- Badges & Streaks (18 badges, attendance/weekly streaks, admin management)
- Discord Notifications (dual-channel webhooks, auto-posts, announcement templates)
- Tabbed profile layout, expandable changelog, last seen on roster
- Bugfixes (11:30 PM heatmap slot, stale cache after profile save, 2 AM time window)

### v0.9.0 — 2026-03-12
- Audit log, activity feed, last seen tracking, mobile responsiveness pass

### v0.8.x — 2026-03-12
- Feedback system (suggestions + bug reports), mute system, FAQ, privacy tightening

### v0.7.x — 2026-03-12
- Site settings expansion (branding, feature toggles, join modes, accent colors)
- Conditional save buttons, accent color SSR fix

### v0.6.0 — 2026-03-11
- Admin settings panel, prime/extended time windows, timezone-aware legends, seed data, Vitest

### v0.5.0 — 2026-03-09
- Persistent teams, team tags, timezone normalization

### v0.4.0 — 2026-03-07
- Tournament system (6 bracket types, drafts, pick'ems), calendar redesign, event detail modal

### v0.3.0 — 2026-03-06
- Members page, polls, roles, user-created events, invite-only events, admin insights, about page

### v0.2.0 — 2026-03-05
- Discord auth, profiles, scheduling, admin panel, landing page

### v0.1.0 — 2026-03-04
- Initial scaffold
