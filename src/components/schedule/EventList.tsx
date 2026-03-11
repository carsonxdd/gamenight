"use client";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import RSVPButton from "./RSVPButton";
import { approveGameNight, rejectGameNight } from "@/app/schedule/actions";
import { GameNightWithAttendees } from "./ScheduleView";
import { formatWithTag, type TeamTagMap } from "@/lib/team-utils";
import { formatEventTimeForViewer, utcToLocalDateTime, dateToUtcString } from "@/lib/timezone-utils";

interface Props {
  gameNights: GameNightWithAttendees[];
  userId?: string;
  isAdmin?: boolean;
  onViewEvent?: (gn: GameNightWithAttendees) => void;
  onMarkAttendance?: (gn: GameNightWithAttendees) => void;
  teamTagMap?: TeamTagMap;
  userTimezone?: string;
}

export default function EventList({ gameNights, userId, isAdmin, onViewEvent, onMarkAttendance, teamTagMap = {}, userTimezone = "America/Phoenix" }: Props) {
  if (gameNights.length === 0) {
    return (
      <div className="py-20 text-center text-foreground/40">
        No upcoming game nights scheduled
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {gameNights.map((gn) => {
        const myRsvp = userId
          ? gn.attendees.find((a) => a.userId === userId)?.status
          : undefined;
        const confirmed = gn.attendees.filter((a) => a.status === "confirmed");
        const isPending = gn.status === "pending";
        const isRejected = gn.status === "rejected";
        const isInviteOnly = gn.visibility === "invite_only";
        const isCreator = userId === gn.createdById;
        const isHost = userId === gn.hostId;
        // Convert UTC date to viewer's local date for display
        const utcDateStr = dateToUtcString(new Date(gn.date));
        const localStart = utcToLocalDateTime(utcDateStr, gn.startTime, userTimezone);
        const localEnd = utcToLocalDateTime(utcDateStr, gn.endTime, userTimezone);
        const localDisplayDate = new Date(localStart.localDate + "T12:00:00");

        // Check if event is past using UTC end time
        const [endH, endM] = gn.endTime.split(":").map(Number);
        const eventEnd = new Date(gn.date);
        eventEnd.setUTCHours(endH, endM, 0, 0);
        const isPast = eventEnd < new Date();
        const canMarkAttendance = isPast && gn.status === "scheduled" && (isAdmin || isHost || isCreator);

        return (
          <Card
            key={gn.id}
            className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${
              isPending
                ? "!border-dashed !border-warning/40 !bg-warning/5"
                : isRejected
                  ? "!border-danger/30 !bg-danger/5"
                  : ""
            }`}
          >
            <div
              className="flex-1 cursor-pointer"
              onClick={() => onViewEvent?.(gn)}
            >
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-foreground">
                  {gn.title || gn.game}
                </h3>
                {gn.title && (
                  <span className="text-sm text-foreground/50">{gn.game}</span>
                )}
                {gn.status === "cancelled" && (
                  <Badge variant="danger">Cancelled</Badge>
                )}
                {isPending && <Badge variant="warning">Pending</Badge>}
                {isRejected && <Badge variant="danger">Rejected</Badge>}
                {gn.isRecurring && <Badge variant="neutral">Recurring</Badge>}
                {isInviteOnly && (
                  <Badge variant="neutral">Invite-Only</Badge>
                )}
              </div>
              <p className="text-sm text-foreground/50">
                {localDisplayDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}{" "}
                &middot; {formatEventTimeForViewer(gn.startTime, utcDateStr, userTimezone, gn.timezone)} - {formatEventTimeForViewer(gn.endTime, utcDateStr, userTimezone, gn.timezone)}
              </p>
              {gn.description && (
                <p className="mt-1 text-sm text-foreground/60">{gn.description}</p>
              )}
              {gn.host && (
                <p className="mt-1 text-xs text-foreground/40">
                  Hosted by <span className="text-foreground/60">{gn.host.gamertag || gn.host.name}</span>
                </p>
              )}
              {isPending && gn.createdBy && (
                <p className="mt-1 text-xs text-warning/70">
                  Submitted by {gn.createdBy.gamertag || gn.createdBy.name}
                </p>
              )}
              {confirmed.length > 0 && (
                <p className="mt-1 text-xs text-neon">
                  {confirmed.map((a) => formatWithTag(a.user.gamertag || a.user.name, a.userId, teamTagMap, gn.game)).join(", ")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isPending && isAdmin && (
                <>
                  <button
                    onClick={() => approveGameNight(gn.id)}
                    className="rounded-lg bg-neon/10 px-3 py-1.5 text-xs font-medium text-neon transition hover:bg-neon/20"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectGameNight(gn.id)}
                    className="rounded-lg bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger transition hover:bg-danger/20"
                  >
                    Reject
                  </button>
                </>
              )}
              {canMarkAttendance && (
                <button
                  onClick={() => onMarkAttendance?.(gn)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    gn.attendanceConfirmed
                      ? "border border-neon/30 text-neon/70 hover:bg-neon/10"
                      : "bg-neon/10 text-neon hover:bg-neon/20"
                  }`}
                >
                  {gn.attendanceConfirmed ? "Attendance ✓" : "Mark Attendance"}
                </button>
              )}
              {gn.status === "scheduled" && userId && !isPast && (
                <RSVPButton gameNightId={gn.id} currentStatus={myRsvp} />
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
