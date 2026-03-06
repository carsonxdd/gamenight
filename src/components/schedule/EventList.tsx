"use client";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import RSVPButton from "./RSVPButton";
import { formatTime } from "@/lib/constants";
import { GameNightWithAttendees } from "./ScheduleView";

interface Props {
  gameNights: GameNightWithAttendees[];
  userId?: string;
}

export default function EventList({ gameNights, userId }: Props) {
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

        return (
          <Card key={gn.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="font-bold text-foreground">{gn.game}</h3>
                {gn.status === "cancelled" && (
                  <Badge variant="danger">Cancelled</Badge>
                )}
                {gn.isRecurring && <Badge variant="neutral">Recurring</Badge>}
              </div>
              <p className="text-sm text-foreground/50">
                {new Date(gn.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}{" "}
                &middot; {formatTime(gn.startTime)} - {formatTime(gn.endTime)}
              </p>
              {confirmed.length > 0 && (
                <p className="mt-1 text-xs text-neon">
                  {confirmed.map((a) => a.user.gamertag || a.user.name).join(", ")}
                </p>
              )}
            </div>
            {gn.status !== "cancelled" && userId && (
              <RSVPButton gameNightId={gn.id} currentStatus={myRsvp} />
            )}
          </Card>
        );
      })}
    </div>
  );
}
