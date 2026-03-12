export function isUserMuted(user: { isMuted: boolean; mutedUntil: Date | string | null }): boolean {
  if (user.isMuted) return true;
  if (user.mutedUntil) {
    const until = typeof user.mutedUntil === "string" ? new Date(user.mutedUntil) : user.mutedUntil;
    return until > new Date();
  }
  return false;
}

export function formatMuteRemaining(mutedUntil: Date | string): string {
  const until = typeof mutedUntil === "string" ? new Date(mutedUntil) : mutedUntil;
  const diffMs = until.getTime() - Date.now();
  if (diffMs <= 0) return "expired";

  const totalMinutes = Math.ceil(diffMs / 60000);
  if (totalMinutes < 60) return `${totalMinutes}m`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
