"use client";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import RSVPButton from "./RSVPButton";
import { formatTime } from "@/lib/constants";
import { approveGameNight, rejectGameNight } from "@/app/schedule/actions";
import { GameNightWithAttendees } from "./ScheduleView";

interface Props {
  gameNights: GameNightWithAttendees[];
  userId?: string;
  isAdmin?: boolean;
  onEditEvent?: (gn: GameNightWithAttendees) => void;
}

export default function EventList({ gameNights, userId, isAdmin, onEditEvent }: Props) {
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
        const canEdit = isAdmin || (isCreator && isInviteOnly);

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
              className={`flex-1 ${canEdit ? "cursor-pointer" : ""}`}
              onClick={canEdit ? () => onEditEvent?.(gn) : undefined}
            >
              <div className="mb-1 flex items-center gap-2">
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
                {canEdit && (
                  <span className="text-xs text-foreground/30 ml-auto">Edit</span>
                )}
              </div>
              <p className="text-sm text-foreground/50">
                {new Date(gn.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}{" "}
                &middot; {formatTime(gn.startTime)} - {formatTime(gn.endTime)}
              </p>
              {gn.description && (
                <p className="mt-1 text-sm text-foreground/60">{gn.description}</p>
              )}
              {isPending && gn.createdBy && (
                <p className="mt-1 text-xs text-warning/70">
                  Submitted by {gn.createdBy.gamertag || gn.createdBy.name}
                </p>
              )}
              {confirmed.length > 0 && (
                <p className="mt-1 text-xs text-neon">
                  {confirmed.map((a) => a.user.gamertag || a.user.name).join(", ")}
                </p>
              )}
              {isInviteOnly && gn.invites && gn.invites.length > 0 && (
                <p className="mt-1 text-xs text-foreground/40">
                  Invited: {gn.invites.map((inv) => inv.user.gamertag || inv.user.name).join(", ")}
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
              {gn.status === "scheduled" && userId && (
                <RSVPButton gameNightId={gn.id} currentStatus={myRsvp} />
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
