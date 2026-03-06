"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Card from "@/components/ui/Card";
import { staggerContainer, staggerItem } from "@/lib/animations";

export default function CTASection() {
  const { data: session } = useSession();

  return (
    <section className="mx-auto max-w-4xl px-4 py-20">
      <h2 className="mb-2 text-center text-3xl font-bold text-foreground">
        Ready to Play?
      </h2>
      <p className="mb-10 text-center text-foreground/50">
        Get started in under a minute
      </p>

      <motion.div
        className="grid gap-6 sm:grid-cols-2"
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
      >
        {!session && (
          <motion.div variants={staggerItem}>
            <Link href="/signup" className="block">
              <Card className="group h-full transition hover:border-neon/50 hover:bg-surface-light">
                <div className="mb-3 text-3xl">🎯</div>
                <h3 className="mb-2 text-lg font-bold text-foreground group-hover:text-neon transition">
                  Sign Up
                </h3>
                <p className="text-sm text-foreground/50">
                  Connect with Discord, pick your games, and set your
                  availability.
                </p>
              </Card>
            </Link>
          </motion.div>
        )}

        <motion.div variants={staggerItem}>
          <Link href="/schedule" className="block">
            <Card className="group h-full transition hover:border-neon/50 hover:bg-surface-light">
              <div className="mb-3 text-3xl">📅</div>
              <h3 className="mb-2 text-lg font-bold text-foreground group-hover:text-neon transition">
                View Schedule
              </h3>
              <p className="text-sm text-foreground/50">
                Check upcoming game nights, RSVP, and see who&apos;s playing.
              </p>
            </Card>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
