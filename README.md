# Caplan's Game Night

A web app for organizing weekly gaming events with the boys. Sign up with Discord, pick your games, set your availability, and RSVP to game nights.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Server Components, Server Actions)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (custom dark/neon theme)
- **Database:** SQLite via Prisma ORM
- **Auth:** NextAuth.js with Discord OAuth
- **Animations:** Framer Motion

## Features

### Authentication
- Discord OAuth sign-in
- JWT sessions with admin/member roles
- Gamertag autofills from Discord username during onboarding

### Player Profiles (`/profile`)
- Custom gamertag
- **Interactive US timezone map** — SVG map with real state outlines, colored by timezone region. Hover highlights all states in a zone with a neon glow effect and shows the timezone label + live local time in a tooltip. Arizona is carved out as its own clickable zone (MST, no DST). Alaska and Hawaii shown as insets. Falls back to an animated dropdown on mobile. During onboarding the map is open; on the profile page it collapses behind a button with a smooth expand/collapse animation.
- Categorized game selection with collapsible sub-modes — auto-expand options on first pick during onboarding, collapsed with a +button to expand in edit mode
- Drag-select availability grid (When2Meet-style) — click and drag to paint 30-min slots across a 7-day, 5 PM-11 PM grid
- Opt-in to moderate game nights (host lobbies, coordinate players) — shown during onboarding; on the profile page this lives in the extended profile section alongside tournament/event interests
- Returning users edit preferences through the profile page, not the signup flow
- **Sticky save bar** — fixed to the viewport bottom so the save button is always visible no matter where you scroll. Saves both profile and extended profile sections in parallel. Shows animated error/success feedback inline.

### Extended Profile (profile page only)
- **Favorite games** — pick up to 3 games to feature on your member card in the landing page carousel. Falls back to first 3 games if none selected.
- **Visual rank selector** — colored tier grid for each competitive game (CS2, Valorant, LoL, Dota 2, Rocket League, Overwatch 2, Marvel Rivals, Chess.com, Halo, Brawlhalla, World of Warcraft). Each tier rendered as a colored card matching in-game rank colors. Click a tier to expand subdivisions (e.g., Gold 1/2/3). Single-rank tiers select directly. Per-game accordion with animated expand/collapse. Rank selectors are reactive to game selection — only games currently selected in the profile show rank options; adding or removing a game instantly updates the rank list without saving first.
- **Social links** — optional Twitter/X, Twitch, YouTube, and custom link fields. Shown as icon buttons on the member card. Discord username is always displayed (copies to clipboard on click).
- Interest in pot / buy-in tournaments, moderating, and LAN events (Arizona) — grouped under "Tournaments & Events"
- "Finish setting up your profile" dismissible banner on the schedule page (persists dismissal to DB, only shows if extended profile is incomplete)

### Game Catalog
Games organized by lobby format:

- **Everyone Plays** — Pummel Party, Jackbox, Skribbl.io, Draw My Thing, Among Us, Golf With Friends, Garry's Mod (Murder/TTT), Town of Salem, Secret Hitler, Throne of Lies, Minecraft (Survival/Minigames)
- **Team Games** — CS2, Valorant, Halo, TF2, Overwatch 2, Marvel Rivals, Splitgate, Left 4 Dead 2, League of Legends, Dota 2, Rocket League, World of Warcraft (PvP/Raid)
- **Bracket / Tournament** — Mortal Kombat, Street Fighter, Stick Fight, Brawlhalla, SpeedRunners, Chess.com Arena

Custom games can be added via text input.

### Scheduling
- Two-week calendar view with navigation (14 days across two stacked grids)
- Event list view with tab navigation
- Admin-only game night creation with optional title, date, time, game, and recurring option
- **Recurring events** — checking "Recurring weekly" creates the initial event plus 3 more weeks (4 total) automatically
- **Admin inline editing** — admins can click any event in the calendar or list view to open an edit modal. Update title, date, time, game, status (scheduled/cancelled), and recurring flag. Includes delete with two-click confirmation.
- RSVP system (confirmed / maybe / declined)

### Admin Panel (`/admin`)
- **Game Popularity** — ranked by player count with expandable player lists
- **Availability Heatmap** — aggregated grid showing player overlap with click-to-reveal names
- **RSVP Overview** — game night cards with status badge counts
- **Player Roster** — searchable table with promote/demote, moderator badges, and remove with confirmation
- Route-level protection via middleware

### About Page (`/about`, authenticated)
- **The Story** — short origin story of how game nights started in the friend group and why this site exists
- **About the Organizer** — personal section with Discord avatar pulled from session and a casual bio
- **Links** — Discord invite (prominent), GitHub profile (subtle), carsoncaplan.com (commented out, ready to uncomment when live)

