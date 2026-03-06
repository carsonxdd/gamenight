"use client";

import { DAYS_OF_WEEK, TIME_SLOTS, formatTime } from "@/lib/constants";

export interface Availability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface AvailabilityPickerProps {
  selected: Availability[];
  onChange: (availability: Availability[]) => void;
  max?: number;
}

export default function AvailabilityPicker({
  selected,
  onChange,
  max = 2,
}: AvailabilityPickerProps) {
  const isSelected = (day: number) => selected.some((a) => a.dayOfWeek === day);

  const toggleDay = (day: number) => {
    if (isSelected(day)) {
      onChange(selected.filter((a) => a.dayOfWeek !== day));
    } else if (selected.length < max) {
      onChange([...selected, { dayOfWeek: day, startTime: "19:00", endTime: "23:00" }]);
    }
  };

  const updateTime = (day: number, field: "startTime" | "endTime", value: string) => {
    onChange(
      selected.map((a) => (a.dayOfWeek === day ? { ...a, [field]: value } : a))
    );
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          Available Nights
        </label>
        <span className="text-xs text-foreground/50">
          {selected.length}/{max} nights selected
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {DAYS_OF_WEEK.map((day, i) => (
          <div key={day}>
            <button
              type="button"
              onClick={() => toggleDay(i)}
              className={`w-full rounded-lg border p-3 text-sm transition ${
                isSelected(i)
                  ? "border-neon bg-neon/10 text-neon"
                  : selected.length >= max
                    ? "cursor-not-allowed border-border bg-surface text-foreground/30"
                    : "border-border bg-surface text-foreground/70 hover:border-border-light"
              }`}
            >
              {day.slice(0, 3)}
            </button>

            {isSelected(i) && (
              <div className="mt-2 space-y-1">
                <select
                  value={selected.find((a) => a.dayOfWeek === i)?.startTime}
                  onChange={(e) => updateTime(i, "startTime", e.target.value)}
                  className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-foreground focus:border-neon focus:outline-none"
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>
                      {formatTime(t)}
                    </option>
                  ))}
                </select>
                <select
                  value={selected.find((a) => a.dayOfWeek === i)?.endTime}
                  onChange={(e) => updateTime(i, "endTime", e.target.value)}
                  className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-foreground focus:border-neon focus:outline-none"
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>
                      {formatTime(t)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
