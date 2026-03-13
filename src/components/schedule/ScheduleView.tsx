"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import WeeklyCalendar from "./WeeklyCalendar";
import EventList from "./EventList";
import CreateGameNightModal from "./CreateGameNightModal";
import EditGameNightModal from "./EditGameNightModal";
import EventDetailModal from "./EventDetailModal";
import AttendanceModal from "./AttendanceModal";
import AnnouncementModal from "./AnnouncementModal";
import TournamentList, { TournamentData } from "./TournamentList";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { TeamTagMap } from "@/lib/team-utils";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";

export interface GameNightWithAttendees {
  id: string;
  title: string | null;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string;
  game: string;
  status: string;
  visibility: string;
  isRecurring: boolean;
  recurGroupId: string | null;
  attendanceConfirmed: boolean;
  timezone: string;
  createdById: string | null;
  createdBy?: { name: string; gamertag: string | null } | null;
  hostId: string | null;
  host?: { name: string; gamertag: string | null } | null;
  attendees: {
    userId: string;
    status: string;
    attended: boolean;
    user: { name: string; gamertag: string | null };
  }[];
  invites?: {
    userId: string;
    user: { name: string; gamertag: string | null };
  }[];
}

export interface InvitableMember {
  id: string;
  name: string;
  gamertag: string | null;
  avatar: string | null;
}

export interface InviteGroupData {
  id: string;
  name: string;
  memberIds: string[];
}

interface Props {
  gameNights: GameNightWithAttendees[];
  tournaments?: TournamentData[];
  userId?: string;
  isAdmin?: boolean;
  isModerator?: boolean;
  isOwner?: boolean;
  members?: InvitableMember[];
  groups?: InviteGroupData[];
  initialTournamentId?: string;
  teamTagMap?: TeamTagMap;
  userTimezone?: string;
}

