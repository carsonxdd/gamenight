# Caplan's Game Night

**v2.4.0**

A web app for organizing weekly gaming events with the boys. Sign up with Discord, pick your games, set your availability, RSVP to game nights, build persistent teams, and run full tournament brackets.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Server Components, Server Actions)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (custom dark/neon theme)
- **Database:** SQLite via Prisma ORM
- **Auth:** NextAuth.js with Discord OAuth
- **Animations:** Framer Motion

## Features

### Authentication & Access
- Discord OAuth sign-in
- JWT sessions with owner/admin/moderator/member roles
- Gamertag autofills from Discord username during onboarding
- **Privacy notice** on signup page — reassures users that only their Discord username and avatar are accessed (no email, password, DMs, friends, or servers)
- **Public pages** (no sign-in required) — Home, Schedule (view-only), Highlights, About, Join
- **Authenticated pages** — Polls, Members, Teams, Profile
- **Admin/mod pages** — Admin panel
- Non-signed-in users can browse the schedule calendar and event list but cannot RSVP, create events, or view event details. Clicking an event shows a sign-in prompt modal.

### Player Profiles (`/profile`)
- Custom gamertag
- **Interactive US timezone map** — SVG map with real state outlines, colored by timezone region. Hover highlights all states in a zone with a neon glow effect and shows the timezone label + live local time in a tooltip. Arizona is carved out as its own clickable zone (MST, no DST). Alaska and Hawaii shown as insets. Falls back to an animated dropdown on mobile. During onboarding the map is open; on the profile page it collapses behind a button with a smooth expand/collapse animation.
- Categorized game selection with collapsible sub-modes — auto-expand options on first pick during onboarding, collapsed with a +button to expand in edit mode
- **Drag-select availability grid** (When2Meet-style) — click and drag to paint 30-min slots across a 7-day grid. **Prime time rows** (default 5–11 PM Phoenix) are bright neon; **extended rows** (default 2 PM–1 AM) are dimmed/muted, visually guiding players toward recommended hours without restricting selection. Shows a timezone hint label so users know times are in their selected timezone. **Prime time legend** adapts to the viewer's timezone: Arizona users see a simple "Prime time 5 PM–11 PM" label; users in other timezones see "Group prime time — 7 PM–1 AM your time" (or whatever their local equivalent is) with an explanation that prime time is based on the group's anchor timezone. **Reactive to timezone changes** — when a user changes their timezone in the dropdown, prime/extended slot highlighting and the legend immediately recalculate client-side (e.g. switching from Arizona to Eastern shifts the highlighted rows from 5–11 PM to 7 PM–1 AM). Time windows are admin-configurable and automatically converted to each viewer's local timezone.
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
- **Timezone-aware scheduling** — all times are stored in UTC internally and converted to each viewer's timezone for display. Events show times in the viewer's timezone; if the viewer and host are in different timezones, both are shown (e.g. "4:00 PM PST (7:00 PM MST)"). Each event records the host's timezone for context. The availability heatmap correctly detects real overlap across timezones. Users create events and set availability in their own local time — conversion is automatic. Uses the `Intl.DateTimeFormat` API for DST-safe conversions with no external dependencies.
- **Friday-to-Thursday calendar** — weeks run Friday through Thursday to keep weekends front and center. Desktop shows two stacked week grids (14 days), mobile shows one week (7 days) with separate navigation step sizes (±14 desktop, ±7 mobile).
- **Three-tab layout** — Calendar, Events, and Tournaments views with a shared tab toggle. Mobile defaults to Events, desktop defaults to Calendar. Tabs switch with a smooth fade transition and auto-scroll to the top of the page.
- **Responsive default view** — mobile defaults to Event List, desktop defaults to Calendar. Users can toggle between views on any device.
- **Mobile day selector** — two-row layout: weekend days (Fri/Sat/Sun) on top as wider cards (`grid-cols-3`), weekdays (Mon–Thu) on the bottom (`grid-cols-4`). Both rows span full width. Selected day highlighted in neon, today gets a subtle dot indicator. Event count badges on days with events.
- **Compact calendar cards** — events in the calendar grid show game name and time only. Click to open the full detail view.
- **Event detail modal** — read-only modal showing title, game, date, time range, host, description, and RSVP lists (Going and Maybe with gamertags). RSVP button, approve/reject, and mark attendance actions available in-context. "Edit Settings" button visible only to the host, moderator, admin, or owner — opens the edit modal.
- **Edit permissions** — hosts can edit their own events (not just admins/mods). Owners are now included in all authorization checks. Regular users see a read-only detail view. Edit modal shows full RSVP breakdown (Going, Maybe, Declined) with color-coded badges.
- **Info bubble** — dismissable tutorial hint for signed-in users explaining how to create events. Glows on page load, collapses to an "i" icon when dismissed. Clicking the icon reopens the bubble. Dismissed state persists across sessions via localStorage.
- Event list view with tab navigation
- **User-created events with approval** — any logged-in user can create a game night event. Regular user events are set to "pending" and require moderator/admin approval before appearing publicly. Admin/mod events are auto-approved. Users can see their own pending/rejected events; other users cannot.
- **Event approval workflow** — admins and moderators see pending events with "Approve" and "Reject" buttons in both calendar and list views. Pending events styled with dashed warning borders; rejected events styled with danger borders. Status badges shown on all non-scheduled events.
- **Invite-only events** — users can create private events visible only to the creator and invited members. Invite-only events skip mod approval (auto-scheduled). Creators can edit their own invite-only events (title, description, date, times, game, invitees) and delete/cancel them. "Invite-Only" badge shown on event cards.
- **Member picker** — searchable checkbox list for selecting invitees when creating or editing invite-only events. Shows avatars, gamertags, and real names. Quick-select group buttons toggle entire groups at once. Counter shows "X/10 selected".
- **Invite guardrails** — non-admin users limited to 50-char titles, 200-char descriptions, no past dates, max 10 invitees per event, max 5 invite-only events per rolling 7 days, no self-invites. Admins bypass all limits.
- **Quick-select groups** — save named groups of friends on the profile page for fast event invites. Full CRUD with independent save (not tied to the sticky save bar). Max 10 groups, 10 members each, 30-char names.
- **Visibility-aware filtering** — unauthenticated users see only public scheduled/cancelled events. Regular users additionally see their own pending/rejected events and invite-only events where they are creator or invitee. Admins/mods see everything.
- **Recurring events** (admin/mod only) — checking "Recurring weekly" creates events for a configurable number of weeks (2–12). The recurring day is derived from the selected date automatically. All events in a series share a group ID for easy bulk management.
- **Delete recurring series** — edit modal shows a "Delete All in Series" button for recurring events, allowing admins/mods to remove an entire series at once with two-click confirmation.
- **Event descriptions** — admins and moderators can add an optional description when creating or editing events. Shown to all users in the calendar and event list views so everyone knows what's planned.
- **Event host** — each event has a designated host (defaults to creator). Host selector dropdown available when creating or editing events. Host name shown on event cards. The host, creator, or any admin/mod can mark attendance.
- RSVP system (confirmed / maybe / declined) — only shown for scheduled future events (hidden for past/pending/rejected/cancelled). Optimistic UI updates: button highlights and Going/Maybe lists update instantly on click without waiting for the server round-trip.
- **Attendance confirmation** — after an event's date passes, the host (or creator/admin/mod) can click "Mark Attendance" to check off who actually showed up. Checklist pre-populated from RSVPs with select-all/clear controls. Events marked as confirmed show a green checkmark. Attendance data feeds into the RSVP Stats insight for reliability tracking (showed vs no-show counts).

