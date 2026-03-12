"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getMyPendingInvites } from "@/app/teams/actions";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const settings = useSiteSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [inviteCount, setInviteCount] = useState(0);

  useEffect(() => {
    if (session?.user?.id) {
      getMyPendingInvites().then((result) => {
        if ("invites" in result && result.invites) setInviteCount(result.invites.length);
      });
    }
  }, [session?.user?.id, pathname]);

  const navLink = (href: string) => {
    const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return `text-sm transition hover:text-neon ${isActive ? "text-neon font-semibold" : "text-foreground/70"}`;
  };

  const mobileNavLink = (href: string) => {
    const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return `transition hover:text-neon ${isActive ? "text-neon font-semibold" : "text-foreground/70"}`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-neon text-glow-sm">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt={settings.communityName} className="h-8 w-8 rounded object-contain" />
          ) : (
            "GN"
          )}
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/" className={navLink("/")}>
            Home
          </Link>
          <Link href="/schedule" className={navLink("/schedule")}>
            Schedule
          </Link>
          {session && (
            <>
              {settings.enablePolls && (
                <Link href="/polls" className={navLink("/polls")}>
                  Polls
                </Link>
              )}
              <Link href="/members" className={navLink("/members")}>
                Members
              </Link>
              {settings.enableTeams && (
                <Link href="/teams" className={`${navLink("/teams")} relative`}>
                  Teams
                  {inviteCount > 0 && (
                    <span className="absolute -top-1.5 -right-3 flex h-4 w-4 items-center justify-center rounded-full bg-neon text-[10px] font-bold text-background">
                      {inviteCount}
                    </span>
                  )}
                </Link>
              )}
            </>
          )}
          {settings.enableHighlights && (
            <Link href="/highlights" className={navLink("/highlights")}>
              Highlights
            </Link>
          )}
          <Link href="/about" className={navLink("/about")}>
            About
          </Link>
          {(session?.user?.isAdmin || session?.user?.isModerator) && (
            <Link href="/admin" className={navLink("/admin")}>
              Admin
            </Link>
          )}

          {session ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="text-sm font-bold text-neon transition hover:text-neon-dim"
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
                className={mobileNavLink("/")}
              >
                Home
              </Link>
              <Link
                href="/schedule"
                onClick={() => setMobileOpen(false)}
                className={mobileNavLink("/schedule")}
              >
                Schedule
              </Link>
              {session && (
                <>
                  {settings.enablePolls && (
                    <Link
                      href="/polls"
                      onClick={() => setMobileOpen(false)}
                      className={mobileNavLink("/polls")}
                    >
                      Polls
                    </Link>
                  )}
                  <Link
                    href="/members"
                    onClick={() => setMobileOpen(false)}
                    className={mobileNavLink("/members")}
                  >
                    Members
                  </Link>
                  {settings.enableTeams && (
                    <Link
                      href="/teams"
                      onClick={() => setMobileOpen(false)}
                      className={`${mobileNavLink("/teams")} inline-flex items-center gap-2`}
                    >
                      Teams
                      {inviteCount > 0 && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-neon text-[10px] font-bold text-background">
                          {inviteCount}
                        </span>
                      )}
                    </Link>
                  )}
                </>
              )}
              {settings.enableHighlights && (
                <Link
                  href="/highlights"
                  onClick={() => setMobileOpen(false)}
                  className={mobileNavLink("/highlights")}
                >
                  Highlights
                </Link>
              )}
              <Link
                href="/about"
                onClick={() => setMobileOpen(false)}
                className={mobileNavLink("/about")}
              >
                About
              </Link>
              {(session?.user?.isAdmin || session?.user?.isModerator) && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className={mobileNavLink("/admin")}
                >
                  Admin
                </Link>
              )}
              {session ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="font-bold text-neon transition hover:text-neon-dim"
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
