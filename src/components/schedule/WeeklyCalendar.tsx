"use client";

import { useState, useMemo } from "react";
import { DAYS_OF_WEEK, formatTime } from "@/lib/constants";
import Badge from "@/components/ui/Badge";
import RSVPButton from "./RSVPButton";
import { GameNightWithAttendees } from "./ScheduleView";

interface Props {
  gameNights: GameNightWithAttendees[];
  userId?: string;
  isAdmin?: boolean;
  onEditEvent?: (gn: GameNightWithAttendees) => void;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatRange(start: Date, end: Date): string {
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export default function WeeklyCalendar({ gameNights, userId, isAdmin, onEditEvent }: Props) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [mobileDay, setMobileDay] = useState(0);
  const today = new Date();

  const allDays = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const week1 = allDays.slice(0, 7);
  const week2 = allDays.slice(7, 14);

  const prev = () => setWeekStart((ws) => addDays(ws, -14));
  const next = () => setWeekStart((ws) => addDays(ws, 14));
  const goToday = () => {
    setWeekStart(getWeekStart(new Date()));
    setMobileDay(0);
  };

  const getEventsForDay = (date: Date) =>
    gameNights.filter((gn) => isSameDay(new Date(gn.date), date));

  return (
    <div>
      {/* Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={prev}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground/70 transition hover:border-neon hover:text-neon"
        >
          ← Prev
        </button>
        <div className="text-center">
          <button
            onClick={goToday}
            className="text-sm text-foreground/50 transition hover:text-neon"
          >
            {formatRange(allDays[0], allDays[13])}
          </button>
        </div>
        <button
          onClick={next}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground/70 transition hover:border-neon hover:text-neon"
        >
          Next →
        </button>
      </div>

      {/* Mobile day selector (14 days, scrollable) */}
      <div className="mb-4 flex gap-1 overflow-x-auto sm:hidden">
        {allDays.map((day, i) => (
          <button
            key={i}
            onClick={() => setMobileDay(i)}
            className={`flex-shrink-0 rounded-lg px-3 py-2 text-xs ${
              mobileDay === i
                ? "bg-neon/10 text-neon border border-neon/40"
                : isSameDay(day, today)
                  ? "bg-surface-light text-neon border border-border"
                  : "text-foreground/50 border border-transparent"
            }`}
          >
            <div>{DAYS_OF_WEEK[day.getDay()].slice(0, 3)}</div>
            <div className="font-bold">{day.getDate()}</div>
          </button>
        ))}
      </div>

      {/* Mobile single-day view */}
      <div className="sm:hidden">
        {(() => {
          const dayDate = allDays[mobileDay];
          const events = dayDate ? getEventsForDay(dayDate) : [];
          return events.length > 0 ? (
            <div className="space-y-3">
              {events.map((gn) => (
                <DayEvent key={gn.id} gn={gn} userId={userId} isAdmin={isAdmin} onEdit={onEditEvent} />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-foreground/30">
              No events
            </p>
          );
        })()}
      </div>

      {/* Desktop: two stacked week grids */}
      <div className="hidden sm:block space-y-4">
        <WeekGrid
          days={week1}
          label={formatRange(week1[0], week1[6])}
          today={today}
          getEventsForDay={getEventsForDay}
          userId={userId}
          isAdmin={isAdmin}
          onEditEvent={onEditEvent}
        />
        <WeekGrid
          days={week2}
          label={formatRange(week2[0], week2[6])}
          today={today}
          getEventsForDay={getEventsForDay}
          userId={userId}
          isAdmin={isAdmin}
          onEditEvent={onEditEvent}
        />
      </div>
    </div>
  );
}

function WeekGrid({
  days,
  label,
  today,
  getEventsForDay,
  userId,
  isAdmin,
  onEditEvent,
}: {
  days: Date[];
  label: string;
  today: Date;
  getEventsForDay: (date: Date) => GameNightWithAttendees[];
  userId?: string;
  isAdmin?: boolean;
  onEditEvent?: (gn: GameNightWithAttendees) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-xs text-foreground/40">{label}</p>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-border bg-border">
        {days.map((day, i) => {
          const events = getEventsForDay(day);
          const isToday = isSameDay(day, today);

          return (
            <div
              key={i}
              className={`min-h-[140px] bg-surface p-2 ${isToday ? "bg-surface-light" : ""}`}
            >
              <div
                className={`mb-2 text-center text-xs ${
                  isToday ? "font-bold text-neon" : "text-foreground/50"
                }`}
              >
                <div>{DAYS_OF_WEEK[day.getDay()].slice(0, 3)}</div>
                <div className={`text-lg ${isToday ? "text-neon" : "text-foreground/70"}`}>
                  {day.getDate()}
                </div>
              </div>
              <div className="space-y-1">
                {events.map((gn) => (
                  <DayEvent key={gn.id} gn={gn} userId={userId} compact isAdmin={isAdmin} onEdit={onEditEvent} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayEvent({
  gn,
  userId,
  compact,
  isAdmin,
  onEdit,
}: {
  gn: GameNightWithAttendees;
  userId?: string;
  compact?: boolean;
  isAdmin?: boolean;
  onEdit?: (gn: GameNightWithAttendees) => void;
}) {
  const myRsvp = userId
    ? gn.attendees.find((a) => a.userId === userId)?.status
    : undefined;
  const confirmed = gn.attendees.filter((a) => a.status === "confirmed");

  if (compact) {
    return (
      <div
        onClick={isAdmin ? () => onEdit?.(gn) : undefined}
        className={`rounded-md border p-1.5 text-xs ${
          gn.status === "cancelled"
            ? "border-danger/30 bg-danger/5 text-danger/70 line-through"
            : "border-neon/30 bg-neon/5"
        } ${isAdmin ? "cursor-pointer hover:border-neon/60" : ""}`}
      >
        {gn.title && (
          <div className="font-medium text-foreground truncate">{gn.title}</div>
        )}
        <div className={`font-medium ${gn.title ? "text-foreground/50" : "text-neon"}`}>{gn.game}</div>
        <div className="text-foreground/50">
          {formatTime(gn.startTime)}
        </div>
        {confirmed.length > 0 && (
          <div className="mt-0.5 text-foreground/40">
            {confirmed.length} going
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div
        className={`mb-2 flex items-center justify-between ${isAdmin ? "cursor-pointer" : ""}`}
        onClick={isAdmin ? () => onEdit?.(gn) : undefined}
      >
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-foreground">{gn.title || gn.game}</h4>
          {gn.title && (
            <span className="text-sm text-foreground/50">{gn.game}</span>
          )}
          {gn.status === "cancelled" && <Badge variant="danger">Cancelled</Badge>}
        </div>
        {isAdmin && (
          <span className="text-xs text-foreground/30">Edit</span>
        )}
      </div>
      <p className="mb-2 text-sm text-foreground/50">
        {formatTime(gn.startTime)} - {formatTime(gn.endTime)}
      </p>
      {confirmed.length > 0 && (
        <p className="mb-3 text-xs text-neon">
          {confirmed.map((a) => a.user.gamertag || a.user.name).join(", ")}
        </p>
      )}
      {gn.status !== "cancelled" && userId && (
        <RSVPButton gameNightId={gn.id} currentStatus={myRsvp} />
      )}
    </div>
  );
}
