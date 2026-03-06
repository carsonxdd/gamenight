# Caplan's Game Night

**v1.6.0**

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
- **Admin/mod inline editing** — admins and moderators can click any event in the calendar or list view to open an edit modal. Update title, description, date, time, game, status (pending/scheduled/cancelled/rejected), and recurring flag. Includes delete with two-click confirmation.
- **Info banner** — directs logged-in users to create events or invite-only sessions; unauthenticated users told to sign in
- RSVP system (confirmed / maybe / declined) — only shown for scheduled events (hidden for pending/rejected/cancelled)

### Polls (`/polls`, authenticated)
- **Create polls** — any logged-in user can create a poll with a question, optional description, optional game tag from the catalog, and 2–10 options. Toggle between single-select and multi-select.
- **Vote** — click options and submit. Animated result bars show vote counts and percentages after voting. Users can change their vote while the poll is active.
- **Comments** — small comment thread under each poll for clarifications (e.g. "I'd do Ender Dragon if we have 6+"). Shows 3 comments by default with "show more" expand. Max 300 chars per comment. Authors and admins can delete comments.
- **Poll management** — creators, admins, and moderators can close or delete polls. Two-click delete confirmation.
- **Pinning** — admins/mods can pin polls to the top of the list (neon glow border on pinned polls).
- **Filtering** — tab toggle between All, Active, and Closed polls.
- **Rate limiting** — regular users limited to 5 polls per rolling 7 days. Admins bypass all limits.

### Roles & Permissions
- **Owner** (CarsonXD) — full access, gold glowing border on member cards
- **Admin** — full access including user management (role ladder promote/demote, remove users)
- **Moderator** — access to admin panel (view-only roster, no user management), can create/edit/delete game nights. Dark red glowing border on member cards
- **Member** — default role, can RSVP and manage own profile
- Role badges displayed on member cards in both the members page and home page carousel

### Admin Panel (`/admin`)
- **Game Popularity** — ranked by player count with expandable player lists
- **Availability Heatmap** — aggregated grid showing player overlap with click-to-reveal names; filterable by game to see who's available for a specific title
- **RSVP Overview** — game night cards with status badge counts
- **Player Roster** — searchable table with role ladder promote/demote (Member → Moderator → Admin), owner/admin/mod badges, and remove with confirmation. User management actions restricted to admins only; moderators can view the roster but cannot promote, demote, or remove anyone.
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
- **Active nav highlighting** — current page link turns neon green with bold text in both desktop and mobile nav. Uses pathname matching (exact for Home, prefix for all other routes).
- Signed-in users see their **bold** gamertag as a profile link in the navbar; signup/join buttons hidden

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
│   ├── polls/              # Polls + server actions
│   ├── profile/            # Profile editing + server actions
│   ├── schedule/           # Calendar/event views + server actions
│   ├── signup/             # Discord auth + onboarding
│   └── api/                # API routes (NextAuth)
├── components/
│   ├── admin/              # Dashboard tabs (games, heatmap, RSVPs, roster)
│   ├── home/               # Landing page (hero, intro, social proof,
│   │                       # members carousel, highlight cards)
│   ├── members/            # Members page (card grid, member card)
│   ├── polls/              # Poll list, poll card, create modal, comments
│   ├── profile/            # Invite group manager
│   ├── schedule/           # Calendar, event list, RSVP, create/edit modals,
│   │                       # member picker for invite-only events
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
- **GameNight** — scheduled events with optional title, optional description, date, time, game, status (pending/scheduled/cancelled/rejected), visibility (public/invite_only), recurring options, recurGroupId for series linking
- **GameNightAttendee** — RSVP status per user per game night
- **GameNightInvite** — invite records linking users to invite-only game nights (cascade delete)
- **InviteGroup** — named quick-select groups owned by a user
- **InviteGroupMember** — members of an invite group (cascade delete on group or user deletion)
- **Poll** — community polls with title, optional description, optional game tag, single/multi-select, status (active/closed), pinned flag, creator reference
- **PollOption** — individual options within a poll
- **PollVote** — user votes on poll options (unique per poll+option+user, cascade delete)
- **PollComment** — short comment thread per poll (max 300 chars, cascade delete)

## Future Ideas

Discord Bot

Event announcements and RSVP pings
Admin controls to trigger announcements from the site

Moderation & Admin

~~Community event proposals with voting and admin approval~~ *(shipped in v1.3.0 — user-created events with mod approval)*
~~Invite-only / private events~~ *(shipped in v1.4.0 — invite-only events with quick-select groups)*

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
~~In-app polls and quick votes~~ *(shipped in v1.6.0 — polls with voting, comments, and pinning)*

Quality of Life

Dark/light theme toggle
Event templates for recurring game nights
Spectator RSVP option

## Version History

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
- **Test seed script** — `prisma/seed-test-users.ts` creates 5 realistic test users with games, competitive ranks, availability slots, favorite games, and social links for development/testing

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