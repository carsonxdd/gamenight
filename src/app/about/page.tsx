"use client";

import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { staggerContainer, staggerItem } from "@/lib/animations";

export default function AboutPage() {
  const { data: session } = useSession();
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
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt="Carson"
                  className="h-14 w-14 shrink-0 rounded-lg"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-neon/10 text-2xl font-bold text-neon text-glow-sm">
                  C
                </div>
              )}
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
            {/* Discord invite */}
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

            {/* GitHub */}
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
      </motion.div>
    </div>
  );
}
