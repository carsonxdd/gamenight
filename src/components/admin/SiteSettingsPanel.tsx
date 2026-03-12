"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import Card from "@/components/ui/Card";
import { US_TIMEZONES, formatTime } from "@/lib/constants";
import { updateSiteSettings } from "@/app/admin/settings-actions";

interface Props {
  settings: {
    primeStartHour: number;
    primeEndHour: number;
    extendedStartHour: number;
    extendedEndHour: number;
    anchorTimezone: string;
    defaultEventDuration: number;
    maxEventsPerWeek: number;
    maxPollsPerWeek: number;
    communityName: string;
    motd: string | null;
  };
}

// Hours from 0-25 (25 = 1 AM next day)
const HOUR_OPTIONS = Array.from({ length: 26 }, (_, i) => {
  const h = i % 24;
  const label = formatTime(`${h.toString().padStart(2, "0")}:00`);
  return {
    value: i,
    label: i >= 24 ? `${label} (next day)` : label,
  };
});

export default function SiteSettingsPanel({ settings }: Props) {
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const update = (key: string, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const result = await updateSiteSettings(form);
    setSaving(false);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Settings saved!" });
    }
  };

  return (
    <motion.div {...fadeIn} className="space-y-6">
      {/* Availability Time Window */}
      <Card>
        <h3 className="mb-1 text-sm font-semibold text-foreground">
          Availability Time Window
        </h3>
        <p className="mb-4 text-xs text-foreground/40">
          Prime time is highlighted in full neon. Extended hours are shown dimmed to encourage
          scheduling within the prime window.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-foreground/50">Anchor Timezone</label>
            <select
              value={form.anchorTimezone}
              onChange={(e) => update("anchorTimezone", e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:border-neon/50 focus:outline-none focus:ring-1 focus:ring-neon/50"
            >
              {US_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs text-foreground/50">Extended Start</label>
            <select
              value={form.extendedStartHour}
              onChange={(e) => update("extendedStartHour", parseInt(e.target.value))}
              className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:border-neon/50 focus:outline-none focus:ring-1 focus:ring-neon/50"
            >
              {HOUR_OPTIONS.filter((h) => h.value <= form.primeStartHour).map((h) => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neon">Prime Start</label>
            <select
              value={form.primeStartHour}
              onChange={(e) => update("primeStartHour", parseInt(e.target.value))}
              className="w-full rounded-lg border border-neon/30 bg-neon/5 px-3 py-1.5 text-sm text-foreground focus:border-neon/50 focus:outline-none focus:ring-1 focus:ring-neon/50"
            >
              {HOUR_OPTIONS.filter((h) => h.value >= form.extendedStartHour && h.value < form.primeEndHour).map((h) => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neon">Prime End</label>
            <select
              value={form.primeEndHour}
              onChange={(e) => update("primeEndHour", parseInt(e.target.value))}
              className="w-full rounded-lg border border-neon/30 bg-neon/5 px-3 py-1.5 text-sm text-foreground focus:border-neon/50 focus:outline-none focus:ring-1 focus:ring-neon/50"
            >
              {HOUR_OPTIONS.filter((h) => h.value > form.primeStartHour && h.value <= form.extendedEndHour).map((h) => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-foreground/50">Extended End</label>
            <select
              value={form.extendedEndHour}
              onChange={(e) => update("extendedEndHour", parseInt(e.target.value))}
              className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:border-neon/50 focus:outline-none focus:ring-1 focus:ring-neon/50"
            >
              {HOUR_OPTIONS.filter((h) => h.value >= form.primeEndHour).map((h) => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Visual preview */}
        <div className="mt-4">
          <p className="mb-2 text-xs text-foreground/40">Preview (anchor timezone):</p>
          <div className="flex items-center gap-0.5 overflow-x-auto">
            {Array.from({ length: (form.extendedEndHour <= form.extendedStartHour ? form.extendedEndHour + 24 : form.extendedEndHour) - form.extendedStartHour + 1 }, (_, i) => {
              const hour = form.extendedStartHour + i;
              const normPrimeEnd = form.primeEndHour <= form.primeStartHour ? form.primeEndHour + 24 : form.primeEndHour;
              const isPrime = hour >= form.primeStartHour && hour < normPrimeEnd;
              const displayHour = hour % 24;
              return (
                <div
                  key={hour}
                  className={`flex h-8 min-w-[2.5rem] items-center justify-center rounded text-xs ${
                    isPrime
                      ? "bg-neon/30 text-neon border border-neon/40"
                      : "bg-foreground/5 text-foreground/30 border border-foreground/10"
                  }`}
                  title={isPrime ? "Prime time" : "Extended"}
                >
                  {formatTime(`${displayHour.toString().padStart(2, "0")}:00`).replace(/ [AP]M/, "").replace(/:00/, "")}
                </div>
              );
            })}
          </div>
          <div className="mt-1.5 flex items-center gap-3 text-xs text-foreground/40">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-4 rounded bg-neon/30 border border-neon/40" /> Prime
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-4 rounded bg-foreground/5 border border-foreground/10" /> Extended
            </span>
          </div>
        </div>
      </Card>

      {/* Event & Poll Limits */}
      <Card>
        <h3 className="mb-1 text-sm font-semibold text-foreground">Limits</h3>
        <p className="mb-4 text-xs text-foreground/40">
          Limits for non-admin users. Admins bypass these.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-foreground/50">Default Event Duration (hrs)</label>
            <input
              type="number"
              min={1}
              max={8}
              value={form.defaultEventDuration}
              onChange={(e) => update("defaultEventDuration", parseInt(e.target.value) || 3)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:border-neon/50 focus:outline-none focus:ring-1 focus:ring-neon/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-foreground/50">Max Events / Week (non-admin)</label>
            <input
              type="number"
              min={1}
              max={20}
              value={form.maxEventsPerWeek}
              onChange={(e) => update("maxEventsPerWeek", parseInt(e.target.value) || 5)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:border-neon/50 focus:outline-none focus:ring-1 focus:ring-neon/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-foreground/50">Max Polls / Week (non-admin)</label>
            <input
              type="number"
              min={1}
              max={20}
              value={form.maxPollsPerWeek}
              onChange={(e) => update("maxPollsPerWeek", parseInt(e.target.value) || 5)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:border-neon/50 focus:outline-none focus:ring-1 focus:ring-neon/50"
            />
          </div>
        </div>
      </Card>

      {/* Community */}
      <Card>
        <h3 className="mb-1 text-sm font-semibold text-foreground">Community</h3>
        <p className="mb-4 text-xs text-foreground/40">Branding and messages.</p>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-foreground/50">Community Name</label>
            <input
              type="text"
              maxLength={50}
              value={form.communityName}
              onChange={(e) => update("communityName", e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:border-neon/50 focus:outline-none focus:ring-1 focus:ring-neon/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-foreground/50">Message of the Day (optional)</label>
            <textarea
              maxLength={200}
              rows={2}
              value={form.motd || ""}
              onChange={(e) => update("motd", e.target.value || null)}
              placeholder="Show a banner message to all members..."
              className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground placeholder:text-foreground/20 focus:border-neon/50 focus:outline-none focus:ring-1 focus:ring-neon/50"
            />
          </div>
        </div>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-neon px-5 py-2 text-sm font-semibold text-background transition hover:bg-neon-dim disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
        {message && (
          <p className={`text-sm ${message.type === "error" ? "text-red-400" : "text-neon"}`}>
            {message.text}
          </p>
        )}
      </div>
    </motion.div>
  );
}