export default function ScheduleView({
  gameNights,
  tournaments = [],
  userId,
  isAdmin,
  isModerator,
  isOwner,
  members = [],
  groups = [],
  initialTournamentId,
  teamTagMap = {},
  userTimezone = "America/Phoenix",
}: Props) {
  const [view, setView] = useState<"calendar" | "list" | "tournaments">(
    initialTournamentId ? "tournaments" : "calendar"
  );
  const [initialized, setInitialized] = useState(!!initialTournamentId);
  const [showCreate, setShowCreate] = useState(false);
  const [viewingEvent, setViewingEvent] = useState<GameNightWithAttendees | null>(null);
  const [editingEvent, setEditingEvent] = useState<GameNightWithAttendees | null>(null);
  const [attendanceEvent, setAttendanceEvent] = useState<GameNightWithAttendees | null>(null);
  const [announcingEvent, setAnnouncingEvent] = useState<GameNightWithAttendees | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);

  // Default to list on mobile, calendar on desktop
  useEffect(() => {
    if (!initialized) {
      requestAnimationFrame(() => {
        setView(window.innerWidth < 640 ? "list" : "calendar");
        setInitialized(true);
      });
    }
  }, [initialized]);

  const isAdminOrMod = isAdmin || isModerator || isOwner;
  const contentRef = useRef<HTMLDivElement>(null);

  const switchView = useCallback((newView: typeof view) => {
    setView(newView);
    // Smooth scroll to top of content area
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleEventClick = (gn: GameNightWithAttendees) => {
    if (!userId) {
      setShowSignIn(true);
    } else {
      setViewingEvent(gn);
    }
  };

  const handleEditFromDetail = () => {
    if (viewingEvent) {
      const event = viewingEvent;
      setViewingEvent(null);
      // Wait for the detail modal exit animation to finish before opening edit
      setTimeout(() => setEditingEvent(event), 250);
    }
  };

  const handleAttendanceFromDetail = () => {
    if (viewingEvent) {
      const event = viewingEvent;
      setViewingEvent(null);
      setTimeout(() => setAttendanceEvent(event), 250);
    }
  };

  const handleAnnounceFromDetail = () => {
    if (viewingEvent) {
      const event = viewingEvent;
      setViewingEvent(null);
      setTimeout(() => setAnnouncingEvent(event), 250);
    }
  };

  const settings = useSiteSettings();

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-lg border border-border bg-surface p-1">
          <button
            onClick={() => switchView("calendar")}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              view === "calendar"
                ? "bg-neon/10 text-neon"
                : "text-foreground/50 hover:text-foreground"
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => switchView("list")}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              view === "list"
                ? "bg-neon/10 text-neon"
                : "text-foreground/50 hover:text-foreground"
            }`}
          >
            Events
          </button>
          {settings.enableTournaments && (
            <button
              onClick={() => switchView("tournaments")}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                view === "tournaments"
                  ? "bg-neon/10 text-neon"
                  : "text-foreground/50 hover:text-foreground"
              }`}
            >
              Tournaments
            </button>
          )}
        </div>

        {userId && view !== "tournaments" && (settings.allowMemberEvents || isAdmin || isModerator || isOwner) && (
          <Button onClick={() => setShowCreate(true)} size="sm">
            + New Game Night
          </Button>
        )}
      </div>

      <div ref={contentRef}>
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {view === "calendar" ? (
              <WeeklyCalendar
                gameNights={gameNights}
                userId={userId}
                isAdmin={isAdmin}
                isModerator={isModerator}
                isOwner={isOwner}
                onViewEvent={handleEventClick}
                onMarkAttendance={setAttendanceEvent}
                userTimezone={userTimezone}
              />
            ) : view === "list" ? (
              <EventList
                gameNights={gameNights}
                userId={userId}
                isAdmin={isAdminOrMod}
                onViewEvent={handleEventClick}
                onMarkAttendance={setAttendanceEvent}
                teamTagMap={teamTagMap}
                userTimezone={userTimezone}
              />
            ) : (
              <TournamentList
                tournaments={tournaments}
                userId={userId}
                isAdmin={isAdmin}
                isModerator={isModerator}
                isOwner={isOwner}
                members={members}
                initialTournamentId={initialTournamentId}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {userId && (
        <CreateGameNightModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          isAdmin={isAdminOrMod}
          userId={userId}
          members={members}
          groups={groups}
        />
      )}

      {viewingEvent && (
        <EventDetailModal
          open
          onClose={() => setViewingEvent(null)}
          gameNight={viewingEvent}
          userId={userId}
          isAdmin={isAdmin}
          isModerator={isModerator}
          isOwner={isOwner}
          onEditSettings={handleEditFromDetail}
          onMarkAttendance={handleAttendanceFromDetail}
          onAnnounce={handleAnnounceFromDetail}
          teamTagMap={teamTagMap}
          userTimezone={userTimezone}
        />
      )}

      {editingEvent && (
        <EditGameNightModal
          open
          onClose={() => setEditingEvent(null)}
          gameNight={editingEvent}
          userId={userId}
          isAdmin={isAdminOrMod}
          members={members}
          groups={groups}
          userTimezone={userTimezone}
        />
      )}

      {attendanceEvent && (
        <AttendanceModal
          open
          onClose={() => setAttendanceEvent(null)}
          gameNight={attendanceEvent}
          teamTagMap={teamTagMap}
        />
      )}

      {announcingEvent && (
        <AnnouncementModal
          open
          onClose={() => setAnnouncingEvent(null)}
          gameNight={announcingEvent}
          userTimezone={userTimezone}
        />
      )}

      <Modal open={showSignIn} onClose={() => setShowSignIn(false)} title="Sign In Required">
        <p className="mb-6 text-foreground/60">
          Sign in to view event details, RSVP, and create your own game nights.
        </p>
        <div className="flex gap-3">
          <a
            href="/signup"
            className="rounded bg-neon px-5 py-2 font-semibold text-background transition hover:bg-neon-dim"
          >
            Sign In
          </a>
          <button
            onClick={() => setShowSignIn(false)}
            className="rounded border border-border px-5 py-2 text-foreground/60 transition hover:border-border-light hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
