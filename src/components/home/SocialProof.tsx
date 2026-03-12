"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";

interface SocialProofProps {
  memberCount: number;
  eventsHosted: number;
  gamesAvailable: number;
}

export default function SocialProof({ memberCount, eventsHosted, gamesAvailable }: SocialProofProps) {
  const settings = useSiteSettings();
  const stats = [
    ...(settings.showMemberCount ? [{ label: "Members", value: String(memberCount) }] : []),
    { label: "Events Hosted", value: String(eventsHosted) },
    { label: "Games Available", value: `${gamesAvailable}+` },
  ];

  return (
    <section className="mx-auto max-w-4xl px-4 pb-16">
      <motion.div
        className="flex flex-wrap items-center justify-center gap-8 sm:gap-12"
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={staggerItem}
            className="text-center"
          >
            <p className="text-3xl font-bold text-neon text-glow-sm sm:text-4xl">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-foreground/50">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
