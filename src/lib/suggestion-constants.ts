export const SUGGESTION_STATUSES = ["open", "noted", "planned", "done", "declined"] as const;
export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number];

export const SUGGESTION_STATUS_CONFIG: Record<SuggestionStatus, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-neon/15 text-neon" },
  noted: { label: "Noted", color: "bg-info/15 text-info" },
  planned: { label: "Planned", color: "bg-warning/15 text-warning" },
  done: { label: "Done", color: "bg-success/15 text-success" },
  declined: { label: "Declined", color: "bg-foreground/10 text-foreground/40" },
};

export const SUGGESTION_LIMITS = {
  TITLE_MIN: 3,
  TITLE_MAX: 100,
  DESCRIPTION_MAX: 500,
};
