"use client";

import { useState, useMemo } from "react";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import RSVPButton from "./RSVPButton";
import { canEditEvent } from "@/lib/permissions";
import { approveGameNight, rejectGameNight } from "@/app/schedule/actions";
import { GameNightWithAttendees } from "./ScheduleView";
import { formatWithTag, type TeamTagMap } from "@/lib/team-utils";
import { formatEventTimeForViewer, utcToLocalDateTime, dateToUtcString } from "@/lib/timezone-utils";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";

interface Props {
  open: boolean;
  onClose: () => void;
  gameNight: GameNightWithAttendees;
  userId?: string;
  isAdmin?: boolean;
  isModerator?: boolean;
  isOwner?: boolean;
  onEditSettings: () => void;
  onMarkAttendance: () => void;
  onAnnounce?: () => void;
  teamTagMap?: TeamTagMap;
  userTimezone?: string;
}

export default function EventDetailModal({
  open,
  onClose,
  gameNight: gn,
  userId,
  isAdmin,
  isModerator,
  isOwner,
  onEditSettings,
  onMarkAttendance,
  onAnnounce,
  teamTagMap = {},
  userTimezone = "America/Phoenix",
}: Props) {
  const isPending = gn.status === "pending";
  const isRejected = gn.status === "rejected";
  const isCancelled = gn.status === "cancelled";
  const isInviteOnly = gn.visibility === "invite_only";
  const isCreator = userId === gn.createdById;
  const isHost = userId === gn.hostId;

  // Check if event is past using UTC end time
  const [_endH, _endM] = (gn.endTime || "23:59").split(":").map(Number);
  const eventEnd = new Date(gn.date);
  eventEnd.setUTCHours(_endH, _endM, 0, 0);
  const isPast = eventEnd < new Date();

  const settings = useSiteSettings();
  const maxAttendees = settings.maxAttendeesDefault;
  const confirmedCount = gn.attendees.filter((a) => a.status === "confirmed").length;
  const isFull = maxAttendees > 0 && confirmedCount >= maxAttendees;
  const myCurrentRsvp = gn.attendees.find((a) => a.userId === userId)?.status;
  const canRSVP = userId && gn.status === "scheduled" && !isPast && !(isFull && myCurrentRsvp !== "confirmed");
  const canApprove = isPending && (isAdmin || isModerator || isOwner);
  const canAttendance = isPast && gn.status === "scheduled" && (isAdmin || isModerator || isOwner || isHost || isCreator);
  const canEdit = canEditEvent({
    userId,
    isAdmin,
    isModerator,
    isOwner,
    hostId: gn.hostId,
    createdById: gn.createdById,
    visibility: gn.visibility,
  });

  const serverRsvp = userId ? gn.attendees.find((a) => a.userId === userId)?.status : undefined;
  const [optimisticRsvp, setOptimisticRsvp] = useState<string | undefined>(undefined);
  const myRsvp = optimisticRsvp ?? serverRsvp;

  // Build optimistic attendee lists
  const { confirmed, maybe } = useMemo(() => {
    const attendees = gn.attendees.map((a) => {
      if (a.userId === userId && optimisticRsvp) {
        return { ...a, status: optimisticRsvp };
      }
      return a;
    });
    return {
      confirmed: attendees.filter((a) => a.status === "confirmed"),
      maybe: attendees.filter((a) => a.status === "maybe"),
    };
  }, [gn.attendees, userId, optimisticRsvp]);

  // Convert UTC to viewer's local timezone for display
  const utcDateStr = dateToUtcString(new Date(gn.date));
  const localStart = utcToLocalDateTime(utcDateStr, gn.startTime, userTimezone);
  const localDisplayDate = new Date(localStart.localDate + "T12:00:00");
  const dateFormatted = localDisplayDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Modal open={open} onClose={onClose} title={gn.title || gn.game}>
      <div className="space-y-4">
        {/* Status badges */}
        <div className="flex flex-wrap items-center gap-2">
          {gn.title && (
            <span className="text-sm text-foreground/50">{gn.game}</span>
          )}
          {isCancelled && <Badge variant="danger">Cancelled</Badge>}
          {isPending && <Badge variant="warning">Pending Approval</Badge>}
          {isRejected && <Badge variant="danger">Rejected</Badge>}
          {gn.isRecurring && <Badge variant="neutral">Recurring</Badge>}
          {isInviteOnly && <Badge variant="neutral">Invite-Only</Badge>}
        </div>

        {/* Date & Time */}
        <div className="rounded-lg border border-border bg-surface-light p-3">
          <p className="text-sm font-medium text-foreground">{dateFormatted}</p>
          <p className="mt-1 text-sm text-foreground/60">
            {formatEventTimeForViewer(gn.startTime, utcDateStr, userTimezone, gn.timezone)} - {formatEventTimeForViewer(gn.endTime, utcDateStr, userTimezone, gn.timezone)}
          </p>
        </div>

        {/* Host */}
        {gn.host && (
          <p className="text-sm text-foreground/60">
            Hosted by{" "}
            <span className="font-medium text-foreground">
              {gn.host.gamertag || gn.host.name}
            </span>
          </p>
        )}

        {/* Description */}
        {gn.description && (
          <p className="text-sm text-foreground/70 leading-relaxed">{gn.description}</p>
        )}

        {/* Submitted by (pending events) */}
        {isPending && gn.createdBy && (
          <p className="text-xs text-warning/70">
            Submitted by {gn.createdBy.gamertag || gn.createdBy.name}
          </p>
        )}

        {/* Invited list (invite-only) */}
        {isInviteOnly && gn.invites && gn.invites.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-foreground/40 uppercase tracking-wider">Invited</p>
            <div className="flex flex-wrap gap-1.5">
              {gn.invites.map((inv) => (
                <span
                  key={inv.userId}
                  className="rounded-full border border-border bg-surface-lighter px-2.5 py-0.5 text-xs text-foreground/60"
                >
                  {formatWithTag(inv.user.gamertag || inv.user.name, inv.userId, teamTagMap, gn.game)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* RSVP list — confirmed */}
        {confirmed.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-neon/60 uppercase tracking-wider">
              Going ({confirmed.length}{maxAttendees > 0 ? `/${maxAttendees}` : ""}){isFull && <span className="ml-1 text-warning"> Full</span>}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {confirmed.map((a) => (
                <span
                  key={a.userId}
                  className="rounded-full border border-neon/30 bg-neon/10 px-2.5 py-0.5 text-xs text-neon"
                >
                  {formatWithTag(a.user.gamertag || a.user.name, a.userId, teamTagMap, gn.game)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* RSVP list — maybe */}
        {maybe.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-warning/60 uppercase tracking-wider">
              Maybe ({maybe.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {maybe.map((a) => (
                <span
                  key={a.userId}
                  className="rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-xs text-warning"
                >
                  {formatWithTag(a.user.gamertag || a.user.name, a.userId, teamTagMap, gn.game)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* RSVP button */}
        {canRSVP && (
          <div className="pt-2 border-t border-border">
            <p className="mb-2 text-xs text-foreground/40">Your RSVP</p>
            <RSVPButton gameNightId={gn.id} currentStatus={myRsvp} onStatusChange={setOptimisticRsvp} />
          </div>
        )}

        {/* Approve / Reject */}
        {canApprove && (
          <div className="flex gap-2 pt-2 border-t border-border">
            <button
              onClick={() => approveGameNight(gn.id)}
              className="rounded-lg bg-neon/10 px-4 py-2 text-sm font-medium text-neon transition hover:bg-neon/20"
            >
              Approve
            </button>
            <button
              onClick={() => rejectGameNight(gn.id)}
              className="rounded-lg bg-danger/10 px-4 py-2 text-sm font-medium text-danger transition hover:bg-danger/20"
            >
              Reject
            </button>
          </div>
        )}

        {/* Mark Attendance */}
        {canAttendance && (
          <button
            onClick={onMarkAttendance}
            className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition ${
              gn.attendanceConfirmed
                ? "border border-neon/30 text-neon/70 hover:bg-neon/10"
                : "bg-neon/10 text-neon hover:bg-neon/20"
            }`}
          >
            {gn.attendanceConfirmed ? "Attendance Confirmed" : "Mark Attendance"}
          </button>
        )}

        {/* Announce to Discord */}
        {isAdmin && onAnnounce && gn.status === "scheduled" && (
          <button
            onClick={onAnnounce}
            className="w-full rounded-lg border border-[#5865f2]/30 bg-[#5865f2]/10 px-4 py-2 text-sm font-medium text-[#5865f2] transition hover:bg-[#5865f2]/20"
          >
            📢 Announce to Discord
          </button>
        )}

        {/* Edit Settings */}
        {canEdit && (
          <div className="pt-2 border-t border-border">
            <Button onClick={onEditSettings} variant="ghost" size="sm" className="w-full">
              Edit Settings
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
