"use client";

import { useState } from "react";
import WeeklyCalendar from "./WeeklyCalendar";
import EventList from "./EventList";
import CreateGameNightModal from "./CreateGameNightModal";
import EditGameNightModal from "./EditGameNightModal";
import Button from "@/components/ui/Button";

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
  createdById: string;
  createdBy?: { name: string; gamertag: string | null };
  attendees: {
    userId: string;
    status: string;
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
  userId?: string;
  isAdmin?: boolean;
  members?: InvitableMember[];
  groups?: InviteGroupData[];
}

export default function ScheduleView({ gameNights, userId, isAdmin, members = [], groups = [] }: Props) {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [showCreate, setShowCreate] = useState(false);
  const [editingEvent, setEditingEvent] = useState<GameNightWithAttendees | null>(null);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-lg border border-border bg-surface p-1">
          <button
            onClick={() => setView("calendar")}
            className={`rounded-md px-4 py-1.5 text-sm transition ${
              view === "calendar"
                ? "bg-neon/10 text-neon"
                : "text-foreground/50 hover:text-foreground"
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setView("list")}
            className={`rounded-md px-4 py-1.5 text-sm transition ${
              view === "list"
                ? "bg-neon/10 text-neon"
                : "text-foreground/50 hover:text-foreground"
            }`}
          >
            Event List
          </button>
        </div>

        {userId && (
          <Button onClick={() => setShowCreate(true)} size="sm">
            + New Game Night
          </Button>
        )}
      </div>

      {view === "calendar" ? (
        <WeeklyCalendar
          gameNights={gameNights}
          userId={userId}
          isAdmin={isAdmin}
          onEditEvent={setEditingEvent}
        />
      ) : (
        <EventList
          gameNights={gameNights}
          userId={userId}
          isAdmin={isAdmin}
          onEditEvent={setEditingEvent}
        />
      )}

      {userId && (
        <CreateGameNightModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          isAdmin={isAdmin}
          userId={userId}
          members={members}
          groups={groups}
        />
      )}

      {editingEvent && (
        <EditGameNightModal
          open
          onClose={() => setEditingEvent(null)}
          gameNight={editingEvent}
          userId={userId}
          isAdmin={isAdmin}
          members={members}
          groups={groups}
        />
      )}
    </div>
  );
}
