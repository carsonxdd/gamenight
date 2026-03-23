"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { sendAnnouncementAction } from "@/app/admin/settings-actions";
import type { GameNightWithAttendees } from "./ScheduleView";
import { utcToLocalDateTime, dateToUtcString } from "@/lib/timezone-utils";

interface Props {
  open: boolean;
  onClose: () => void;
  gameNight: GameNightWithAttendees;
  userTimezone?: string;
}

interface TemplateOption {
  id: string;
  label: string;
  icon: string;
  buildTitle: (ctx: EventContext) => string;
  buildBody: (ctx: EventContext) => string;
  mention: string;
}

interface EventContext {
  title: string;
  game: string;
  day: string;       // "Friday, March 14"
  time: string;      // "7:00 PM"
  host: string;
  rsvpCount: number;
  description: string;
}

function buildContext(gn: GameNightWithAttendees, userTimezone: string): EventContext {
  const utcDateStr = dateToUtcString(new Date(gn.date));
  const local = utcToLocalDateTime(utcDateStr, gn.startTime, userTimezone);
  const localDate = new Date(local.localDate + "T12:00:00");

  const day = localDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Format time from HH:MM to readable
  const [h, m] = local.localTime.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  const time = `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;

  return {
    title: gn.title || gn.game,
    game: gn.game,
    day,
    time,
    host: gn.host?.gamertag || gn.host?.name || "TBD",
    rsvpCount: gn.attendees.filter((a) => a.status === "confirmed").length,
    description: gn.description || "",
  };
}

const TEMPLATES: TemplateOption[] = [
  {
    id: "game_night",
    label: "Game Night",
    icon: "🎮",
    buildTitle: (ctx) => `Game Night: ${ctx.game}`,
    buildBody: (ctx) =>
      `We're playing **${ctx.game}** this **${ctx.day}** at **${ctx.time}**!\n\n` +
      `Hosted by **${ctx.host}**. Head to the site to RSVP — let's get a full lobby!\n\n📅 **pvpers.us/schedule**`,
    mention: "@everyone",
  },
  {
    id: "tournament_hype",
    label: "Tournament",
    icon: "🏆",
    buildTitle: (ctx) => `Tournament: ${ctx.title}`,
    buildBody: (ctx) =>
      `A **${ctx.game}** tournament is happening on **${ctx.day}** at **${ctx.time}**!\n\n` +
      `Sign up on the site before spots fill up. Don't miss your chance to compete!\n\n📅 **pvpers.us/schedule**`,
    mention: "@everyone",
  },
  {
    id: "big_event",
    label: "Big Event",
    icon: "🎉",
    buildTitle: (ctx) => ctx.title,
    buildBody: (ctx) =>
      `Something special is happening! **${ctx.title}** — **${ctx.day}** at **${ctx.time}**.\n\n` +
      (ctx.description ? `> ${ctx.description}\n\n` : "") +
      `Hosted by **${ctx.host}**. RSVP on the site — you won't want to miss this!\n\n📅 **pvpers.us/schedule**`,
    mention: "@everyone",
  },
  {
    id: "reminder",
    label: "Reminder",
    icon: "⏰",
    buildTitle: (ctx) => `Reminder: ${ctx.title} Tonight!`,
    buildBody: (ctx) =>
      `Just a reminder — **${ctx.title}** is happening **tonight at ${ctx.time}**!\n\n` +
      (ctx.rsvpCount > 0 ? `${ctx.rsvpCount} people are already confirmed. ` : "") +
      `Make sure you've RSVP'd on the site. See you there!\n\n📅 **pvpers.us/schedule**`,
    mention: "@here",
  },
  {
    id: "hype",
    label: "Hype Up",
    icon: "🔥",
    buildTitle: (ctx) => `${ctx.game} — Who's In?`,
    buildBody: (ctx) =>
      `**${ctx.game}** is going down this **${ctx.day}** at **${ctx.time}**!\n\n` +
      (ctx.rsvpCount > 0
        ? `We've already got **${ctx.rsvpCount}** confirmed — the more the merrier. `
        : `We need people to show up! `) +
      `Hit up the site and RSVP if you haven't yet. Let's go!\n\n📅 **pvpers.us/schedule**`,
    mention: "@everyone",
  },
  {
    id: "custom",
    label: "Custom",
    icon: "✏️",
    buildTitle: () => "",
    buildBody: () => "",
    mention: "",
  },
];

