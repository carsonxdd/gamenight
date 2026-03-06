"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations";

export default function HeroSection() {
  const { data: session } = useSession();

  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden">
      {/* Animated grid background — GPU accelerated */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden will-change-transform">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,255,65,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.3) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
            transform: "translateZ(0)",
          }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background"
          style={{ transform: "translateZ(0)" }}
        />
      </div>

      <motion.div
        className="relative z-10 px-4 text-center"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.h1
          className="mb-4 text-5xl font-extrabold tracking-tight text-neon text-glow-sm sm:text-7xl"
          variants={staggerItem}
        >
          Caplan&apos;s Game Night
        </motion.h1>
        <motion.p
          className="mx-auto mb-8 max-w-md text-lg text-foreground/60"
          variants={staggerItem}
        >
          Weekly gaming events with the boys. Sign up, pick your games,
          and lock in your nights.
        </motion.p>
        <motion.div
          className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          variants={staggerItem}
        >
          {!session && (
            <Link
              href="/signup"
              className="inline-flex items-center rounded-lg bg-neon px-8 py-3 font-semibold text-background transition hover:bg-neon-dim box-glow"
            >
              Join Now
            </Link>
          )}
          <Link
            href="/schedule"
            className="inline-flex items-center rounded-lg border border-neon px-8 py-3 font-semibold text-neon transition hover:bg-neon/10"
          >
            View Schedule
          </Link>
        </motion.div>
      </motion.div>

      {/* Glow orb */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon/3 blur-[140px] will-change-transform"
        style={{ transform: "translateZ(0)" }}
        {...fadeIn}
      />
    </section>
  );
}
