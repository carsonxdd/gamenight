"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";

type Tab = "About" | "Changelog";
const TABS: Tab[] = ["About", "Changelog"];

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState<Tab>("About");

  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex flex-col gap-16"
      >
        {/* Header */}
        <motion.div variants={staggerItem}>
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-neon text-glow-sm sm:text-5xl">
            About
          </h1>
          <div className="mt-3 h-px w-16 bg-neon/40" />
        </motion.div>

        {/* Tab Navigation */}
        <motion.div variants={staggerItem} className="-mt-8 flex gap-3 border-b border-border sm:gap-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative pb-3 text-sm font-medium transition ${
                activeTab === tab
                  ? "text-neon"
                  : "text-foreground/40 hover:text-foreground/70"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="about-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        {activeTab === "About" && <AboutContent />}
        {activeTab === "Changelog" && <ChangelogContent />}
      </motion.div>
    </div>
  );
}

function AboutContent() {
  return (
    <>
      {/* The Story */}
      <motion.section variants={staggerItem}>
        <h2 className="mb-4 text-xl font-bold text-foreground">The Story</h2>
        <div className="rounded-xl border border-border bg-surface p-6 text-foreground/70 leading-relaxed space-y-3">
          <p>
            Game nights have been a thing in the friend group for years, hopping into Discord,
            throwing together 5v5s, running lobbies until 2 AM. It was always a blast but the
            coordination was chaos. Who&apos;s free? What are we playing? Did anyone tell the new guy?
          </p>
          <p>
            This site is the proper hub it deserved. One place to see who plays what, find a time
            that works, and just show up and play. No more @everyone pings that half the group
            misses.
          </p>
        </div>
      </motion.section>

      {/* About the Organizer */}
      <motion.section variants={staggerItem}>
        <h2 className="mb-4 text-xl font-bold text-foreground">About the Organizer</h2>
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="flex items-start gap-4">
            <img
              src="/CarsonProfile.jpg"
              alt="Carson"
              className="h-14 w-14 shrink-0 rounded-lg object-cover"
            />
            <div className="text-foreground/70 leading-relaxed space-y-3">
              <p>
                I&apos;m Carson, I&apos;ve been building and working with PCs since I was 13
                and have been an avid PC gamer ever since. I love all types of games honestly,
                if it&apos;s competitive I&apos;m locking in. I also cook a lot in my free time,
                so trust me when I say I understand why organization matters.
              </p>
              <p>
                I built this because I wanted a better way to get everyone together. Hopefully
                this site makes it easier to link up and keeps us closer as a group. At the end
                of the day I&apos;m just a gamer who wanted to solve a problem for his friends,
                and this is what came out of it.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Privacy & Security */}
      <motion.section variants={staggerItem}>
        <h2 className="mb-4 text-xl font-bold text-foreground">Privacy &amp; Security</h2>
        <div className="rounded-xl border border-border bg-surface p-6 text-foreground/70 leading-relaxed space-y-3">
          <p>
            We use <span className="text-foreground">Discord OAuth2</span> to sign you in. This means
            Discord handles your login directly — your password never touches our site.
          </p>
          <p>
            The only info we receive from Discord is your <span className="text-foreground">username</span> and{" "}
            <span className="text-foreground">profile picture</span>. We <span className="text-foreground">cannot</span> see
            your email, password, DMs, friends list, servers, or any other account details.
          </p>
          <p>
            Everything else on your profile (gamertag, games, availability, social links) is info you
            choose to fill in yourself. Nothing is pulled from Discord beyond the basics above.
          </p>
        </div>
      </motion.section>

      {/* Links */}
      <motion.section variants={staggerItem}>
        <h2 className="mb-4 text-xl font-bold text-foreground">Links</h2>
        <div className="flex flex-wrap items-center gap-4">
          <a
            href="https://discord.gg/PLACEHOLDER"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-discord px-5 py-2.5 font-semibold text-white transition hover:bg-discord-hover"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Join the Discord
          </a>
          <a
            href="https://github.com/carsonxdd"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-foreground/50 transition hover:border-border-light hover:text-foreground/70"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </a>
          {/* TODO: Uncomment when carsoncaplan.com is live */}
          {/* <a
            href="https://carsoncaplan.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-foreground/50 transition hover:border-border-light hover:text-foreground/70"
          >
            carsoncaplan.com
          </a> */}
        </div>
      </motion.section>
    </>
  );
}