### Members Page (`/members`, authenticated)
- **Searchable card grid** — responsive layout (3 columns desktop, 2 tablet, 1 mobile) showing all community members
- **Full member cards** — large Discord avatar (or initials fallback), gamertag, game tags (up to 6 with "+X more"), all rank badges with game-accurate tier colors
- **Social links** — Discord (copies username to clipboard with checkmark feedback), Twitter/X, Twitch, YouTube, and custom link icons. Only rendered for socials the user has linked.
- **Filtering** — search by name and filter by game via dropdown

### Landing Page (`/`)
- **Hero section** — animated grid background with neon glow orb, staggered text/button entrance
- **Introduction** — short casual description with spacing to keep it off the hero
- **Social proof stats** — real-time member count, events hosted, and games available pulled from the database
- **Members carousel** — infinite-scrolling marquee of member cards built from real user data. Cards show Discord avatar (or initials fallback), gamertag, up to 3 favorite games, and highest-tier rank badge with color. Pauses on hover. Duplicates cards to fill the viewport for seamless looping even with a single member. "View All Members" link to the full members page.
- **Highlight cards** — feature callouts for the app

### UI/UX
- Dark cyberpunk theme with neon green accents
- Smooth page transitions and animated sub-option panels
- Responsive design (mobile hamburger menu, scrollable day selectors)
- Signed-in users see their gamertag as a profile link in the navbar; signup/join buttons hidden

## Repository

Hosted on GitHub: [carsonxdd/gamenight](https://github.com/carsonxdd/gamenight)

## Getting Started

### Prerequisites

- Node.js 18+
- A Discord application with OAuth2 credentials

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your values:
   ```
   DATABASE_URL="file:./dev.db"
   DISCORD_CLIENT_ID="your-client-id"
   DISCORD_CLIENT_SECRET="your-client-secret"
   NEXTAUTH_SECRET="your-secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. Set up the database:
   ```bash
   npx prisma db push
   ```

4. Run the dev server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

### First Admin

There's no seed script. To make yourself an admin, open Prisma Studio and set `isAdmin` to `true` on your user:

```bash
npx prisma studio
```

## Project Structure

```
src/
├── app/
│   ├── about/              # About page (story, organizer, links)
│   ├── admin/              # Admin panel + server actions
│   ├── members/            # Members directory
│   ├── profile/            # Profile editing + server actions
│   ├── schedule/           # Calendar/event views + server actions
│   ├── signup/             # Discord auth + onboarding
│   └── api/                # API routes (NextAuth)
├── components/
│   ├── admin/              # Dashboard tabs (games, heatmap, RSVPs, roster)
│   ├── home/               # Landing page (hero, intro, social proof,
│   │                       # members carousel, highlight cards)
│   ├── members/            # Members page (card grid, member card)
│   ├── schedule/           # Calendar, event list, RSVP, create/edit modals
│   ├── signup/             # Profile form, game selector, availability grid,
│   │                       # rank selector, extended profile form,
│   │                       # unified profile page client wrapper
│   ├── layout/             # Navbar, Footer
│   ├── providers/          # SessionProvider, PageTransition
│   └── ui/                 # Button, Card, Badge, Modal, LoadingSpinner,
│                           # TimezoneSelect, TimezoneMap, ProfileBanner
├── lib/                    # Auth config, Prisma client, constants, animations,
│                           # US state SVG paths + timezone zone data
├── types/                  # NextAuth type extensions
└── middleware.ts           # Route protection
```

## Database Schema

### Core Models
- **User** — gamertag, timezone, Discord ID, avatar, admin/moderator flags, buy-in/LAN interest, favorite games (JSON), social links (Twitter, Twitch, YouTube, custom), profile banner dismissal
- **UserGame** — games a user plays, with optional mode selections (JSON)
- **UserGameRank** — competitive rank per game per user
- **UserAvailability** — 30-min time slot preferences per day of week
- **GameNight** — scheduled events with optional title, date, time, game, status, recurring options
- **GameNightAttendee** — RSVP status per user per game night

## Future Ideas

- **Discord bot** — auto-create server/channels/roles, sync game roles from profiles, post game nights to #schedule, RSVP-based @mentions for reminders, reaction-based RSVP from Discord
- **Teams** — team pages, team tags in front of gamertag, team-based matchmaking
- In-app notifications via Discord webhooks
- Attendance tracking and player stats
- Team balancing based on preferences and ranks
- Calendar sync (Google Calendar / iCal export)
- Waitlist with auto-promote on cancellation
- Player achievements and streaks
