# Caplan's Game Night

**v1.2.0**

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
- JWT sessions with owner/admin/moderator/member roles
- Gamertag autofills from Discord username during onboarding
- **Privacy notice** on signup page — reassures users that only their Discord username and avatar are accessed (no email, password, DMs, friends, or servers)

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
- Admin and moderator game night creation with optional title, date, time, game, and recurring option
- **Recurring events** — checking "Recurring weekly" creates the initial event plus 3 more weeks (4 total) automatically
- **Admin/mod inline editing** — admins and moderators can click any event in the calendar or list view to open an edit modal. Update title, date, time, game, status (scheduled/cancelled), and recurring flag. Includes delete with two-click confirmation.
- **Info banner** — tells members to reach out to moderators to suggest events or ask about upcoming game nights
- RSVP system (confirmed / maybe / declined)

### Roles & Permissions
- **Owner** (CarsonXD) — full access, gold glowing border on member cards
- **Admin** — full access including user management (promote/demote, assign moderators, remove users)
- **Moderator** — access to admin panel (read-only roster), can create/edit/delete game nights. Dark red glowing border on member cards
- **Member** — default role, can RSVP and manage own profile
- Role badges displayed on member cards in both the members page and home page carousel

### Admin Panel (`/admin`)
- **Game Popularity** — ranked by player count with expandable player lists
- **Availability Heatmap** — aggregated grid showing player overlap with click-to-reveal names
- **RSVP Overview** — game night cards with status badge counts
- **Player Roster** — searchable table with promote/demote, moderator toggle, owner/admin/mod badges, and remove with confirmation. User management actions restricted to admins only; moderators can view the roster.
- Route-level protection via middleware (admins and moderators)

### About Page (`/about`, authenticated)
- **The Story** — short origin story of how game nights started in the friend group and why this site exists
- **About the Organizer** — personal section with Discord avatar pulled from session and a casual bio
- **Privacy & Security** — explains Discord OAuth2 flow, what data is and isn't accessed, and that all profile info is voluntarily entered
- **Links** — Discord invite (prominent), GitHub profile (subtle), carsoncaplan.com (commented out, ready to uncomment when live)

### Members Page (`/members`, authenticated)
- **Searchable card grid** — responsive layout (3 columns desktop, 2 tablet, 1 mobile) showing all community members
- **Full member cards** — large Discord avatar (or initials fallback), gamertag, game tags (up to 6 with "+X more"), all rank badges with game-accurate tier colors. Owner cards have a glowing gold border; moderator cards have a dark red glowing border with role badges.
- **Social links** — Discord (copies username to clipboard with checkmark feedback), Twitter/X, Twitch, YouTube, and custom link icons. Only rendered for socials the user has linked.
- **Filtering** — search by name and filter by game via dropdown

### Landing Page (`/`)
- **Hero section** — animated grid background with neon glow orb, staggered text/button entrance
- **Introduction** — short casual description with spacing to keep it off the hero
- **Social proof stats** — real-time member count, events hosted, and games available pulled from the database
- **Members carousel** — infinite-scrolling marquee of member cards built from real user data. Cards show Discord avatar (or initials fallback), gamertag, up to 3 favorite games, and highest-tier rank badge with color. Owner/moderator cards display glowing borders and role badges. Pauses on hover. Duplicates cards to fill the viewport for seamless looping even with a single member. "View All Members" link to the full members page.
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

There's no seed script. To set up roles, open Prisma Studio and update your user record:

```bash
npx prisma studio
```

- Set `isAdmin` and `isOwner` to `true` for the site owner
- Set `isModerator` to `true` for moderators (or use the Admin panel's Roster tab to toggle mod status)

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
- **User** — gamertag, timezone, Discord ID, avatar, role flags (isAdmin, isModerator, isOwner), willingToModerate preference, buy-in/LAN interest, favorite games (JSON), social links (Twitter, Twitch, YouTube, custom), profile banner dismissal
- **UserGame** — games a user plays, with optional mode selections (JSON)
- **UserGameRank** — competitive rank per game per user
- **UserAvailability** — 30-min time slot preferences per day of week
- **GameNight** — scheduled events with optional title, date, time, game, status, recurring options
- **GameNightAttendee** — RSVP status per user per game night

## Future Ideas

Discord Bot

Event announcements and RSVP pings
Admin controls to trigger announcements from the site

Moderation & Admin

Community event proposals with voting and admin approval

Teams

Team pages with rosters
Team tags on gamertags
Be on multiple teams

Competitive

Leaderboards and win/loss tracking
Auto-generated tournament brackets from RSVPs
Seasons with standings and playoffs

Community

Game night recaps with highlights and clips
Shoutout wall / kudos after events
Looking-for-group status for pickup games

Scheduling

Auto-suggest best times from availability overlap
Game rotation suggestions based on recent history
Waitlist with auto-promote on cancellation
Calendar sync (Google Calendar / iCal)

Engagement

Weekly digest via email or Discord DM
Badges and streaks
In-app polls and quick votes

Quality of Life

Dark/light theme toggle
Event templates for recurring game nights
Spectator RSVP option

## Version History

### v1.2.0 — 2026-03-06
- **Moderator role** — moderators can access the admin panel and create/edit/delete game nights
- **Owner role** — dedicated role for the site owner with gold glowing border on member cards
- **Visual role indicators** — dark red glowing border and "Mod" badge for moderators, gold glowing border and "Owner" badge for owner, visible on both member cards and home page carousel
- **Moderator management** — admins can toggle moderator status from the Player Roster
- **Schedule info banner** — tells members to reach out to moderators to suggest events
- **Privacy notice** — reassurance on the signup page and a full Privacy & Security section on the About page explaining Discord OAuth2 scope

### v1.1.0 — 2026-03-06
- **Members page** — searchable card grid with Discord avatars, game tags, rank badges, and social link icons
- **Social links** — Twitter/X, Twitch, YouTube, and custom link fields on profiles and member cards
- **Event titles** — optional custom titles for game nights
- **Admin event editing** — click any event in calendar or list view to edit title, time, game, status, or delete
- **Recurring events** — "Recurring weekly" option auto-creates 4 weeks of events

### v1.0.0 — 2026-03-05
- **Discord OAuth** authentication with JWT sessions
- **Player profiles** — gamertag, interactive US timezone map, categorized game selection with sub-modes, drag-select availability grid
- **Extended profiles** — favorite games, visual rank selector with tier colors, social links, tournament/LAN interest
- **Scheduling** — two-week calendar view, event list view, RSVP system (confirmed/maybe/declined)
- **Admin panel** — game popularity, availability heatmap, RSVP overview, player roster with promote/demote/remove
- **Landing page** — hero section, social proof stats, members carousel, highlight cards
- **About page** — origin story, organizer bio, Discord/GitHub links

### v0.1.0 — 2026-03-04
- Initial Next.js scaffold from Create Next App