const VERSION_HISTORY = [
  {
    version: "v2.2.0",
    date: "2026-03-10",
    changes: [
      "Prime/extended time windows — availability grids and heatmaps visually distinguish prime time (5–11 PM Phoenix, bright neon) from extended hours (2 PM–1 AM, dimmed/muted)",
      "Admin site settings panel — configure time windows, anchor timezone, event/poll limits, community name, and MOTD",
      "Availability heatmap timezone fix — cross-midnight splitting, dynamic time slots, and duplicate player deduplication",
      "Comprehensive seed data — 15 users, 20 events across US timezones, 6 teams, 8 polls, 7 tournaments with proper UTC timing",
    ],
  },
  {
    version: "v2.1.0",
    date: "2026-03-09",
    changes: [
      "Timezone normalization — all times stored in UTC internally, converted to each viewer's timezone for display",
      "Cross-timezone event display — dual timezone shown when viewer and host differ (e.g. \"4:00 PM PST (7:00 PM MST)\")",
      "Correct availability overlap — heatmap detects real cross-timezone overlap instead of matching by clock time",
      "Timezone in session — user's IANA timezone included in NextAuth JWT/session",
      "Non-nullable timezone — User.timezone now required (defaults to America/Phoenix)",
    ],
  },
  {
    version: "v2.0.0",
    date: "2026-03-09",
    changes: [
      "Persistent teams — /teams page for creating clans/squads with unique tags, game affiliation, bio, avatar, and configurable roster size",
      "Team roles — Captain, Co-Captain, Member, Sub with promote/demote and captaincy transfer",
      "Invite system — captains/co-captains send invites, accept/decline from Teams page, 7-day expiry, navbar badge",
      "Team detail page — avatar, roster grid with role management, W–L record, tournament history, disband option",
      "3-step creation wizard — Name/Tag/Game → Bio/Avatar → Review with live tag availability check",
      "Team tags across the site — [TAG] badges on event lists, detail modals, attendance, and member cards (game-context-aware)",
      "Tournament integration — register persistent teams for matching tournaments, roster snapshot preserves bracket integrity",
    ],
  },
  {
    version: "v1.9.1",
    date: "2026-03-07",
    changes: [
      "Smooth scroll-to-top on navigation — every route change scrolls to top instead of preserving scroll position",
      "Smooth schedule tab transitions — 150ms opacity fade between Calendar, Events, and Tournaments tabs",
      "Schedule tab scroll reset — switching sub-tabs also scrolls to top",
    ],
  },
  {
    version: "v1.9.0",
    date: "2026-03-07",
    changes: [
      "Tournament system — new Tournaments tab on the Schedule page with 6-step creation wizard",
      "6 bracket types — Single Elimination, Double Elimination, Round Robin, Swiss, Constellation, and Free-for-All",
      "Solo and team formats — 1v1 or team with configurable sizes and game-specific presets",
      "Live snake draft — real-time captain draft with 3-second polling, auto-fill, and team renaming",
      "Match reporting — participants report scores with opponent/admin confirmation and auto-advancement",
      "Pick'ems — predict match winners with color-coded results and prediction leaderboard",
      "Tournament discussion — comment thread per tournament",
      "Buy-in and prize pool display, tournament templates, bracket sharing, multi-session scheduling",
    ],
  },
  {
    version: "v1.8.0",
    date: "2026-03-07",
    changes: [
      "Friday-to-Thursday calendar — weeks run Fri-Thu to keep weekends front and center, with separate mobile (7-day) and desktop (14-day) views",
      "Mobile day selector redesign — two-row grid with wider weekend cards on top, event count badges, and today dot indicator",
      "Responsive default view — mobile defaults to Event List, desktop to Calendar",
      "Event detail modal — read-only view with RSVP lists, host info, and Edit Settings button for authorized users",
      "Edit permissions overhaul — hosts can edit their own events, owner role included in all auth checks",
      "Compact calendar cards — game name and time only in the calendar grid",
      "Info bubble — dismissable tutorial hint with glow, collapses to an info icon, persists across sessions",
      "Navbar reorder — Home, Schedule, Polls, Members, Highlights, About, Admin, Profile",
      "Willing to Mod roster badge and filter toggle in the admin panel",
      "Members carousel rebuilt with requestAnimationFrame for seamless looping",
      "Optimistic RSVP updates — button highlights and Going/Maybe lists update instantly on click",
      "Smooth modal transitions — detail-to-edit crossfade, fluid info bubble expand/collapse",
      "Mobile responsiveness pass — stacking grids, larger touch targets, always-visible action buttons",
    ],
  },
  {
    version: "v1.7.0",
    date: "2026-03-06",
    changes: [
      "Members page tabs — Members, Games, and Availability tabs with animated neon indicator",
      "About page tabs — About and Changelog tabs with version history and roadmap",
      "Admin Insights tab — 8 interactive analytics queries (Best Time for Game, Peak Availability, Squad Finder, Lonely Games, Inactive Members, Schedule Gaps, RSVP Stats, Game Night History)",
      "Event host — each event has a designated host with a selector in create/edit modals",
      "Attendance confirmation — mark who actually showed up after events, with checklist modal and reliability tracking",
      "Attendance nudge — admin panel banner prompting attendance confirmation for past events",
    ],
  },
  {
    version: "v1.6.0",
    date: "2026-03-06",
    changes: [
      "Polls — create polls to gauge interest in plans with single/multi-select voting, animated result bars, optional game tags, and comment threads",
      "Active nav highlighting — current page link turns neon green with bold text",
      "Bold profile name in the navbar",
    ],
  },
  {
    version: "v1.5.0",
    date: "2026-03-06",
    changes: [
      "Role ladder — single promote/demote system (Member → Moderator → Admin)",
      "Moderator restrictions — mods can view admin panel but cannot manage users",
      "Availability game filter on the heatmap",
      "Test user availability in seed script",
    ],
  },
  {
    version: "v1.4.0",
    date: "2026-03-06",
    changes: [
      "Invite-only events with auto-scheduling and creator editing",
      "Member picker component with search, avatars, and quick-select groups",
      "Invite guardrails — rate limiting and input validation for non-admin users",
      "Quick-select groups on the profile page for fast event invites",
      "Visibility-aware query filtering for events",
    ],
  },
  {
    version: "v1.3.0",
    date: "2026-03-06",
    changes: [
      "User-created events with moderator/admin approval workflow",
      "Recurring events improvements — configurable week count (2–12), admin/mod only",
      "Delete recurring series in one click",
      "Date bug fix — events now land on the correct day regardless of timezone",
    ],
  },
  {
    version: "v1.2.1",
    date: "2026-03-06",
    changes: [
      "Event descriptions — admins and moderators can add optional descriptions to game nights",
    ],
  },
  {
    version: "v1.2.0",
    date: "2026-03-06",
    changes: [
      "Moderator and Owner roles with visual indicators (glowing borders, badges)",
      "Moderator management from the Player Roster",
      "Privacy notice on signup and About page",
    ],
  },
  {
    version: "v1.1.0",
    date: "2026-03-06",
    changes: [
      "Members page with searchable card grid, avatars, game tags, and rank badges",
      "Social links on profiles and member cards",
      "Event titles and admin inline editing",
      "Recurring events (auto-create 4 weeks)",
    ],
  },
  {
    version: "v1.0.0",
    date: "2026-03-05",
    changes: [
      "Discord OAuth authentication with JWT sessions",
      "Player profiles — gamertag, timezone map, game selection, availability grid",
      "Extended profiles — favorite games, rank selector, social links, tournament interest",
      "Scheduling — two-week calendar, event list, RSVP system",
      "Admin panel — game popularity, availability heatmap, RSVP overview, player roster",
      "Landing page — hero, social proof stats, members carousel, highlight cards",
      "About page — origin story, organizer bio, Discord/GitHub links",
    ],
  },
  {
    version: "v0.1.0",
    date: "2026-03-04",
    changes: ["Initial Next.js scaffold"],
  },
];

