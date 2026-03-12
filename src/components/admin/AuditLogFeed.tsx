"use client";

import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import Card from "@/components/ui/Card";
import type { AuditLogEntry } from "./AdminDashboard";

const ACTION_LABELS: Record<string, string> = {
  EVENT_CREATED: "created an event",
  EVENT_DELETED: "deleted an event",
  EVENT_CANCELLED: "cancelled an event",
  TOURNAMENT_CREATED: "created a tournament",
  TOURNAMENT_STATUS_CHANGED: "updated tournament status",
  TOURNAMENT_DELETED: "deleted a tournament",
  TEAM_CREATED: "created a team",
  TEAM_DISBANDED: "disbanded a team",
  POLL_CREATED: "created a poll",
  POLL_CLOSED: "closed a poll",
  POLL_DELETED: "deleted a poll",
  ROLE_CHANGED: "changed a user's role",
  USER_REMOVED: "removed a user",
  USER_MUTED: "muted a user",
  USER_UNMUTED: "unmuted a user",
  SETTINGS_UPDATED: "updated site settings",
  USER_JOINED: "joined the site",
};

const ENTITY_ICONS: Record<string, string> = {
  GameNight: "📅",
  Tournament: "🏆",
  Team: "👥",
  Poll: "📊",
  User: "👤",
  SiteSettings: "⚙️",
};

const ENTITY_COLORS: Record<string, string> = {
  GameNight: "text-blue-400",
  Tournament: "text-yellow-400",
  Team: "text-purple-400",
  Poll: "text-emerald-400",
  User: "text-neon",
  SiteSettings: "text-orange-400",
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getMetadataDetail(log: AuditLogEntry): string | null {
  if (!log.metadata) return null;
  try {
    const meta = JSON.parse(log.metadata);
    if (meta.title) return `"${meta.title}"`;
    if (meta.name) return meta.name;
    if (meta.status) return `to ${meta.status}`;
    if (meta.targetName) return meta.targetName;
    return null;
  } catch {
    return null;
  }
}

interface Props {
  logs: AuditLogEntry[];
}

export default function AuditLogFeed({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <motion.div {...fadeIn}>
        <Card>
          <p className="py-8 text-center text-sm text-foreground/40">
            No activity logged yet. Actions will appear here as they happen.
          </p>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div {...fadeIn} className="space-y-2">
      {logs.map((log) => {
        const icon = ENTITY_ICONS[log.entityType] || "📋";
        const colorClass = ENTITY_COLORS[log.entityType] || "text-foreground/60";
        const actionLabel = ACTION_LABELS[log.action] || log.action.toLowerCase().replace(/_/g, " ");
        const detail = getMetadataDetail(log);

        return (
          <div
            key={log.id}
            className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3"
          >
            <span className="mt-0.5 text-lg">{icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-medium text-foreground">{log.actorName}</span>
                <span className="text-foreground/60"> {actionLabel}</span>
                {detail && (
                  <span className={`ml-1 font-medium ${colorClass}`}>{detail}</span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-foreground/40">
                {formatRelativeTime(log.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}
