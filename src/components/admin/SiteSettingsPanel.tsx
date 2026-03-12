"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import Card from "@/components/ui/Card";
import { US_TIMEZONES, formatTime } from "@/lib/constants";
import { updateSiteSettings } from "@/app/admin/settings-actions";
import {
  ACCENT_PRESETS,
  SETTINGS_SECTIONS,
  JOIN_MODES,
  FEATURE_TOGGLES,
  type SettingsSection,
  type SiteSettingsData,
} from "@/lib/settings-constants";
import InviteCodesPanel from "./InviteCodesPanel";
import ApprovalQueuePanel from "./ApprovalQueuePanel";

interface Props {
  settings: SiteSettingsData;
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

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 transition hover:border-border-light">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-foreground/40">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-neon" : "bg-foreground/20"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5.5" : "translate-x-0.5"
          } mt-0.5`}
        />
      </button>
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-foreground/50">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || min || 0)}
        className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:border-neon/50 focus:outline-none focus:ring-1 focus:ring-neon/50"
      />
      {hint && <p className="mt-1 text-xs text-foreground/30">{hint}</p>}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  maxLength,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  placeholder?: string;
  multiline?: boolean;
}) {
  const cls =
    "w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground placeholder:text-foreground/20 focus:border-neon/50 focus:outline-none focus:ring-1 focus:ring-neon/50";
  return (
    <div>
      <label className="mb-1 block text-xs text-foreground/50">{label}</label>
      {multiline ? (
        <textarea
          maxLength={maxLength}
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
        />
      ) : (
        <input
          type="text"
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </div>
  );
}

export default function SiteSettingsPanel({ settings }: Props) {
  const [form, setForm] = useState<SiteSettingsData>(settings);
  const [section, setSection] = useState<SettingsSection>("branding");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const update = <K extends keyof SiteSettingsData>(
    key: K,
    value: SiteSettingsData[K]
  ) => {
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
    <motion.div {...fadeIn}>
      {/* Mobile tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto md:hidden">
        {SETTINGS_SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs transition ${
              section === s.key
                ? "bg-neon/10 text-neon font-medium"
                : "text-foreground/50 hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Desktop: sidebar + content side-by-side */}
      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <div className="hidden w-44 shrink-0 md:block">
          <nav className="sticky top-20 space-y-1">
            {SETTINGS_SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  section === s.key
                    ? "bg-neon/10 text-neon font-medium"
                    : "text-foreground/50 hover:text-foreground hover:bg-surface-light"
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content area */}
        <div className="min-w-0 flex-1">
        {/* Branding */}
        {section === "branding" && (
          <Card>
            <h3 className="mb-1 text-sm font-semibold text-foreground">Branding</h3>
            <p className="mb-4 text-xs text-foreground/40">
              Customize the look and feel of your community.
            </p>

            <div className="space-y-5">
              <TextField
                label="Community Name"
                value={form.communityName}
                onChange={(v) => update("communityName", v)}
                maxLength={50}
              />

              <TextField
                label="Tagline (optional)"
                value={form.communityTagline || ""}
                onChange={(v) => update("communityTagline", v || null)}
                maxLength={100}
                placeholder="A short subtitle for the hero section"
              />

              {/* Accent Color */}
              <div>
                <label className="mb-2 block text-xs text-foreground/50">Accent Color</label>
                <div className="flex flex-wrap gap-2">
                  {ACCENT_PRESETS.map((preset) => (
                    <button
                      key={preset.hex}
                      onClick={() => update("accentColor", preset.hex)}
                      title={preset.name}
                      className={`h-8 w-8 rounded-full border-2 transition hover:scale-110 ${
                        form.accentColor.toUpperCase() === preset.hex.toUpperCase()
                          ? "border-white scale-110 ring-2 ring-white/30"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: preset.hex }}
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs text-foreground/30">
                  Selected: {ACCENT_PRESETS.find((p) => p.hex.toUpperCase() === form.accentColor.toUpperCase())?.name || form.accentColor}
                </p>
              </div>

              <TextField
                label="Logo URL (optional)"
                value={form.logoUrl || ""}
                onChange={(v) => update("logoUrl", v || null)}
                placeholder="https://example.com/logo.png"
              />

              <TextField
                label="Favicon URL (optional)"
                value={form.faviconUrl || ""}
                onChange={(v) => update("faviconUrl", v || null)}
                placeholder="https://example.com/favicon.ico"
              />

              <TextField
                label="Message of the Day (optional)"
                value={form.motd || ""}
                onChange={(v) => update("motd", v || null)}
                maxLength={200}
                placeholder="Show a banner message to all members..."
                multiline
              />
            </div>
          </Card>
        )}

        {/* Availability Time Window */}
        {section === "availability" && (
          <Card>
            <h3 className="mb-1 text-sm font-semibold text-foreground">
              Availability Time Window
            </h3>
            <p className="mb-4 text-xs text-foreground/40">
              Prime time is highlighted in full neon. Extended hours are shown dimmed.
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
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
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
                    <option key={h.value} value={h.value}>
                      {h.label}
                    </option>
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
                  {HOUR_OPTIONS.filter(
                    (h) => h.value >= form.extendedStartHour && h.value < form.primeEndHour
                  ).map((h) => (
                    <option key={h.value} value={h.value}>
                      {h.label}
                    </option>
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
                  {HOUR_OPTIONS.filter(
                    (h) => h.value > form.primeStartHour && h.value <= form.extendedEndHour
                  ).map((h) => (
                    <option key={h.value} value={h.value}>
                      {h.label}
                    </option>
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
                    <option key={h.value} value={h.value}>
                      {h.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Visual preview */}
            <div className="mt-4">
              <p className="mb-2 text-xs text-foreground/40">Preview (anchor timezone):</p>
              <div className="flex items-center gap-0.5 overflow-x-auto">
                {Array.from(
                  {
                    length:
                      (form.extendedEndHour <= form.extendedStartHour
                        ? form.extendedEndHour + 24
                        : form.extendedEndHour) -
                      form.extendedStartHour +
                      1,
                  },
                  (_, i) => {
                    const hour = form.extendedStartHour + i;
                    const normPrimeEnd =
                      form.primeEndHour <= form.primeStartHour
                        ? form.primeEndHour + 24
                        : form.primeEndHour;
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
                        {formatTime(`${displayHour.toString().padStart(2, "0")}:00`)
                          .replace(/ [AP]M/, "")
                          .replace(/:00/, "")}
                      </div>
                    );
                  }
                )}
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-xs text-foreground/40">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-4 rounded bg-neon/30 border border-neon/40" />{" "}
                  Prime
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-4 rounded bg-foreground/5 border border-foreground/10" />{" "}
                  Extended
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Access & Privacy */}
        {section === "access" && (
          <>
          <Card>
            <h3 className="mb-1 text-sm font-semibold text-foreground">Access & Privacy</h3>
            <p className="mb-4 text-xs text-foreground/40">
              Control how new members join and what&apos;s visible.
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs text-foreground/50">Join Mode</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {JOIN_MODES.map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => update("joinMode", mode.value)}
                      className={`rounded-lg border px-4 py-3 text-left transition ${
                        form.joinMode === mode.value
                          ? "border-neon bg-neon/5 text-foreground"
                          : "border-border bg-surface text-foreground/50 hover:border-border-light"
                      }`}
                    >
                      <p className="text-sm font-medium">{mode.label}</p>
                      <p className="text-xs text-foreground/40">{mode.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Toggle
                  checked={form.requireGamertag}
                  onChange={(v) => update("requireGamertag", v)}
                  label="Require Gamertag"
                  description="Users must set a gamertag before accessing features"
                />
                <Toggle
                  checked={form.allowPublicProfiles}
                  onChange={(v) => update("allowPublicProfiles", v)}
                  label="Public Profiles"
                  description="Allow non-members to view player profiles"
                />
                <Toggle
                  checked={form.showMemberCount}
                  onChange={(v) => update("showMemberCount", v)}
                  label="Show Member Count"
                  description="Display member count on the landing page"
                />
              </div>
            </div>
          </Card>

          {/* Invite Codes — shown when invite_only mode */}
          {form.joinMode === "invite_only" && (
            <div className="mt-4">
              <InviteCodesPanel />
            </div>
          )}

          {/* Approval Queue — shown when approval mode */}
          {form.joinMode === "approval" && (
            <div className="mt-4">
              <ApprovalQueuePanel />
            </div>
          )}
          </>
        )}

        {/* Events */}
        {section === "events" && (
          <Card>
            <h3 className="mb-1 text-sm font-semibold text-foreground">Events</h3>
            <p className="mb-4 text-xs text-foreground/40">
              Control event creation and defaults.
            </p>

            <div className="space-y-4">
              <Toggle
                checked={form.allowMemberEvents}
                onChange={(v) => update("allowMemberEvents", v)}
                label="Allow Member Events"
                description="Let non-admin users create events (subject to approval)"
              />
              <Toggle
                checked={form.requireRSVP}
                onChange={(v) => update("requireRSVP", v)}
                label="Require RSVP"
                description="Members must RSVP before attending events"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <NumberField
                  label="Default Duration (hrs)"
                  value={form.defaultEventDuration}
                  onChange={(v) => update("defaultEventDuration", v)}
                  min={1}
                  max={8}
                />
                <NumberField
                  label="Max Events / Week"
                  value={form.maxEventsPerWeek}
                  onChange={(v) => update("maxEventsPerWeek", v)}
                  min={1}
                  max={20}
                  hint="For non-admin users"
                />
                <NumberField
                  label="Max Attendees Default"
                  value={form.maxAttendeesDefault}
                  onChange={(v) => update("maxAttendeesDefault", v)}
                  min={0}
                  max={100}
                  hint="0 = unlimited"
                />
              </div>

              <NumberField
                label="Auto-Archive After (days)"
                value={form.autoArchiveDays}
                onChange={(v) => update("autoArchiveDays", v)}
                min={1}
                max={365}
                hint="Past events are hidden after this many days"
              />
            </div>
          </Card>
        )}

        {/* Polls */}
        {section === "polls" && (
          <Card>
            <h3 className="mb-1 text-sm font-semibold text-foreground">Polls</h3>
            <p className="mb-4 text-xs text-foreground/40">
              Control poll creation and interaction.
            </p>

            <div className="space-y-4">
              <Toggle
                checked={form.allowMemberPolls}
                onChange={(v) => update("allowMemberPolls", v)}
                label="Allow Member Polls"
                description="Let non-admin users create polls"
              />
              <Toggle
                checked={form.allowPollComments}
                onChange={(v) => update("allowPollComments", v)}
                label="Allow Poll Comments"
                description="Enable comment threads on polls"
              />

              <NumberField
                label="Max Polls / Week"
                value={form.maxPollsPerWeek}
                onChange={(v) => update("maxPollsPerWeek", v)}
                min={1}
                max={20}
                hint="For non-admin users"
              />
            </div>
          </Card>
        )}

        {/* Tournaments */}
        {section === "tournaments" && (
          <Card>
            <h3 className="mb-1 text-sm font-semibold text-foreground">Tournaments</h3>
            <p className="mb-4 text-xs text-foreground/40">
              Control tournament creation and settings.
            </p>

            <div className="space-y-4">
              <Toggle
                checked={form.allowMemberTournaments}
                onChange={(v) => update("allowMemberTournaments", v)}
                label="Allow Member Tournaments"
                description="Let non-admin users create tournaments"
              />
              <Toggle
                checked={form.enableBuyIns}
                onChange={(v) => update("enableBuyIns", v)}
                label="Enable Buy-Ins"
                description="Allow tournaments to set a buy-in amount"
              />

              <NumberField
                label="Max Tournament Size"
                value={form.maxTournamentSize}
                onChange={(v) => update("maxTournamentSize", v)}
                min={2}
                max={128}
                hint="Maximum number of slots per tournament"
              />
            </div>
          </Card>
        )}

        {/* Teams */}
        {section === "teams" && (
          <Card>
            <h3 className="mb-1 text-sm font-semibold text-foreground">Teams</h3>
            <p className="mb-4 text-xs text-foreground/40">
              Control team creation and roster limits.
            </p>

            <div className="space-y-4">
              <Toggle
                checked={form.allowTeamCreation}
                onChange={(v) => update("allowTeamCreation", v)}
                label="Allow Team Creation"
                description="Let members create persistent teams"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <NumberField
                  label="Max Teams per User"
                  value={form.maxTeamsPerUser}
                  onChange={(v) => update("maxTeamsPerUser", v)}
                  min={1}
                  max={20}
                />
                <NumberField
                  label="Max Team Size"
                  value={form.maxTeamSize}
                  onChange={(v) => update("maxTeamSize", v)}
                  min={2}
                  max={50}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Feature Toggles */}
        {section === "toggles" && (
          <Card>
            <h3 className="mb-1 text-sm font-semibold text-foreground">Feature Toggles</h3>
            <p className="mb-4 text-xs text-foreground/40">
              Enable or disable entire features. Disabled features are hidden from navigation.
            </p>

            <div className="space-y-2">
              {FEATURE_TOGGLES.map((toggle) => (
                <Toggle
                  key={toggle.key}
                  checked={form[toggle.key as keyof SiteSettingsData] as boolean}
                  onChange={(v) => update(toggle.key as keyof SiteSettingsData, v as never)}
                  label={toggle.label}
                  description={toggle.description}
                />
              ))}
            </div>
          </Card>
        )}

        {/* Save */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-neon px-5 py-2 text-sm font-semibold text-background transition hover:bg-neon-dim disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {message && (
            <p
              className={`text-sm ${message.type === "error" ? "text-red-400" : "text-neon"}`}
            >
              {message.text}
            </p>
          )}
        </div>
      </div>
      </div>
    </motion.div>
  );
}