const FUTURE_IDEAS = [
  {
    category: "Discord Bot",
    items: [
      "Event announcements and RSVP pings",
      "Admin controls to trigger announcements from the site",
    ],
  },
  {
    category: "Competitive",
    items: [
      "Leaderboards and win/loss tracking",
      "Seasons with standings and playoffs",
    ],
  },
  {
    category: "Community",
    items: [
      "Game night recaps with highlights and clips",
      "Shoutout wall / kudos after events",
      "Looking-for-group status for pickup games",
    ],
  },
  {
    category: "Scheduling",
    items: [
      "Auto-suggest best times from availability overlap",
      "Game rotation suggestions based on recent history",
      "Waitlist with auto-promote on cancellation",
      "Calendar sync (Google Calendar / iCal)",
    ],
  },
  {
    category: "Engagement",
    items: [
      "Weekly digest via email or Discord DM",
      "Badges and streaks",
    ],
  },
  {
    category: "Quality of Life",
    items: [
      "Dark/light theme toggle",
      "Event templates for recurring game nights",
      "Spectator RSVP option",
    ],
  },
];

function ChangelogContent() {
  return (
    <>
      {/* Version History */}
      <motion.section variants={staggerItem}>
        <h2 className="mb-6 text-xl font-bold text-foreground">Version History</h2>
        <div className="space-y-4">
          {VERSION_HISTORY.map((release) => (
            <div
              key={release.version}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="mb-3 flex items-baseline gap-3">
                <span className="text-sm font-bold text-neon">{release.version}</span>
                <span className="text-xs text-foreground/40">{release.date}</span>
              </div>
              <ul className="space-y-1.5">
                {release.changes.map((change, i) => (
                  <li key={i} className="flex gap-2 text-sm text-foreground/70">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon/40" />
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Future Ideas */}
      <motion.section variants={staggerItem}>
        <h2 className="mb-6 text-xl font-bold text-foreground">Roadmap</h2>
        <div className="space-y-4">
          {FUTURE_IDEAS.map((group) => (
            <div
              key={group.category}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                {group.category}
              </h3>
              <ul className="space-y-1.5">
                {group.items.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-foreground/50">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/20" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.section>
    </>
  );
}