export default function AnnouncementModal({
  open,
  onClose,
  gameNight,
  userTimezone = "America/Phoenix",
}: Props) {
  const ctx = buildContext(gameNight, userTimezone);

  const [selectedTemplate, setSelectedTemplate] = useState("game_night");
  const [title, setTitle] = useState(() => TEMPLATES[0].buildTitle(ctx));
  const [message, setMessage] = useState(() => TEMPLATES[0].buildBody(ctx));
  const [mention, setMention] = useState(TEMPLATES[0].mention);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplate(id);
    setResult(null);
    const tpl = TEMPLATES.find((t) => t.id === id);
    if (tpl && id !== "custom") {
      setTitle(tpl.buildTitle(ctx));
      setMessage(tpl.buildBody(ctx));
      setMention(tpl.mention);
    }
  };

  const handleSend = async () => {
    setSending(true);
    setResult(null);
    const res = await sendAnnouncementAction({
      title,
      message,
      mention: mention || undefined,
    });
    setSending(false);
    if (res.success) {
      setResult({ type: "success", text: "Announcement sent!" });
    } else {
      setResult({ type: "error", text: res.error || "Failed to send" });
    }
  };

  // Custom fields for fill-in-the-blank
  const handleFieldChange = (field: keyof EventContext, value: string) => {
    const updated = { ...ctx, [field]: value };
    const tpl = TEMPLATES.find((t) => t.id === selectedTemplate);
    if (tpl && selectedTemplate !== "custom") {
      setTitle(tpl.buildTitle(updated));
      setMessage(tpl.buildBody(updated));
    }
  };

  const isCustom = selectedTemplate === "custom";

  return (
    <Modal open={open} onClose={onClose} title="Announce Event" wide>
      <div className="space-y-4">
        {/* Event Info Bar */}
        <div className="rounded-lg border border-border bg-surface-light p-3">
          <p className="text-sm font-medium text-foreground">{ctx.title}</p>
          <p className="text-xs text-foreground/50">
            {ctx.game} &middot; {ctx.day} &middot; {ctx.time} &middot; Hosted by {ctx.host}
          </p>
        </div>

        {/* Template Picker */}
        <div>
          <label className="mb-2 block text-xs text-foreground/50">Template</label>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => handleSelectTemplate(tpl.id)}
                className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                  selectedTemplate === tpl.id
                    ? "border-neon bg-neon/10 text-neon font-medium"
                    : "border-border bg-surface text-foreground/50 hover:border-border-light hover:text-foreground"
                }`}
              >
                {tpl.icon} {tpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Editable fields for non-custom templates */}
        {!isCustom && (
          <div>
            <label className="mb-2 block text-xs text-foreground/50">Quick Edit Fields</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div>
                <label className="mb-0.5 block text-xs text-foreground/30">Game</label>
                <input
                  type="text"
                  value={ctx.game}
                  onChange={(e) => handleFieldChange("game", e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground focus:border-neon/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-0.5 block text-xs text-foreground/30">Day</label>
                <input
                  type="text"
                  value={ctx.day}
                  onChange={(e) => handleFieldChange("day", e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground focus:border-neon/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-0.5 block text-xs text-foreground/30">Time</label>
                <input
                  type="text"
                  value={ctx.time}
                  onChange={(e) => handleFieldChange("time", e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground focus:border-neon/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-0.5 block text-xs text-foreground/30">Host</label>
                <input
                  type="text"
                  value={ctx.host}
                  onChange={(e) => handleFieldChange("host", e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground focus:border-neon/50 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="mb-1 block text-xs text-foreground/50">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!isCustom) setSelectedTemplate("custom");
            }}
            maxLength={100}
            placeholder="Announcement title"
            className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground placeholder:text-foreground/20 focus:border-neon/50 focus:outline-none focus:ring-1 focus:ring-neon/50"
          />
        </div>

        {/* Message */}
        <div>
          <label className="mb-1 block text-xs text-foreground/50">Message</label>
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (!isCustom) setSelectedTemplate("custom");
            }}
            maxLength={2000}
            rows={4}
            placeholder="What would you like to announce?"
            className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground placeholder:text-foreground/20 focus:border-neon/50 focus:outline-none focus:ring-1 focus:ring-neon/50"
          />
          <p className="mt-0.5 text-xs text-foreground/20">{message.length}/2000 &middot; **bold** and &gt; quotes work in Discord</p>
        </div>

        {/* Ping */}
        <div>
          <label className="mb-1 block text-xs text-foreground/50">Ping</label>
          <div className="flex gap-2">
            {[
              { value: "", label: "No ping" },
              { value: "@everyone", label: "@everyone" },
              { value: "@here", label: "@here" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMention(opt.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                  mention === opt.value
                    ? "border-neon bg-neon/10 text-neon font-medium"
                    : "border-border bg-surface text-foreground/50 hover:border-border-light"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="mb-1 block text-xs text-foreground/50">Preview</label>
          <div className="rounded-lg border border-border bg-[#2b2d31] p-3">
            {mention && (
              <p className="mb-1 text-sm text-[#5865f2] font-medium">{mention}</p>
            )}
            <div className="border-l-4 border-neon pl-3">
              <p className="text-sm font-semibold text-white">{title || "Untitled"}</p>
              <p className="mt-1 text-xs text-[#b5bac1] whitespace-pre-wrap leading-relaxed">
                {message
                  .replace(/\*\*(.+?)\*\*/g, "$1")
                  .replace(/^> (.+)$/gm, "│ $1")
                  || "No message"}
              </p>
            </div>
          </div>
        </div>

        {/* Send */}
        <div className="flex items-center gap-3 pt-2 border-t border-border">
          <button
            onClick={handleSend}
            disabled={sending || !title.trim() || !message.trim()}
            className="rounded-lg bg-neon px-5 py-2 text-sm font-semibold text-background transition hover:bg-neon-dim disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? "Sending..." : "Send to Discord"}
          </button>
          {result && (
            <p className={`text-sm ${result.type === "error" ? "text-red-400" : "text-neon"}`}>
              {result.text}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
