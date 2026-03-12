"use client";

import { useState, useMemo, useEffect } from "react";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { getWeekStartFriday, addDays, isSameDay, formatRange } from "@/lib/schedule-utils";
import { GameNightWithAttendees } from "./ScheduleView";
import { formatEventTimeForViewer, utcToLocalDateTime, dateToUtcString } from "@/lib/timezone-utils";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  gameNights: GameNightWithAttendees[];
  userId?: string;
  isAdmin?: boolean;
  isModerator?: boolean;
  isOwner?: boolean;
  onViewEvent?: (gn: GameNightWithAttendees) => void;
  onMarkAttendance?: (gn: GameNightWithAttendees) => void;
  userTimezone?: string;
}

export default function WeeklyCalendar({
  gameNights,
  userId,
  isAdmin,
  isModerator,
  isOwner,
  onViewEvent,
  onMarkAttendance,
  userTimezone = "America/Phoenix",
}: Props) {
  const [weekStart, setWeekStart] = useState(() => getWeekStartFriday(new Date()));
  const [mobileDay, setMobileDay] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const today = new Date();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // 14 days starting from Friday
  const allDays = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Mobile sees first 7 (Fri-Thu), desktop sees all 14
  const mobileDays = allDays.slice(0, 7);
  const week1 = allDays.slice(0, 7);
  const week2 = allDays.slice(7, 14);

  const prev = () => {
    setWeekStart((ws) => addDays(ws, isMobile ? -7 : -14));
    setMobileDay(0);
  };
  const next = () => {
    setWeekStart((ws) => addDays(ws, isMobile ? 7 : 14));
    setMobileDay(0);
  };
  const goToday = () => {
    const newStart = getWeekStartFriday(new Date());
    setWeekStart(newStart);
    // Find which index (0-6) today falls on within the Fri-Thu week
    const todayDate = new Date();
    for (let i = 0; i < 7; i++) {
      if (isSameDay(addDays(newStart, i), todayDate)) {
        setMobileDay(i);
        return;
      }
    }
    setMobileDay(0);
  };

  // Convert UTC event dates to viewer's local dates for calendar placement
  const getEventsForDay = (date: Date) =>
    gameNights.filter((gn) => {
      const utcDateStr = dateToUtcString(new Date(gn.date));
      const local = utcToLocalDateTime(utcDateStr, gn.startTime, userTimezone);
      const localDate = new Date(local.localDate + "T12:00:00");
      return isSameDay(localDate, date);
    });

  // Range label
  const rangeLabel = isMobile
    ? formatRange(mobileDays[0], mobileDays[6])
    : formatRange(allDays[0], allDays[13]);

  return (
    <div>
      {/* Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={prev}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground/70 transition hover:border-neon hover:text-neon"
        >
          &larr; Prev
        </button>
        <div className="text-center">
          <button
            onClick={goToday}
            className="mb-1 rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-foreground/70 transition hover:border-neon hover:text-neon"
          >
            Today
          </button>
          <AnimatePresence mode="wait">
            <motion.div
              key={rangeLabel}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-xs text-foreground/50 sm:text-sm"
            >
              {rangeLabel}
            </motion.div>
          </AnimatePresence>
        </div>
        <button
          onClick={next}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground/70 transition hover:border-neon hover:text-neon"
        >
          Next &rarr;
        </button>
      </div>

      {/* Mobile day selector: 3 weekend + 4 weekday rows */}
      <AnimatePresence mode="wait">
        <motion.div
          key={weekStart.toISOString() + "-mobile-selector"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="mb-4 sm:hidden"
        >
          {/* Top row: Fri, Sat, Sun */}
          <div className="mb-1.5 grid grid-cols-3 gap-1.5">
            {mobileDays.slice(0, 3).map((day, i) => (
              <MobileDayCard
                key={i}
                day={day}
                index={i}
                isSelected={mobileDay === i}
                isToday={isSameDay(day, today)}
                eventCount={getEventsForDay(day).length}
                onClick={() => setMobileDay(i)}
              />
            ))}
          </div>
          {/* Bottom row: Mon, Tue, Wed, Thu */}
          <div className="grid grid-cols-4 gap-1.5">
            {mobileDays.slice(3, 7).map((day, i) => (
              <MobileDayCard
                key={i + 3}
                day={day}
                index={i + 3}
                isSelected={mobileDay === i + 3}
                isToday={isSameDay(day, today)}
                eventCount={getEventsForDay(day).length}
                onClick={() => setMobileDay(i + 3)}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Mobile single-day view */}
      <div className="sm:hidden">
        {(() => {
          const dayDate = mobileDays[mobileDay];
          const events = dayDate ? getEventsForDay(dayDate) : [];
          return events.length > 0 ? (
            <div className="space-y-3">
              {events.map((gn) => (
                <DayEvent key={gn.id} gn={gn} userId={userId} isAdmin={isAdmin} onView={onViewEvent} onMarkAttendance={onMarkAttendance} userTimezone={userTimezone} />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-foreground/30">
              No events
            </p>
          );
        })()}
      </div>

      {/* Desktop: two stacked week grids (Fri-Thu) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={weekStart.toISOString() + "-desktop"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="hidden sm:block space-y-4"
        >
          <WeekGrid
            days={week1}
            label={formatRange(week1[0], week1[6])}
            today={today}
            getEventsForDay={getEventsForDay}
            userId={userId}
            isAdmin={isAdmin}
            onViewEvent={onViewEvent}
            onMarkAttendance={onMarkAttendance}
            userTimezone={userTimezone}
          />
          <WeekGrid
            days={week2}
            label={formatRange(week2[0], week2[6])}
            today={today}
            getEventsForDay={getEventsForDay}
            userId={userId}
            isAdmin={isAdmin}
            onViewEvent={onViewEvent}
            onMarkAttendance={onMarkAttendance}
            userTimezone={userTimezone}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ---------- Mobile Day Card ---------- */

function MobileDayCard({
  day,
  index,
  isSelected,
  isToday,
  eventCount,
  onClick,
}: {
  day: Date;
  index: number;
  isSelected: boolean;
  isToday: boolean;
  eventCount: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center rounded-xl px-2 py-3 text-center transition ${
        isSelected
          ? "bg-neon/10 text-neon border border-neon/40"
          : isToday
            ? "bg-surface-light text-foreground/70 border border-foreground/20"
            : "text-foreground/50 border border-transparent hover:border-border"
      }`}
    >
      <span className="text-[11px] font-medium uppercase tracking-wider">
        {DAYS_OF_WEEK[day.getDay()].slice(0, 3)}
      </span>
      <span className={`text-lg font-bold ${isSelected ? "text-neon" : isToday ? "text-foreground" : ""}`}>
        {day.getDate()}
      </span>
      {/* Today dot indicator (only when not selected) */}
      {isToday && !isSelected && (
        <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-neon" />
      )}
      {/* Event count dot */}
      {eventCount > 0 && !isSelected && (
        <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-neon/20 text-[9px] font-bold text-neon">
          {eventCount}
        </span>
      )}
      {eventCount > 0 && isSelected && (
        <span className="mt-0.5 text-[10px] font-medium">
          {eventCount} {eventCount === 1 ? "event" : "events"}
        </span>
      )}
    </button>
  );
}

/* ---------- Desktop Week Grid ---------- */

function WeekGrid({
  days,
  label,
  today,
  getEventsForDay,
  userId,
  isAdmin,
  onViewEvent,
  onMarkAttendance,
  userTimezone = "America/Phoenix",
}: {
  days: Date[];
  label: string;
  today: Date;
  getEventsForDay: (date: Date) => GameNightWithAttendees[];
  userId?: string;
  isAdmin?: boolean;
  onViewEvent?: (gn: GameNightWithAttendees) => void;
  onMarkAttendance?: (gn: GameNightWithAttendees) => void;
  userTimezone?: string;
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
                  <CompactEvent key={gn.id} gn={gn} onView={onViewEvent} userTimezone={userTimezone} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Compact Event (calendar grid cell) ---------- */

function CompactEvent({
  gn,
  onView,
  userTimezone = "America/Phoenix",
}: {
  gn: GameNightWithAttendees;
  onView?: (gn: GameNightWithAttendees) => void;
  userTimezone?: string;
}) {
  const isPending = gn.status === "pending";
  const isRejected = gn.status === "rejected";
  const utcDateStr = dateToUtcString(new Date(gn.date));
  const localStartTime = formatEventTimeForViewer(gn.startTime, utcDateStr, userTimezone, gn.timezone);
  // Strip timezone abbreviation for compact view — just show time
  const shortTime = localStartTime.split(" ").slice(0, 2).join(" ");

  return (
    <div
      onClick={() => onView?.(gn)}
      className={`rounded-md border p-1.5 text-xs cursor-pointer ${
        gn.status === "cancelled"
          ? "border-danger/30 bg-danger/5 text-danger/70 line-through"
          : isPending
            ? "border-dashed border-warning/40 bg-warning/5"
            : isRejected
              ? "border-danger/30 bg-danger/5"
              : "border-neon/30 bg-neon/5"
      } hover:border-neon/60`}
    >
      {(isPending || isRejected) && (
        <div className={`font-medium ${isPending ? "text-warning" : "text-danger"} text-[10px] uppercase`}>
          {isPending ? "Pending" : "Rejected"}
        </div>
      )}
      <div className={`font-medium ${isPending ? "text-warning" : isRejected ? "text-danger/70" : "text-neon"} truncate`}>
        {gn.game}
      </div>
      <div className="text-foreground/50">
        {shortTime}
      </div>
    </div>
  );
}

/* ---------- Full Event Card (mobile day view) ---------- */

function DayEvent({
  gn,
  userId,
  isAdmin,
  onView,
  onMarkAttendance,
  userTimezone = "America/Phoenix",
}: {
  gn: GameNightWithAttendees;
  userId?: string;
  isAdmin?: boolean;
  onView?: (gn: GameNightWithAttendees) => void;
  onMarkAttendance?: (gn: GameNightWithAttendees) => void;
  userTimezone?: string;
}) {
  const confirmed = gn.attendees.filter((a) => a.status === "confirmed");
  const isPending = gn.status === "pending";
  const isRejected = gn.status === "rejected";
  const isInviteOnly = gn.visibility === "invite_only";
  const utcDateStr = dateToUtcString(new Date(gn.date));

  return (
    <div
      onClick={() => onView?.(gn)}
      className={`rounded-xl border p-4 cursor-pointer transition ${
        isPending
          ? "border-dashed border-warning/40 bg-warning/5"
          : isRejected
            ? "border-danger/30 bg-danger/5"
            : "border-border bg-surface hover:border-neon/30"
      }`}
    >
      <div className="mb-1 flex items-center gap-2">
        <span className={`font-bold ${isPending ? "text-warning" : isRejected ? "text-danger/70" : "text-neon"}`}>
          {gn.game}
        </span>
        <span className="text-sm text-foreground/50">
          {formatEventTimeForViewer(gn.startTime, utcDateStr, userTimezone, gn.timezone)} - {formatEventTimeForViewer(gn.endTime, utcDateStr, userTimezone, gn.timezone)}
        </span>
      </div>
      {gn.title && (
        <p className="text-sm text-foreground/60">{gn.title}</p>
      )}
      {isPending && (
        <span className="text-[10px] font-medium uppercase text-warning">Pending</span>
      )}
      {isInviteOnly && (
        <span className="text-[10px] font-medium uppercase text-foreground/40 ml-2">Invite-Only</span>
      )}
      {confirmed.length > 0 && (
        <p className="mt-1 text-xs text-neon/70">{confirmed.length} going</p>
      )}
    </div>
  );
}
