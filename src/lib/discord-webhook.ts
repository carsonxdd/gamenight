import { prisma } from "./prisma";
import { hexToRgb } from "./settings-constants";

interface DiscordEmbed {
  title: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
  url?: string;
}

type NotifyToggle =
  | "notifyEventApproved"
  | "notifyEventCancelled"
  | "notifyEventEdited"
  | "notifyTournamentCreated"
  | "notifyPollCreated"
  | "notifyMemberJoined";

function hexToDecimal(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (r << 16) + (g << 8) + b;
}

// ─── Colors for different notification types ─────────────────────────
const EMBED_COLORS = {
  event: 0x00d4ff,       // electric blue
  approved: 0x39ff14,    // neon green
  tournament: 0xffd60a,  // gold
  poll: 0xbf5af2,        // purple
  member: 0x30d5c8,      // teal
  announcement: 0xff2d55, // hot pink
} as const;

const SCHEDULE_URL = "https://pvpers.us/schedule";

/** Fire-and-forget: sends to the updates webhook. Never throws. */
function sendUpdateNotification(params: {
  type: NotifyToggle;
  embeds: DiscordEmbed[];
  content?: string;
}): void {
  (async () => {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
    });
    if (!settings?.discordUpdatesWebhookUrl) return;
    if (!settings[params.type]) return;

    const body: Record<string, unknown> = { embeds: params.embeds };
    if (params.content) body.content = params.content;

    await fetch(settings.discordUpdatesWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  })().catch(() => {});
}

// ─── Auto-notification helpers (→ #GameNightUpdates) ─────────────────

export function notifyEventApproved(event: {
  title: string;
  game: string;
  date: string;
}): void {
  sendUpdateNotification({
    type: "notifyEventApproved",
    content: "@here",
    embeds: [
      {
        title: `✅  Event Approved`,
        description: `**${event.title}** has been approved and is now live!\n\n📅 Check out the schedule at **pvpers.us/schedule**`,
        color: EMBED_COLORS.approved,
        url: SCHEDULE_URL,
        fields: [
          { name: "🎮 Game", value: event.game, inline: true },
          { name: "📆 Date", value: event.date, inline: true },
        ],
        footer: { text: "Head to the site to RSVP!" },
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

export function notifyEventCancelled(event: {
  title: string;
  game: string;
  date: string;
}): void {
  sendUpdateNotification({
    type: "notifyEventCancelled",
    embeds: [
      {
        title: `❌  Event Cancelled`,
        description: `**${event.title}** has been cancelled.\n\n📅 Check out the schedule at **pvpers.us/schedule**`,
        color: 0xff3b30,
        url: SCHEDULE_URL,
        fields: [
          { name: "🎮 Game", value: event.game, inline: true },
          { name: "📆 Date", value: event.date, inline: true },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

export function notifyEventEdited(event: {
  title: string;
  game: string;
  date: string;
  changes: string;
}): void {
  sendUpdateNotification({
    type: "notifyEventEdited",
    embeds: [
      {
        title: `✏️  Event Updated`,
        description: `**${event.title}** has been updated.\n\n📅 Check out the schedule at **pvpers.us/schedule**`,
        color: EMBED_COLORS.event,
        url: SCHEDULE_URL,
        fields: [
          { name: "🎮 Game", value: event.game, inline: true },
          { name: "📆 Date", value: event.date, inline: true },
          { name: "📝 Changes", value: event.changes },
        ],
        footer: { text: "Check the site for details" },
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

export function notifyTournamentCreated(tournament: {
  title: string;
  game: string;
  bracketType: string;
  maxSlots: number;
}): void {
  const bracketLabels: Record<string, string> = {
    single_elim: "Single Elimination",
    double_elim: "Double Elimination",
    round_robin: "Round Robin",
    swiss: "Swiss",
    constellation: "Constellation",
    ffa: "Free-for-All",
  };
  sendUpdateNotification({
    type: "notifyTournamentCreated",
    embeds: [
      {
        title: `🏆  New Tournament Created`,
        description: `**${tournament.title}**\nSign up before spots fill!\n\n📅 Check out the schedule at **pvpers.us/schedule**`,
        color: EMBED_COLORS.tournament,
        url: SCHEDULE_URL,
        fields: [
          { name: "🎮 Game", value: tournament.game, inline: true },
          { name: "🗡️ Format", value: bracketLabels[tournament.bracketType] || tournament.bracketType, inline: true },
          { name: "👥 Slots", value: `${tournament.maxSlots}`, inline: true },
        ],
        footer: { text: "Register on the site!" },
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

export function notifyPollCreated(poll: {
  title: string;
  optionCount: number;
  creatorName: string;
}): void {
  sendUpdateNotification({
    type: "notifyPollCreated",
    embeds: [
      {
        title: `📊  New Poll`,
        description: `**${poll.title}**\n\n🗳️ Cast your vote at **pvpers.us/polls**`,
        color: EMBED_COLORS.poll,
        url: "https://pvpers.us/polls",
        fields: [
          { name: "Options", value: `${poll.optionCount}`, inline: true },
          { name: "Created by", value: poll.creatorName, inline: true },
        ],
        footer: { text: "Cast your vote on the site!" },
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

export function notifyMemberJoined(member: {
  gamertag: string;
}): void {
  sendUpdateNotification({
    type: "notifyMemberJoined",
    embeds: [
      {
        title: `👋  Welcome!`,
        description: `**${member.gamertag}** just joined the community!\n\n📅 Check out upcoming events at **pvpers.us/schedule**`,
        color: EMBED_COLORS.member,
        url: SCHEDULE_URL,
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

// ─── Direct webhook send (for test + announcements) ──────────────────

export async function sendWebhookDirect(params: {
  webhookUrl: string;
  embeds: DiscordEmbed[];
  content?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const body: Record<string, unknown> = { embeds: params.embeds };
    if (params.content) body.content = params.content;

    const res = await fetch(params.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      return { success: false, error: `Discord returned ${res.status}: ${text}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

