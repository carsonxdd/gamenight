"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface MemberData {
  name: string;
  avatar: string | null;
  games: string[];
  topRank: { gameName: string; rank: string; color: string } | null;
}

function InitialsAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-surface-lighter text-sm font-bold text-neon">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function MemberCardComponent({ member }: { member: MemberData }) {
  return (
    <div className="flex-shrink-0 w-72 rounded-xl border border-border bg-surface p-5 transition hover:border-neon/30">
      <div className="flex items-center gap-3">
        {member.avatar ? (
          <img
            src={member.avatar}
            alt={member.name}
            className="h-12 w-12 flex-shrink-0 rounded-full"
          />
        ) : (
          <InitialsAvatar name={member.name} />
        )}
        <p className="truncate font-semibold text-foreground">{member.name}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {member.games.slice(0, 3).map((game) => (
          <span
            key={game}
            className="rounded-full bg-neon/10 px-2 py-0.5 text-xs text-neon/80"
          >
            {game}
          </span>
        ))}
      </div>
      {member.topRank && (
        <div className="mt-2">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              color: member.topRank.color,
              backgroundColor: `${member.topRank.color}15`,
            }}
          >
            {member.topRank.gameName}: {member.topRank.rank}
          </span>
        </div>
      )}
    </div>
  );
}

interface MembersCarouselProps {
  members: MemberData[];
}

export default function MembersCarousel({ members }: MembersCarouselProps) {
  if (members.length === 0) return null;

  // Need enough cards to fill at least 2x the viewport width so the loop is seamless.
  // Each card is ~288px + 16px gap = ~304px. At 1920px wide that's ~7 cards visible.
  // We need at least ~14 cards per copy. Repeat the member list until we hit that.
  const minCards = 14;
  const repeatCount = Math.max(1, Math.ceil(minCards / members.length));
  const filledList: MemberData[] = [];
  for (let r = 0; r < repeatCount; r++) {
    filledList.push(...members);
  }

  return (
    <section className="py-16 overflow-hidden">
      <motion.div
        className="mb-8 text-center"
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        viewport={{ once: true }}
      >
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
          Gamers
        </h2>
        <p className="mt-2 text-foreground/50">
          locked in users
        </p>
      </motion.div>

      <div className="group relative">
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-background to-transparent" />

        <div className="animate-marquee group-hover:[animation-play-state:paused]">
          {/* Copy A */}
          <div className="flex gap-4 pr-4">
            {filledList.map((member, i) => (
              <MemberCardComponent key={`a-${i}`} member={member} />
            ))}
          </div>
          {/* Copy B — identical, so -50% lands exactly on the seam */}
          <div className="flex gap-4 pr-4">
            {filledList.map((member, i) => (
              <MemberCardComponent key={`b-${i}`} member={member} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/members"
          className="text-sm text-neon/70 transition hover:text-neon"
        >
          View All Members &rarr;
        </Link>
      </div>
    </section>
  );
}
