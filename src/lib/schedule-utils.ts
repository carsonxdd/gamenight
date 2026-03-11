/**
 * Gets the most recent Friday at or before the given date.
 */
export function getWeekStartFriday(date: Date): Date {
  const d = new Date(date);
  // Friday = 5. offset: (day + 2) % 7
  // day=5(Fri) -> 0, day=6(Sat) -> 1, day=0(Sun) -> 2, day=1(Mon) -> 3, etc.
  const day = d.getDay();
  const offset = (day + 2) % 7;
  d.setDate(d.getDate() - offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatRange(start: Date, end: Date): string {
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}