### Polls (`/polls`, sign-in required)
- **Create polls** — any logged-in user can create a poll with a question, optional description, optional game tag from the catalog, and 2–10 options. Toggle between single-select and multi-select.
- **Vote** — click options and submit. Animated result bars show vote counts and percentages after voting. Users can change their vote while the poll is active.
- **Comments** — small comment thread under each poll for clarifications (e.g. "I'd do Ender Dragon if we have 6+"). Shows 3 comments by default with "show more" expand. Max 300 chars per comment. Authors and admins can delete comments.
- **Poll management** — creators, admins, and moderators can close or delete polls. Two-click delete confirmation.
- **Pinning** — admins/mods can pin polls to the top of the list (neon glow border on pinned polls).
- **Filtering** — tab toggle between All, Active, and Closed polls.
- **Rate limiting** — regular users limited to 5 polls per rolling 7 days. Admins bypass all limits.

### Tournaments (Schedule → Tournaments tab)
- **6 bracket types** — Single Elimination, Double Elimination, Round Robin, Swiss, Constellation (main + consolation brackets), and Free-for-All (point-based rounds)
- **Solo and team formats** — solo (1v1) or team with configurable team sizes (5v5 for LoL/Dota, 6v6 for OW, custom). Game-specific team sizes auto-fill from a preset map.
- **6-step creation wizard** — Title/description/game → Format/bracket/best-of → Seeding/captain mode → Schedule (single or multi-session) → Slots/buy-in/templates → Player selection with member picker
- **Seeding modes** — Random, Ranked (by in-game rank), and Balanced Random (top seeds can't meet in round 1)
- **Live snake draft** — for team tournaments, captains take turns picking players in snake order (1,2,...,N,N,...,2,1). Real-time 3-second polling shows whose turn it is, team compositions, and available players. Captains can rename their teams. Auto-fill randomly assigns remaining players.
- **Captain selection** — By Rank (highest-ranked players), Manual (creator picks), or Random
- **Match reporting** — participants report scores with opponent or admin/mod confirmation. Admins can directly confirm results. Auto-advancement feeds winners into the next bracket round.
- **Double elimination routing** — losers from winners bracket automatically placed into the correct losers bracket round. Losers bracket winner advances to grand finals.
- **Constellation bracket** — primary single elimination bracket with consolation brackets for losers from each round
- **Swiss pairing** — pairs players by W/L record, avoids rematches, generates rounds on demand
- **Round robin** — circle method scheduling, standings table with W/L/points
- **Free-for-all** — admin-reported point scores per round with cumulative totals
- **Pick'ems** — predict match winners before the tournament starts. Predictions lock when the bracket is generated. Color-coded results (green correct, red wrong). Score summary and prediction standings leaderboard.
- **Discussion** — comment thread per tournament (reuses the poll comments pattern)
- **Buy-in display** — optional buy-in amount with calculated prize pool (buy-in × slots). Display-only, no payment tracking.
- **Templates** — save bracket type, team size, best-of, seeding mode, and captain mode as a reusable template. Load templates when creating new tournaments.
- **Bracket sharing** — "Share Link" button copies a direct URL (`/schedule?tournament=<id>`) that auto-opens the tournament detail. "Copy for Discord" generates a text-formatted bracket summary.
- **Multi-session scheduling** — tournaments can span multiple game nights with specific dates per session or a start date + weekly frequency
- **Status flow** — Draft → Open (signups) → In Progress (bracket generated) → Completed → Archived. Managers can delete draft/archived tournaments.
- **Permissions** — any user can create tournaments. The creator and admins/mods can manage status, generate brackets, report results, and delete.

### Teams (`/teams`, sign-in required)
- **Persistent teams** — create named teams (clans/squads) that exist outside any single tournament. Each team has a unique tag (2–5 chars), game affiliation, bio, avatar, and configurable roster size (min/max).
- **One team per game** — each player can belong to at most one team per game, enforced on invite acceptance.
- **Roles** — Captain (team creator, full control), Co-Captain (can invite), Member, Sub. Captains can promote/demote members and transfer captaincy.
- **Invite system** — captains and co-captains send invites; invitees accept or decline from a pending invites banner on the Teams page. Invites expire after 7 days. Navbar shows a neon badge with pending invite count.
- **Team detail page** (`/teams/[id]`) — header with avatar/name/tag/game, W–L record, roster grid with role badges and management controls, tournament history with placement, and danger zone (disband with two-click confirmation).
- **3-step creation wizard** — Name/Tag/Game → Bio/Avatar → Review. Live tag availability check with debounce.
- **Team tags throughout the site** — `[TAG]` badges appear next to player names on the schedule (event lists, event detail modal, attendance modal) and members page (clickable badges linking to the team page). Tags are game-context-aware — only shown when the event's game matches the team's game.
- **Tournament integration** — captains can register their team for open tournaments matching the team's game. Registration snapshots the current roster into a TournamentTeam + TournamentEntrant records, preserving bracket integrity even if the real team changes later. Team tags are baked into tournament display names at join time.
- **Browse and filter** — "All Teams" and "My Teams" tabs, search by name/tag, filter by game. Create Team button for authenticated users.

### Roles & Permissions
- **Owner** (CarsonXD) — full access, gold glowing border on member cards
- **Admin** — full access including user management (role ladder promote/demote, remove users)
- **Moderator** — access to admin panel (view-only roster, no user management), can create/edit/delete all game nights. Dark red glowing border on member cards
- **Member** — default role, can RSVP, manage own profile, and edit events they host
- Role badges displayed on member cards in both the members page and home page carousel

### Admin Panel (`/admin`)
- **Game Popularity** — ranked by player count with expandable player lists
- **Availability Heatmap** — aggregated grid showing player overlap with click-to-reveal names; filterable by game to see who's available for a specific title. **Prime/extended visual distinction** — prime time rows use neon intensity gradients, extended rows use muted foreground intensity. Cross-timezone availability entries that span midnight are automatically split into correct day segments. **Timezone-aware legend** — Arizona viewers see "Prime time 5 PM–11 PM"; other timezone viewers see the converted range with the anchor timezone noted (e.g. "Prime time 7 PM–1 AM your time (5 PM–11 PM Arizona)").
- **RSVP Overview** — game night cards with status badge counts
- **Player Roster** — searchable table with role ladder promote/demote (Member → Moderator → Admin), owner/admin/mod badges, and remove with confirmation. User management actions restricted to admins only; moderators can view the roster but cannot promote, demote, or remove anyone. "Willing to Mod" badge shown next to players who opted in, with a filter toggle button and count pill to quickly find moderation candidates.
- **Insights** — interactive analytics tab with 8 on-demand queries. Click a card to run it, click again to collapse. Game-based insights (Best Time, Squad Finder) have a game dropdown and Run button. All results are expandable with player name tags.
  - **Best Time for Game** — top 10 time slots where the most players of a selected game overlap
  - **Peak Availability** — busiest time slots across all players regardless of game
  - **Squad Finder** — find all time slots where at least N players of a game are available
  - **Lonely Games** — games with only one player (recruit targets)
  - **Inactive Members** — signed-up members who have never RSVP'd
  - **Schedule Gaps** — days with available players but no upcoming events in the next 2 weeks
  - **RSVP Stats** — per-player breakdown of confirmed / maybe / declined counts, plus attended and no-show totals from post-event attendance confirmation
  - **Game Night History** — most-scheduled games with event counts, total RSVPs, and average attendance
- **Attendance nudge** — banner at the top of the admin panel listing past events that still need attendance confirmation, with links to the schedule page. Shows host name and RSVP count for each event.
- **Site Settings** (admin-only) — configurable settings panel with:
  - **Time windows** — prime start/end hours (default 5–11 PM) and extended start/end hours (default 2 PM–1 AM), anchored to a configurable timezone (default America/Phoenix). Visual preview bar shows the prime vs extended range. Constrained dropdowns prevent invalid ranges (extended start ≤ prime start, prime end ≤ extended end).
  - **Limits** — default event duration, max events per week, max polls per week
  - **Community** — community name, message of the day (MOTD)
  - Settings stored as a singleton `SiteSettings` row in the database
- Route-level protection via middleware (admins and moderators only)

### About Page (`/about`, public)
- **Tabbed layout** — underline-style tab navigation (About | Changelog) with animated neon indicator. Defaults to the About tab.
- **About tab**
  - **The Story** — short origin story of how game nights started in the friend group and why this site exists
  - **About the Organizer** — personal section with static profile image and a casual bio
  - **Privacy & Security** — explains Discord OAuth2 flow, what data is and isn't accessed, and that all profile info is voluntarily entered
  - **Links** — Discord invite (prominent), GitHub profile (subtle), carsoncaplan.com (commented out, ready to uncomment when live)
- **Changelog tab**
  - **Version History** — all releases listed with version number, date, and bullet-point changes in styled cards
  - **Roadmap** — future ideas organized by category (Discord Bot, Teams, Competitive, Community, Scheduling, Engagement, Quality of Life)

### Members Page (`/members`, sign-in required)
- **Tabbed layout** — underline-style tab navigation (Members | Games | Availability) with animated neon indicator. Defaults to the Members tab.
- **Members tab** — searchable card grid, responsive layout (3 columns desktop, 2 tablet, 1 mobile) showing all community members
- **Full member cards** — large Discord avatar (or initials fallback), gamertag, game tags (up to 6 with "+X more"), all rank badges with game-accurate tier colors. Owner cards have a glowing gold border; moderator cards have a dark red glowing border with role badges.
- **Social links** — Discord (copies username to clipboard with checkmark feedback), Twitter/X, Twitch, YouTube, and custom link icons. Only rendered for socials the user has linked.
- **Filtering** — search by name and filter by game via dropdown
- **Games tab** — reuses the Game Popularity component from the admin panel, showing games ranked by player count with expandable player lists
- **Availability tab** — reuses the Availability Heatmap component from the admin panel, showing aggregated player availability with click-to-reveal names and game filtering. Includes the same timezone-aware prime time legend — Arizona users see simple "5–11 PM" labeling, while users in other timezones see the converted range with anchor timezone context.

### Landing Page (`/`)
- **Hero section** — animated grid background with neon glow orb, staggered text/button entrance
- **Introduction** — short casual description with spacing to keep it off the hero
- **Social proof stats** — real-time member count, events hosted, and games available pulled from the database
- **Members carousel** — `requestAnimationFrame`-driven infinite scroll of member cards built from real user data. Cards show Discord avatar (or initials fallback), gamertag, up to 3 favorite games, and highest-tier rank badge with color. Owner/moderator cards display glowing borders and role badges. Pauses on hover and touch. Responsive card sizing. Duplicates cards to fill the viewport for seamless looping. "View All Members" link to the full members page.
- **Highlight cards** — feature callouts for the app

### UI/UX
- Dark cyberpunk theme with neon green accents
- Smooth page transitions and animated sub-option panels
- **Mobile-first responsive design** — hamburger menu, stacking form grids on small screens, larger touch targets for availability grids and heatmaps, always-visible action buttons (no hover-only on touch), responsive tab gaps, and adaptive card sizing
- **Smooth scroll-to-top on navigation** — navigating between any page (Schedule, About, Highlights, Members, etc.) smoothly scrolls to the top of the new page instead of preserving the previous scroll position. Handled globally via the PageTransition component on route changes.
- **Active nav highlighting** — current page link turns neon green with bold text in both desktop and mobile nav. Uses pathname matching (exact for Home, prefix for all other routes).
- **Nav order** — signed-in: Home, Schedule, Polls, Members, Teams, Highlights, About, Admin (if mod/admin), Profile. Guest: Home, Schedule, Highlights, About, Join.
- Signed-in users see their **bold** gamertag as a profile link in the navbar; signup/join buttons hidden
- **Members carousel** — `requestAnimationFrame`-driven infinite scroll (no CSS animation glitches). Pauses on hover and touch. Responsive card sizing (`w-60` mobile, `w-72` desktop). Seamless loop by measuring actual scroll width and resetting position at the midpoint.

## Live Site

**[pvpers.us](https://pvpers.us)** — hosted on a Raspberry Pi with a Cloudflare Tunnel.

## Development

This branch (`main`) is the development branch. It uses a **separate Discord application** from production so dev logins don't interfere with live user sessions.

| Environment | Discord Client ID | NEXTAUTH_URL |
|-------------|-------------------|--------------|
| **Production** (Pi) | *(production app)* | `https://pvpers.us` |
| **Development** (local) | `1481158977093107793` | `http://localhost:3000` |

> **Workflow:** Edit and push from your dev PC only. The Pi pulls from GitHub, rebuilds, and restarts. Never push from the Pi. `git pull` does not touch the database — user data is always safe.

## Repository

Hosted on GitHub: [carsonxdd/gamenight](https://github.com/carsonxdd/gamenight)

## Getting Started

### Prerequisites

- Node.js 18+
- A Discord application with OAuth2 credentials (use the dev app for local development)

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

### Seed Data (optional)

Load comprehensive test data for development:

```bash
npx tsx prisma/seed-test-users.ts
```

This creates 15 test users with full profiles (games, ranks, availability, social links, favorite games), 20 game night events (spread across US timezones, aligned to Phoenix prime time 5–11 PM with late night events), 6 persistent teams with rosters, 8 polls with votes and comments, 7 tournaments (open, in-progress, and completed across multiple bracket types), 3 invite groups, and team invites. All event times are properly UTC-converted so they display correctly in each viewer's timezone. Running the script again cleanly replaces all seed data.

> **WARNING:** Do NOT run the seed script on the production Pi — it will wipe all real user data. This is for local development only.

### First Admin

To set up roles, open Prisma Studio and update your user record:

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
│   │                       # + insight-actions.ts, settings-actions.ts
│   ├── members/            # Members directory
│   ├── polls/              # Polls + server actions
│   ├── profile/            # Profile editing + server actions
│   ├── schedule/           # Calendar/event views + server actions
│   │                       # + tournament-actions.ts
│   ├── teams/              # Teams list + detail pages + server actions
│   ├── signup/             # Discord auth + onboarding
│   └── api/                # API routes (NextAuth)
├── components/
│   ├── admin/              # Dashboard tabs (games, heatmap, RSVPs, roster,
│   │                       # insights, site settings panel)
│   ├── home/               # Landing page (hero, intro, social proof,
│   │                       # members carousel, highlight cards)
│   ├── members/            # Members page (card grid, member card)
│   ├── polls/              # Poll list, poll card, create modal, comments
│   ├── profile/            # Invite group manager
│   ├── schedule/           # Calendar, event list, RSVP, create/edit modals,
│   │                       # event detail modal, info bubble,
│   │                       # member picker for invite-only events,
│   │                       # tournament list/detail/bracket/draft/pickems
│   ├── teams/              # Team card, team detail, create/edit/invite
│   │                       # modals, pending invites, register for tournament
│   ├── signup/             # Profile form, game selector, availability grid,
│   │                       # rank selector, extended profile form,
│   │                       # unified profile page client wrapper
│   ├── layout/             # Navbar, Footer
│   ├── providers/          # SessionProvider, PageTransition
│   └── ui/                 # Button, Card, Badge, Modal, LoadingSpinner,
│                           # TimezoneSelect, TimezoneMap, ProfileBanner
├── lib/                    # Auth config, Prisma client, constants (time
│                           # windows, game catalog), animations, schedule
│                           # date utils, permissions, US state SVG paths +
│                           # timezone zone data, timezone-utils (UTC
│                           # conversion, prime/extended slot computation),
│                           # bracket-utils, tournament-constants,
│                           # team-constants, team-utils
├── types/                  # NextAuth type extensions
└── middleware.ts           # Route protection (polls, admin, profile, members, teams)
```

## Database Schema

### Core Models
- **User** — gamertag, timezone (IANA, non-nullable, default "America/Phoenix"), Discord ID, avatar, role flags (isAdmin, isModerator, isOwner), willingToModerate preference, buy-in/LAN interest, favorite games (JSON), social links (Twitter, Twitch, YouTube, custom), profile banner dismissal
- **UserGame** — games a user plays, with optional mode selections (JSON)
- **UserGameRank** — competitive rank per game per user
- **UserAvailability** — 30-min time slot preferences per day of week (stored in UTC, converted to user's local timezone for display)
- **GameNight** — scheduled events with optional title, optional description, date, time (stored in UTC), game, status (pending/scheduled/cancelled/rejected), visibility (public/invite_only), timezone (IANA, records the host's timezone at creation), recurring options, recurGroupId for series linking, hostId for designated host, attendanceConfirmed flag
- **GameNightAttendee** — RSVP status per user per game night, attended boolean for post-event confirmation
- **GameNightInvite** — invite records linking users to invite-only game nights (cascade delete)
- **InviteGroup** — named quick-select groups owned by a user
- **InviteGroupMember** — members of an invite group (cascade delete on group or user deletion)
- **Poll** — community polls with title, optional description, optional game tag, single/multi-select, status (active/closed), pinned flag, creator reference
- **PollOption** — individual options within a poll
- **PollVote** — user votes on poll options (unique per poll+option+user, cascade delete)
- **PollComment** — short comment thread per poll (max 300 chars, cascade delete)

### Settings Models
- **SiteSettings** — singleton configuration row with prime/extended time window hours (primeStartHour, primeEndHour, extendedStartHour, extendedEndHour), anchor timezone (IANA), default event duration, max events/polls per week, community name, and optional MOTD

### Tournament Models
- **Tournament** — title, description, game, bracketType, format (solo/team), teamSize, bestOf, maxSlots, seedingMode, captainMode, status (draft/open/in_progress/completed/archived), buyIn, isMultiSession, draftStatus, draftOrder (JSON), currentPickIndex
- **TournamentSession** — links tournament rounds to specific dates, with optional game night association
- **TournamentTeam** — team name, captain reference, belongs to a tournament, optional persistentTeamId linking back to a persistent Team
- **TournamentTeamMember** — user membership in a tournament team
- **TournamentEntrant** — unified abstraction for bracket participants. Type is "solo" (maps to a user) or "team" (maps to a TournamentTeam). Matches always reference entrants, keeping bracket logic format-agnostic.
- **TournamentMatch** — round, matchNumber, bracketSide (winners/losers/consolation), entrant references, scores, bestOfGame, status (pending/in_progress/completed/bye), reported/confirmed by references
- **TournamentPrediction** — user's predicted winner for a match, with correct boolean scored on match completion
- **TournamentComment** — discussion thread per tournament (cascade delete)
- **TournamentTemplate** — saved tournament configuration (bracket type, team size, best-of, seeding, captain mode) for reuse

### Team Models
- **Team** — name, unique tag (2–5 chars), game, captainId, bio, avatarUrl, isActive, minSize, maxSize, timestamps
- **TeamMember** — links user to team with role (captain/co_captain/member/sub), joinedAt. Unique on teamId + userId.
- **TeamInvite** — invitedUserId, invitedByUserId, status (pending/accepted/declined/expired), respondedAt

## Future Ideas

Discord Bot

Event announcements and RSVP pings
Admin controls to trigger announcements from the site

Moderation & Admin

~~Community event proposals with voting and admin approval~~ *(shipped in v1.3.0 — user-created events with mod approval)*
~~Invite-only / private events~~ *(shipped in v1.4.0 — invite-only events with quick-select groups)*

~~Teams~~ *(shipped in v2.0.0 — persistent teams with rosters, tags throughout site, invite system, and tournament integration)*

~~Team pages with rosters~~
~~Team tags on gamertags~~
~~Be on multiple teams~~

Competitive

Leaderboards and win/loss tracking
~~Auto-generated tournament brackets from RSVPs~~ *(shipped in v1.9.0 — full tournament system with 6 bracket types, team drafts, pick'ems, and bracket sharing)*
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
~~In-app polls and quick votes~~ *(shipped in v1.6.0 — polls with voting, comments, and pinning)*

Quality of Life

Dark/light theme toggle
Event templates for recurring game nights
Spectator RSVP option

## Version History

### v2.4.0 — 2026-03-11
- **Reactive prime time highlighting** — the availability grid (signup + profile) now recomputes prime/extended slot highlighting client-side whenever the user changes their timezone. Previously, slots were computed once on the server with the initial timezone and never updated. Now switching from Arizona to Eastern immediately shifts the highlighted rows from 5–11 PM to 7 PM–1 AM, with the legend updating to match.
- **Timezone-aware prime time legend** — the prime time explanation adapts based on the viewer's timezone. Arizona users see a clean "Prime time 5 PM–11 PM" label with no extra context needed. Users in other timezones see "Group prime time — 7 PM–1 AM your time" with an explanation: "Most of the group is in Arizona, so prime time is based on 5 PM–11 PM Arizona — shown here in your timezone."
- **Heatmap prime time legend** — the availability heatmap (Members page + Admin panel) now shows the same timezone-aware prime time context. Arizona viewers see "Prime time 5 PM–11 PM"; other timezone viewers see their converted range with the anchor timezone noted (e.g. "Prime time 7 PM–1 AM your time (5 PM–11 PM Arizona)").

### v2.3.0 — 2026-03-11
- **Prime time tooltip on availability grid** — the availability grid (signup + profile) now shows a visual legend with colored swatches explaining group prime time vs extended hours. Displays the admin-configured prime window in the anchor timezone (e.g. "5 PM–11 PM Arizona"), dynamically converted to the viewer's local timezone. Non-Arizona users immediately understand when the group primarily plays.
- **11 PM prime time fix** — fixed off-by-one in `computeTimeSlotsForViewer` that excluded the 23:00 (11 PM) slot from prime highlighting. The `:30` slot is correctly excluded (23:30 is past prime).
- **Diverse seed data** — added 3 new test users: 2 in Hawaii (`Pacific/Honolulu`) and 1 in Alaska (`America/Anchorage`), bringing total to 13 users across 7 US timezones. All user availability now properly targets Phoenix prime time (5–11 PM MST) expressed in each user's local timezone — e.g. Hawaii users are available 2–8 PM HST, Eastern users 7 PM–1 AM ET. Some users include extended-hour availability outside prime for realism. All availability converted to UTC via a new `localAvailabilityToUtc()` helper that handles day-of-week shifts across midnight.
- **Lint cleanup** — resolved all 23 ESLint errors: fixed conditional React hooks in MembersCarousel and RankSelector, fixed setState-in-effect violations across 7 components (InfoBubble, ScheduleView, TeamDraftModal, CreateTournamentModal, RegisterTeamModal, CreateTeamModal, EditTeamModal), removed unused imports/variables, escaped JSX entities, replaced `<a>` with Next.js patterns. Zero errors remain (25 warnings, all `<img>` → `next/image` suggestions for Discord avatar URLs).
- **Continuous carousel** — home page members carousel no longer pauses on hover/touch, scrolling smoothly at all times.

### v2.2.0 — 2026-03-10
- **Prime/extended time windows** — availability grids (signup, profile) and heatmaps (admin, members) now visually distinguish between prime time (default 5–11 PM Phoenix, bright neon) and extended hours (default 2 PM–1 AM, dimmed/muted). Guides players toward recommended hours without restricting selection. Time windows automatically convert to each viewer's local timezone.
- **Admin site settings panel** — new Settings tab (admin-only) for configuring prime/extended time window hours, anchor timezone, default event duration, max events/polls per week, community name, and message of the day. Visual preview bar shows the prime vs extended range. Settings stored as a singleton `SiteSettings` model.
- **Availability heatmap timezone fix** — fixed three bugs from the timezone normalization update: cross-midnight availability entries are now split into correct day segments, time slots are dynamically computed instead of hardcoded to 5–11 PM, and duplicate player counting after entry splitting is prevented via Set deduplication.
- **Comprehensive seed data** — `prisma/seed-test-users.ts` now creates 13 test users across 7 US timezones (Phoenix, Eastern, Central, Mountain, Pacific, Hawaii, Alaska) with full profiles, 20 events (varied US timezones, Phoenix prime time aligned, 3 late night events), 6 teams, 8 polls, 7 tournaments (single/double elim, round robin, swiss, draft), 3 invite groups, and team invites. All event and availability times properly UTC-converted for correct cross-timezone display. Re-runnable (cleanly replaces seed data).

### v2.1.0 — 2026-03-09
- **Timezone normalization** — all times are now stored in UTC internally and converted to each viewer's timezone for display. Users create events and set availability in their own local time; conversion is automatic and DST-safe (uses `Intl.DateTimeFormat` with IANA timezone names, no external dependencies).
- **Cross-timezone event display** — event times are shown in the viewer's timezone. When the viewer and host are in different timezones, both are shown (e.g. "4:00 PM PST (7:00 PM MST)"). Each event records the host's timezone at creation for context.
- **Correct availability overlap** — the availability heatmap on the Admin and Members pages now correctly detects real cross-timezone overlap. A 5 PM slot for an Eastern user and a 5 PM slot for a Pacific user no longer incorrectly appear as the same time.
- **Timezone in session** — the user's IANA timezone is now included in the NextAuth JWT/session, eliminating extra DB queries for timezone lookups throughout the app.
- **Non-nullable timezone** — `User.timezone` is now required (defaults to "America/Phoenix"). The availability grid shows a timezone hint label so users know times are in their selected timezone. The create event modal notes "Times are in your timezone."
- **Data migration** — existing availability and event data migrated from assumed Phoenix local time to UTC via `prisma/migrate-timezone.ts`.

### v2.0.0 — 2026-03-09
- **Persistent teams** — new `/teams` page for creating and managing teams (clans/squads) that exist outside tournaments. Each team has a unique tag, game affiliation, bio, avatar, and configurable roster size. One team per game per player.
- **Team roles** — Captain (full control), Co-Captain (can invite), Member, Sub. Captains can promote/demote, remove members, and transfer captaincy.
- **Invite system** — captains and co-captains send invites to members. Pending invites shown as a banner on the Teams page with accept/decline. Invites expire after 7 days. Navbar shows a neon badge with pending invite count (desktop and mobile).
- **Team detail page** — full detail view at `/teams/[id]` with avatar, name, tag, game badge, W–L record from tournament matches, roster grid with role management, tournament history with placement, and disband (two-click confirmation).
- **3-step creation wizard** — Name/Tag/Game → Bio/Avatar → Review. Live tag uniqueness check with debounce.
- **Team tags across the site** — `[TAG]` shown next to player names on event lists, event detail modals, attendance modals, and member cards. Tags are game-context-aware (only shown when the event's game matches the team's game). Member card tags are clickable links to the team page.
- **Tournament integration** — captains can register their team for open tournaments matching the team's game via a "Register for Tournament" button. Registration snapshots the current roster into TournamentTeam + TournamentEntrant records, preserving bracket integrity. Team tags baked into tournament display names at join time. CreateTournamentModal Step 6 explains premade teams vs live draft options.

### v1.9.1 — 2026-03-07
- **Smooth scroll-to-top on navigation** — switching between any page (Schedule, About, Highlights, Members, Profile, etc.) now smoothly scrolls to the top instead of staying at the previous scroll position. Handled globally in the PageTransition component so every route change is covered.
- **Smooth schedule tab transitions** — switching between Calendar, Events, and Tournaments sub-tabs now fades smoothly with a 150ms opacity transition instead of instant swaps. Tournaments tab no longer stutters on load (removed per-card Framer Motion layout animations that were causing expensive layout recalculations on mount).
- **Schedule tab scroll reset** — switching sub-tabs within the schedule page also smooth-scrolls to the top.

### v1.9.0 — 2026-03-07
- **Tournament system** — new Tournaments tab on the Schedule page for creating and managing full tournament brackets. 6-step creation wizard with title, game, format, bracket type, seeding, schedule, slots, buy-in, and player selection.
- **6 bracket types** — Single Elimination (power-of-2 with byes), Double Elimination (winners + losers brackets + grand finals), Round Robin (circle method), Swiss (on-demand round generation with rematch avoidance), Constellation (main bracket + consolation brackets), and Free-for-All (point-based rounds with cumulative scoring).
- **Solo and team formats** — solo 1v1 tournaments or team tournaments with configurable team sizes. Game-specific presets (5v5 for LoL/Dota, 6v6 for OW). Three seeding modes: Random, Ranked, and Balanced Random.
- **Live snake draft** — team tournaments feature a real-time captain draft with snake ordering. Three captain selection modes (by rank, manual, random). 3-second polling for live updates. Auto-fill to randomly assign remaining players. Captains can rename teams.
- **Match reporting and confirmation** — participants report scores, opponents or admins confirm. Auto-advancement feeds winners into the next bracket round with correct routing for double elimination losers bracket and constellation consolation brackets.
- **Pick'ems** — predict match winners before the tournament starts. Predictions lock when the bracket is generated. Color-coded results and prediction standings leaderboard.
- **Tournament discussion** — comment thread per tournament for trash talk and coordination.
- **Buy-in and prize pool** — optional buy-in with calculated prize pool display (buy-in × max slots).
- **Tournament templates** — save and load bracket configurations for quick tournament creation.
- **Bracket sharing** — "Share Link" copies a direct URL that auto-opens the tournament detail modal. "Copy for Discord" generates a text-formatted bracket summary for pasting.
- **Multi-session tournaments** — tournaments can span multiple game nights with per-session dates or weekly frequency.
- **Best-of options** — Bo1 and Bo3 match formats with per-match score tracking.

### v1.8.0 — 2026-03-07
- **Friday-to-Thursday calendar** — calendar weeks now run Friday through Thursday, putting weekends front and center. Desktop retains the two-week (14-day) view with ±14 day navigation; mobile shows one week (7 days) with ±7 day navigation.
- **Mobile day selector redesign** — replaced horizontal scrolling day pills with a two-row grid: 3 wider weekend cards on top (Fri/Sat/Sun) and 4 weekday cards below (Mon–Thu). Event count badges, today dot indicator, and clean neon highlight on the selected day.
- **Responsive default view** — mobile users now default to Event List view, desktop users default to Calendar view. Toggle remains available on all devices.
- **Event detail modal** — clicking any event now opens a read-only detail view showing title, game, date, time, host, description, and RSVP lists (Going and Maybe). RSVP button, approve/reject, and mark attendance actions in-context. "Edit Settings" button visible only to the host, moderator, admin, or owner.
- **Edit permissions overhaul** — hosts can now edit their own events. Owner role added to all schedule authorization checks. Regular users see read-only details. Edit modal now shows full RSVP breakdown (Going, Maybe, Declined) with color-coded badges.
- **Compact calendar cards** — events in the calendar grid now show only game name and time for a cleaner look. Full details available via the detail modal.
- **Info bubble** — replaced the static info banner with a dismissable tutorial bubble for signed-in users. Glows on page load, collapses to an "i" icon when dismissed, persists across sessions via localStorage.
- **Navbar reorder** — signed-in nav order is now Home, Schedule, Polls, Members, Highlights, About, Admin, Profile.
- **Willing to Mod roster indicator** — players who opted to moderate show a "Willing to Mod" badge in the admin roster. Filter toggle with count pill to quickly surface moderation candidates.
- **Members carousel overhaul** — replaced CSS `@keyframes` animation with `requestAnimationFrame`-driven loop for seamless, glitch-free infinite scrolling. Pauses on hover and touch. Responsive card sizing.
- **Optimistic RSVP updates** — changing your RSVP instantly highlights the new choice and updates the Going/Maybe lists in the detail modal without waiting for the server round-trip.
- **Smooth modal transitions** — detail-to-edit modal transition waits for the exit animation to complete before opening the next modal, eliminating the flash. Info bubble uses height/opacity transitions instead of conditional rendering for fluid expand/collapse.
- **Mobile responsiveness pass** — form grids stack on small screens, touch targets enlarged for availability grids and heatmaps, action buttons always visible on mobile (no hover-only), tab gaps adjust for small screens.

### v1.7.0 — 2026-03-06
- **Members page tabs** — added underline-style tab navigation (Members | Games | Availability) with animated neon indicator. Games tab reuses the Game Popularity component and Availability tab reuses the Availability Heatmap component from the admin panel, giving all members visibility into game stats and scheduling overlap without needing admin access.
- **About page tabs** — added underline-style tab navigation (About | Changelog). Changelog tab displays the full version history as styled cards with neon version badges, plus a Roadmap section grouping future ideas by category.
- **Admin Insights tab** — new interactive analytics tab in the admin panel with 8 on-demand queries: Best Time for Game, Peak Availability, Squad Finder, Lonely Games, Inactive Members, Schedule Gaps, RSVP Stats, and Game Night History. Click a card to run the query, results appear inline with expandable player tags. Game-based insights have a dropdown selector and Run button. Visible to both admins and moderators.
- **Event host** — each event now has a designated host (defaults to creator). Host selector dropdown in create and edit modals. Host name displayed on event cards in both calendar and list views.
- **Attendance confirmation** — after an event's date passes, the host, creator, or any admin/mod can mark who actually showed up via a checklist modal. Pre-populated from RSVPs with select-all/clear. Confirmed events show a green checkmark badge. RSVP Stats insight now shows "showed" and "no-show" counts alongside RSVP data.
- **Attendance nudge** — admin panel shows a warning banner listing past events with unconfirmed attendance, prompting mods/admins to go to the schedule page and complete the roll call.

### v1.6.0 — 2026-03-06
- **Polls** — new `/polls` page where any authenticated user can create polls to gauge interest in plans (e.g. "Should we kill the Ender Dragon?" or "Which WoW raid this weekend?"). Single-select or multi-select voting with animated result bars. Optional game tag from the catalog. Comment thread under each poll (3 preview, expandable) for clarifications. Creators/admins can close or delete polls. Admins/mods can pin polls to the top. Rate limited to 5 polls per week for regular users.
- **Active nav highlighting** — the current page link in the navbar now turns neon green with bold text, so you always know which tab you're on. Works on both desktop and mobile menus.
- **Bold profile name** — the gamertag/username in the navbar is now bold for better visibility

### v1.5.0 — 2026-03-06
- **Role ladder** — replaced separate Promote/Mod buttons with a single role ladder system (Member → Moderator → Admin). Promote steps up one level, Demote steps down. Owners are protected from role changes.
- **Moderator restrictions** — moderators can view the admin panel but can no longer promote, demote, or remove users. All user management actions are admin-only (enforced in both UI and server actions).
- **Availability game filter** — the availability heatmap now has a game dropdown filter. Select a game to see only the availability of players who play that game. Useful for finding the best time to schedule a specific title.
- **Test user availability** — seed script now includes availability slots (17:00–23:00 range) for all 5 test users

### v1.4.0 — 2026-03-06
- **Invite-only events** — new visibility toggle (Public / Invite-Only) in the create event modal. Invite-only events auto-schedule without mod approval and are only visible to the creator and invitees. Creators can edit and delete their own invite-only events.
- **Member picker component** — searchable checkbox list with avatar, gamertag, and real name. Used in both event creation/editing and group management. Quick-select group buttons toggle all group members at once.
- **Invite guardrails** — rate limiting and input validation for non-admin users: 50-char title, 200-char description, no past dates, max 10 invitees, max 5 invite-only events per rolling 7 days, no self-invites. Admins bypass all limits.
- **Quick-select groups** — new "Quick-Select Groups" section on the profile page. Create, edit, and delete named groups of friends (max 10 groups, 10 members each). Groups appear as toggle buttons in the member picker for fast invites. Independent CRUD with per-group save buttons.
- **Visibility-aware query filtering** — schedule page queries now respect event visibility. Unauthenticated users only see public events. Regular users see public events plus invite-only events where they are creator or invitee. Admins/mods see everything.
- **Invite-Only badge** — shown on event cards in both calendar and list views
- **Creator editing** — creators of invite-only events can click their events to edit (not just admin/mod). Edit modal shows member picker for updating invitees. Status and recurring controls remain admin-only.
- **Invited members display** — invite-only events show the invited members list on event cards
- **Test seed script** — `prisma/seed-test-users.ts` for populating the database with realistic test data for development/testing

### v1.3.0 — 2026-03-06
- **User-created events** — any logged-in user can now create game night events. Regular user events require moderator/admin approval (status: "pending") before appearing publicly. Admin/mod events are auto-approved.
- **Approval workflow** — admins and moderators see pending events with Approve/Reject buttons. Pending events have dashed warning borders and badges; rejected events have danger styling. "Submitted by [name]" shown on pending events.
- **Recurring events improvements** — recurring is now admin/mod only. Configurable week count (2–12 weeks) replaces the old fixed 4-week limit. Day-of-week derived from selected date instead of a separate dropdown. All events in a recurring series linked by a shared group ID.
- **Delete recurring series** — "Delete All in Series" button in the edit modal lets admins/mods remove an entire recurring series at once.
- **Date bug fix** — events now land on the correct day regardless of timezone. Previously, selecting Wednesday could create events on Tuesday due to UTC midnight parsing.
- **Event status expansion** — status field now supports pending, scheduled, cancelled, and rejected. Edit modal dropdown updated to include all four. RSVP buttons only shown for scheduled events.

### v1.2.1 — 2026-03-06
- **Event descriptions** — admins and moderators can add an optional description when creating or editing game nights. Displayed to all users in both the calendar and event list views.

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