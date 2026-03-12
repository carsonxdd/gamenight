"use client";

import { useState, useCallback, useImperativeHandle, forwardRef, useMemo, useEffect } from "react";
import GameSelector, { GameSelection } from "./GameSelector";
import AvailabilityGrid from "./AvailabilityGrid";
import Button from "@/components/ui/Button";
import TimezoneSelect from "@/components/ui/TimezoneSelect";
import { US_TIMEZONES, DEFAULT_PRIME_START, DEFAULT_PRIME_END, DEFAULT_EXTENDED_START, DEFAULT_EXTENDED_END, DEFAULT_ANCHOR_TIMEZONE } from "@/lib/constants";
import { computeTimeSlotsForViewer } from "@/lib/timezone-utils";
import { completeProfile } from "@/app/signup/actions";
import { updateProfile } from "@/app/profile/actions";

export interface ProfileFormData {
  gamertag: string;
  timezone: string;
  games: { name: string; modes?: string[] }[];
  slots: string[];
  willingToModerate: boolean;
}

export interface ProfileFormHandle {
  getData: () => ProfileFormData;
  validate: () => string | null;
  markSaved: () => void;
}

interface ProfileFormProps {
  defaultName?: string;
  initialGames?: GameSelection[];
  initialSlots?: string[];
  initialModerate?: boolean;
  initialTimezone?: string;
  mode?: "setup" | "edit";
  onGamesChange?: (games: GameSelection[]) => void;
  onDirty?: (dirty: boolean) => void;
  hideSubmit?: boolean;
  hideModerate?: boolean;
  /** Time window config from site settings — slots are recomputed when timezone changes */
  primeStartHour?: number;
  primeEndHour?: number;
  extendedStartHour?: number;
  extendedEndHour?: number;
  anchorTimezone?: string;
}

