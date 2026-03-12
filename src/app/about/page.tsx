"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";

type Tab = "About" | "Changelog" | "FAQ";
const TABS: Tab[] = ["About", "Changelog", "FAQ"];

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
        {activeTab === "FAQ" && <FAQContent />}
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
    version: "v0.6.0",
    date: "2026-03-11",
    changes: [
      "Admin site settings panel — configure prime/extended time windows, anchor timezone, event/poll limits, community name, and MOTD",
      "Prime/extended time windows — availability grids and heatmaps visually distinguish prime time (bright neon) from extended hours (dimmed/muted), auto-converted to each viewer's timezone",
      "Reactive prime time highlighting — grid recomputes when user changes timezone in the form, with timezone-aware legends shared between grid and heatmap",
      "Heatmap timezone fixes — cross-midnight splitting, dynamic time slots, duplicate player deduplication",
      "Lint cleanup — resolved all ESLint errors across 7 components",
      "Test infrastructure — Vitest with 17 tests covering timezone conversion, prime time slots, and legend formatting",
      "Comprehensive seed data — 13 users across 7 US timezones, 20 events, 6 teams, 8 polls, 7 tournaments",
    ],
  },
  {
    version: "v0.5.0",
    date: "2026-03-09",
    changes: [
      "Persistent teams — /teams page for creating clans/squads with unique tags, game affiliation, bio, avatar, and configurable roster size",
      "Team roles and invites — Captain, Co-Captain, Member, Sub with promote/demote, captaincy transfer, invite system with accept/decline and navbar badge",
      "Team detail page — W–L record, roster grid with role management, tournament history, disband confirmation",
      "Team tags across the site — [TAG] badges on events, modals, attendance, and member cards (game-context-aware, clickable)",
      "Tournament integration — register premade teams, roster snapshot preserves bracket integrity",
      "Timezone normalization — all times stored in UTC, converted to each viewer's timezone. DST-safe via Intl.DateTimeFormat",
      "Cross-timezone event display — dual timezone shown when viewer and host differ (e.g. \"4:00 PM PST (7:00 PM MST)\")",
      "Correct availability overlap — heatmap detects real cross-timezone overlap instead of matching by clock time",
    ],
  },
  {
    version: "v0.4.0",
    date: "2026-03-07",
    changes: [
      "Tournament system — new Tournaments tab with 6-step creation wizard, 6 bracket types (Single Elim, Double Elim, Round Robin, Swiss, Constellation, FFA)",
      "Solo and team formats — 1v1 or team with configurable sizes, game-specific presets, 3 seeding modes",
      "Live snake draft — real-time captain draft with 3-second polling, auto-fill, and team renaming",
      "Match reporting with opponent/admin confirmation and auto-advancement through brackets",
      "Pick'ems, tournament comments, buy-in/prize pool, templates, bracket sharing, multi-session scheduling",
      "Friday-to-Thursday calendar — weekends front and center, two-week desktop view, one-week mobile with grid day selector",
      "Event detail modal — read-only view with RSVP lists, host info, edit permissions for hosts/mods/admins",
      "Mobile responsiveness pass — stacking grids, larger touch targets, always-visible action buttons",
      "Optimistic RSVP updates, smooth page transitions, and scroll-to-top on navigation",
    ],
  },
  {
    version: "v0.3.0",
    date: "2026-03-06",
    changes: [
      "Members page — searchable card grid with avatars, game tags, rank badges, social links. Tabbed: Members | Games | Availability",
      "Roles — Moderator (admin panel access) and Owner (gold glow). Role ladder: Member → Moderator → Admin",
      "Polls — single/multi-select voting, animated result bars, game tags, comment threads, pin/close/delete",
      "User-created events with moderator approval workflow and status system (pending, scheduled, cancelled, rejected)",
      "Invite-only events — visibility toggle, member picker with quick-select groups, rate limiting",
      "Recurring events — admin/mod only, 2–12 week count, delete entire series",
      "Admin Insights tab — 8 on-demand analytics queries (Best Time for Game, Squad Finder, RSVP Stats, etc.)",
      "Event host and attendance — designated host per event, post-event attendance confirmation checklist",
      "About page tabs with version history cards and Roadmap section",
      "Privacy notice on signup and About page",
    ],
  },
  {
    version: "v0.2.0",
    date: "2026-03-05",
    changes: [
      "Discord OAuth authentication with JWT sessions",
      "Player profiles — gamertag, interactive US timezone map, game selection, drag-select availability grid",
      "Extended profiles — favorite games, visual rank selector with tier colors, social links, tournament interest",
      "Scheduling — two-week calendar, event list, RSVP system (confirmed/maybe/declined)",
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

const FAQ_ITEMS = [
  {
    question: "How do I join?",
    answer: "Click \"Join\" in the top right and sign in with your Discord account. Depending on the community settings, you might need an invite code or admin approval.",
  },
  {
    question: "What info does Discord share with this site?",
    answer: "Only your username and profile picture. We cannot see your email, password, DMs, friends list, servers, or any other account details.",
  },
  {
    question: "How do I set up my profile?",
    answer: "After signing in, go to your Profile page. Add your gamertag, select your timezone, pick the games you play, and set your weekly availability so others can find the best time to play.",
  },
  {
    question: "How do events work?",
    answer: "Anyone (or just admins, depending on settings) can create game night events. RSVP with Confirmed, Maybe, or Declined. Hosts can mark attendance after the event.",
  },
  {
    question: "What are tournaments?",
    answer: "Organized bracket competitions. Admins create tournaments with various formats (single/double elimination, round robin, swiss, etc.). Join solo or with a team, report match results, and compete for the win.",
  },
  {
    question: "How do teams work?",
    answer: "Create a persistent team with a unique tag (like a clan tag). Invite members, assign roles (Captain, Co-Captain, Member, Sub), and register your team for tournaments together.",
  },
  {
    question: "What does the availability grid do?",
    answer: "It lets you mark when you're free each week. The site uses this to find overlapping times across players, helping organizers pick the best time for events. All times are automatically converted to each viewer's timezone.",
  },
  {
    question: "Can I suggest new features?",
    answer: "Yes! Go to your Profile page and scroll to the Suggestions section at the bottom. Submit your idea there and admins will review it.",
  },
];

function FAQContent() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <motion.section variants={staggerItem}>
      <h2 className="mb-6 text-xl font-bold text-foreground">Frequently Asked Questions</h2>
      <div className="space-y-2">
        {FAQ_ITEMS.map((faq, i) => (
          <motion.div
            key={i}
            variants={staggerItem}
            className="rounded-xl border border-border bg-surface overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-foreground transition hover:text-neon"
            >
              {faq.question}
              <span className={`ml-2 shrink-0 text-foreground/30 transition-transform ${openIndex === i ? "rotate-45" : ""}`}>
                +
              </span>
            </button>
            <AnimatePresence initial={false}>
              {openIndex === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-border overflow-hidden"
                >
                  <p className="px-5 py-4 text-sm text-foreground/70 leading-relaxed">
                    {faq.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
