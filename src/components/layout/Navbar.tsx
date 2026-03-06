"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinkClass =
    "text-sm text-foreground/70 transition hover:text-neon";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-neon text-glow-sm">
          GN
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/" className={navLinkClass}>
            Home
          </Link>
          <Link href="/schedule" className={navLinkClass}>
            Schedule
          </Link>
          <Link href="/highlights" className={navLinkClass}>
            Highlights
          </Link>
          {session && (
            <>
              <Link href="/members" className={navLinkClass}>
                Members
              </Link>
              <Link href="/about" className={navLinkClass}>
                About
              </Link>
            </>
          )}
          {session?.user?.isAdmin && (
            <Link href="/admin" className={navLinkClass}>
              Admin
            </Link>
          )}

          {session ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="text-sm text-neon transition hover:text-neon-dim"
              >
                {session.user.gamertag || session.user.name}
              </Link>
              <button
                onClick={() => signOut()}
                className="rounded border border-border px-3 py-1.5 text-xs text-foreground/70 transition hover:border-danger hover:text-danger"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/signup"
              className="rounded bg-neon px-4 py-1.5 text-sm font-semibold text-background transition hover:bg-neon-dim"
            >
              Join
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex flex-col gap-1.5 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span
            className={`block h-0.5 w-6 bg-foreground transition ${mobileOpen ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`block h-0.5 w-6 bg-foreground transition ${mobileOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block h-0.5 w-6 bg-foreground transition ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden border-b border-border bg-surface md:hidden"
          >
            <div className="flex flex-col gap-4 p-4">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="text-foreground/70 transition hover:text-neon"
              >
                Home
              </Link>
              <Link
                href="/schedule"
                onClick={() => setMobileOpen(false)}
                className="text-foreground/70 transition hover:text-neon"
              >
                Schedule
              </Link>
              <Link
                href="/highlights"
                onClick={() => setMobileOpen(false)}
                className="text-foreground/70 transition hover:text-neon"
              >
                Highlights
              </Link>
              {session && (
                <>
                  <Link
                    href="/members"
                    onClick={() => setMobileOpen(false)}
                    className="text-foreground/70 transition hover:text-neon"
                  >
                    Members
                  </Link>
                  <Link
                    href="/about"
                    onClick={() => setMobileOpen(false)}
                    className="text-foreground/70 transition hover:text-neon"
                  >
                    About
                  </Link>
                </>
              )}
              {session?.user?.isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="text-foreground/70 transition hover:text-neon"
                >
                  Admin
                </Link>
              )}
              {session ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="text-neon transition hover:text-neon-dim"
                  >
                    {session.user.gamertag || session.user.name}
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="text-left text-foreground/70 transition hover:text-danger"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="text-foreground/70 transition hover:text-neon"
                >
                  Join
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
