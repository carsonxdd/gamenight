"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";

interface Highlight {
  id: string;
  title: string;
  date: string;
  description: string;
}

const placeholderHighlights: Highlight[] = [
  {
    id: "1",
    title: "Valorant Ace Clutch",
    date: "Feb 21, 2026",
    description:
      "Carson clutched a 1v5 ace on Ascent to force overtime. The lobby lost it.",
  },
  {
    id: "2",
    title: "Rocket League OT Thriller",
    date: "Feb 14, 2026",
    description:
      "3-minute overtime that ended with a ceiling shot double-tap. Absolute chaos.",
  },
  {
    id: "3",
    title: "Among Us Triple Kill",
    date: "Feb 7, 2026",
    description:
      "Milo pulled off three kills in a row without anyone calling a meeting. Legendary impostor run.",
  },
];

export default function HighlightCards() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="mb-2 text-center text-2xl font-bold text-foreground sm:text-3xl">
        Highlights
      </h2>
      <p className="mb-10 text-center text-foreground/50">
        Epic moments from game night
      </p>

      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
      >
        {placeholderHighlights.map((item) => (
          <motion.div
            key={item.id}
            variants={staggerItem}
            className="group rounded-xl border border-border bg-surface p-5 transition hover:border-neon/40"
          >
            {/* Placeholder image area */}
            <div className="mb-4 flex aspect-video items-center justify-center rounded-lg bg-surface-light">
              <span className="text-4xl opacity-20">
                {item.id === "1" ? "🎯" : item.id === "2" ? "🚀" : "🔪"}
              </span>
            </div>
            <p className="mb-1 text-xs text-foreground/40">{item.date}</p>
            <h3 className="mb-2 font-semibold text-foreground group-hover:text-neon transition">
              {item.title}
            </h3>
            <p className="text-sm leading-relaxed text-foreground/60">
              {item.description}
            </p>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-8 text-center">
        <Link
          href="/highlights"
          className="text-sm text-neon/70 transition hover:text-neon"
        >
          See All Highlights &rarr;
        </Link>
      </div>
    </section>
  );
}