const ProfileFormInner = forwardRef<ProfileFormHandle, ProfileFormProps>(function ProfileFormInner({
  defaultName,
  initialGames,
  initialSlots,
  initialModerate,
  initialTimezone,
  mode = "setup",
  onGamesChange,
  onDirty,
  hideSubmit,
  hideModerate,
  primeStartHour = DEFAULT_PRIME_START,
  primeEndHour = DEFAULT_PRIME_END,
  extendedStartHour = DEFAULT_EXTENDED_START,
  extendedEndHour = DEFAULT_EXTENDED_END,
  anchorTimezone = DEFAULT_ANCHOR_TIMEZONE,
}, ref) {
  const [gamertag, setGamertag] = useState(defaultName || "");
  const [timezone, setTimezone] = useState(initialTimezone || "");

  // Recompute prime/extended slots whenever the user changes their timezone
  const { primeSlots, extendedSlots } = useMemo(() => {
    const viewerTz = timezone || anchorTimezone;
    return computeTimeSlotsForViewer(
      viewerTz,
      anchorTimezone,
      primeStartHour,
      primeEndHour,
      extendedStartHour,
      extendedEndHour
    );
  }, [timezone, anchorTimezone, primeStartHour, primeEndHour, extendedStartHour, extendedEndHour]);
  const [games, setGames] = useState<GameSelection[]>(initialGames || []);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(
    () => new Set(initialSlots || [])
  );
  const [willingToModerate, setWillingToModerate] = useState(initialModerate || false);

  // Dirty tracking
  const [baseline, setBaseline] = useState(() => ({
    gamertag: defaultName || "",
    timezone: initialTimezone || "",
    games: JSON.stringify((initialGames || []).map((g) => ({ name: g.name, modes: g.modes }))),
    slots: JSON.stringify([...(initialSlots || [])].sort()),
    willingToModerate: initialModerate || false,
  }));

  const isDirty = useMemo(() => {
    return (
      gamertag !== baseline.gamertag ||
      timezone !== baseline.timezone ||
      JSON.stringify(games.map((g) => ({ name: g.name, modes: g.modes }))) !== baseline.games ||
      JSON.stringify([...selectedSlots].sort()) !== baseline.slots ||
      willingToModerate !== baseline.willingToModerate
    );
  }, [gamertag, timezone, games, selectedSlots, willingToModerate, baseline]);

  useEffect(() => {
    onDirty?.(isDirty);
  }, [isDirty, onDirty]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSlotsChange = useCallback((next: Set<string>) => {
    setSelectedSlots(next);
  }, []);

  const handleGamesChange = useCallback((newGames: GameSelection[]) => {
    setGames(newGames);
    onGamesChange?.(newGames);
  }, [onGamesChange]);

  useImperativeHandle(ref, () => ({
    getData: () => ({
      gamertag: gamertag.trim(),
      timezone,
      games: games.map((g) => ({ name: g.name, modes: g.modes })),
      slots: Array.from(selectedSlots),
      willingToModerate,
    }),
    validate: () => {
      if (!gamertag.trim()) return "Gamertag is required";
      if (!timezone) return "Please select your timezone";
      if (games.length === 0) return "Select at least one game";
      if (selectedSlots.size === 0) return "Select at least one available time slot";
      return null;
    },
    markSaved: () => {
      setBaseline({
        gamertag,
        timezone,
        games: JSON.stringify(games.map((g) => ({ name: g.name, modes: g.modes }))),
        slots: JSON.stringify([...selectedSlots].sort()),
        willingToModerate,
      });
    },
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!gamertag.trim()) {
      setError("Gamertag is required");
      return;
    }
    if (!timezone) {
      setError("Please select your timezone");
      return;
    }
    if (games.length === 0) {
      setError("Select at least one game");
      return;
    }
    if (selectedSlots.size === 0) {
      setError("Select at least one available time slot");
      return;
    }

    setLoading(true);
    try {
      const action = mode === "edit" ? updateProfile : completeProfile;
      const result = await action({
        gamertag: gamertag.trim(),
        timezone,
        games: games.map((g) => ({
          name: g.name,
          modes: g.modes,
        })),
        slots: Array.from(selectedSlots),
        willingToModerate,
      });
      if (result?.error) {
        setError(result.error);
      } else if (mode === "edit") {
        setSuccess("Saved!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        window.location.href = "/schedule";
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <label
          htmlFor="gamertag"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Gamertag
        </label>
        <input
          id="gamertag"
          type="text"
          value={gamertag}
          onChange={(e) => setGamertag(e.target.value)}
          placeholder="Your gamertag..."
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-foreground placeholder:text-foreground/30 focus:border-neon focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Timezone
        </label>
        <TimezoneSelect value={timezone} onChange={setTimezone} mode={mode} />
      </div>

      <GameSelector selected={games} onChange={handleGamesChange} mode={mode} />
      <AvailabilityGrid
        selected={selectedSlots}
        onChange={handleSlotsChange}
        timezoneLabel={timezone ? US_TIMEZONES.find((tz) => tz.value === timezone)?.label || timezone : undefined}
        primeSlots={primeSlots}
        extendedSlots={extendedSlots}
        anchorTimezone={anchorTimezone}
        viewerTimezone={timezone || anchorTimezone}
        anchorPrimeStartHour={primeStartHour}
        anchorPrimeEndHour={primeEndHour}
      />

      {!hideModerate && (
        <div>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={willingToModerate}
              onChange={(e) => setWillingToModerate(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border bg-surface accent-neon"
            />
            <div>
              <span className="text-sm font-medium text-foreground group-hover:text-neon transition">
                Interested in moderating
              </span>
              <p className="text-xs text-foreground/40 mt-0.5">
                Help get everyone online, host lobbies, and keep things running
                smoothly. You&apos;ll still play — just help coordinate too.
              </p>
            </div>
          </label>
        </div>
      )}

      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}
      {success && (
        <p className="text-sm text-neon">{success}</p>
      )}

      {!hideSubmit && (
        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? "Saving..." : mode === "edit" ? "Save Changes" : "Complete Profile"}
        </Button>
      )}
    </form>
  );
});

export default ProfileFormInner;
