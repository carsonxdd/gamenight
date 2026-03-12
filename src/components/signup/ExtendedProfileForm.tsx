"use client";

import { useState, useMemo, useEffect, useImperativeHandle, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/ui/Button";
import RankSelector from "./RankSelector";
import { GAME_RANK_TIERS } from "@/lib/constants";
import { updateExtendedProfile } from "@/app/profile/actions";

interface RankData {
  gameName: string;
  rank: string;
}

export interface ExtendedProfileFormData {
  ranks: RankData[];
  interestedInBuyIn: boolean;
  interestedInLAN: boolean;
  willingToModerate: boolean;
  favoriteGames: string[];
  twitter: string;
  twitch: string;
  youtube: string;
  customLink: string;
}

export interface ExtendedProfileFormHandle {
  getData: () => ExtendedProfileFormData;
  markSaved: () => void;
}

interface ExtendedProfileFormProps {
  userGames: string[];
  initialRanks?: RankData[];
  initialBuyIn?: boolean;
  initialLAN?: boolean;
  initialModerate?: boolean;
  initialFavoriteGames?: string[];
  initialTwitter?: string;
  initialTwitch?: string;
  initialYoutube?: string;
  initialCustomLink?: string;
  hideSubmit?: boolean;
  onDirty?: (dirty: boolean) => void;
}

const ExtendedProfileForm = forwardRef<ExtendedProfileFormHandle, ExtendedProfileFormProps>(function ExtendedProfileForm({
  userGames,
  initialRanks,
  initialBuyIn,
  initialLAN,
  initialModerate,
  initialFavoriteGames,
  initialTwitter,
  initialTwitch,
  initialYoutube,
  initialCustomLink,
  hideSubmit,
  onDirty,
}, ref) {
  const rankedUserGames = useMemo(
    () => userGames.filter((g) => g in GAME_RANK_TIERS),
    [userGames]
  );

  const [ranks, setRanks] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const g of rankedUserGames) {
      const existing = initialRanks?.find((r) => r.gameName === g);
      map[g] = existing?.rank || "";
    }
    return map;
  });

  // Sync ranks state when game selection changes
  useEffect(() => {
    setRanks((prev) => {
      const next: Record<string, string> = {};
      for (const g of rankedUserGames) {
        next[g] = prev[g] ?? (initialRanks?.find((r) => r.gameName === g)?.rank || "");
      }
      return next;
    });
  }, [rankedUserGames, initialRanks]);

  const [favoriteGames, setFavoriteGames] = useState<string[]>(
    () => (initialFavoriteGames || []).filter((g) => userGames.includes(g))
  );

  // Remove favorites that are no longer in the user's game list
  useEffect(() => {
    setFavoriteGames((prev) => prev.filter((g) => userGames.includes(g)));
  }, [userGames]);

  const toggleFavorite = (gameName: string) => {
    setFavoriteGames((prev) => {
      if (prev.includes(gameName)) {
        return prev.filter((g) => g !== gameName);
      }
      if (prev.length >= 3) return prev;
      return [...prev, gameName];
    });
  };

  const [twitter, setTwitter] = useState(initialTwitter || "");
  const [twitch, setTwitch] = useState(initialTwitch || "");
  const [youtube, setYoutube] = useState(initialYoutube || "");
  const [customLink, setCustomLink] = useState(initialCustomLink || "");

  const [expandedGame, setExpandedGame] = useState<string | null>(null);
  const [interestedInBuyIn, setInterestedInBuyIn] = useState(initialBuyIn || false);
  const [interestedInLAN, setInterestedInLAN] = useState(initialLAN || false);
  const [willingToModerate, setWillingToModerate] = useState(initialModerate || false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Dirty tracking
  const [baseline, setBaseline] = useState(() => ({
    ranks: JSON.stringify(Object.entries(
      (() => { const map: Record<string, string> = {}; for (const g of rankedUserGames) { const existing = initialRanks?.find((r) => r.gameName === g); map[g] = existing?.rank || ""; } return map; })()
    ).map(([gameName, rank]) => ({ gameName, rank }))),
    interestedInBuyIn: initialBuyIn || false,
    interestedInLAN: initialLAN || false,
    willingToModerate: initialModerate || false,
    favoriteGames: JSON.stringify((initialFavoriteGames || []).filter((g) => userGames.includes(g)).sort()),
    twitter: (initialTwitter || "").trim(),
    twitch: (initialTwitch || "").trim(),
    youtube: (initialYoutube || "").trim(),
    customLink: (initialCustomLink || "").trim(),
  }));

  const isDirtyExtended = useMemo(() => {
    return (
      JSON.stringify(Object.entries(ranks).map(([gameName, rank]) => ({ gameName, rank }))) !== baseline.ranks ||
      interestedInBuyIn !== baseline.interestedInBuyIn ||
      interestedInLAN !== baseline.interestedInLAN ||
      willingToModerate !== baseline.willingToModerate ||
      JSON.stringify([...favoriteGames].sort()) !== baseline.favoriteGames ||
      twitter.trim() !== baseline.twitter ||
      twitch.trim() !== baseline.twitch ||
      youtube.trim() !== baseline.youtube ||
      customLink.trim() !== baseline.customLink
    );
  }, [ranks, interestedInBuyIn, interestedInLAN, willingToModerate, favoriteGames, twitter, twitch, youtube, customLink, baseline]);

  useEffect(() => {
    onDirty?.(isDirtyExtended);
  }, [isDirtyExtended, onDirty]);

  useImperativeHandle(ref, () => ({
    getData: () => ({
      ranks: Object.entries(ranks).map(([gameName, rank]) => ({
        gameName,
        rank,
      })),
      interestedInBuyIn,
      interestedInLAN,
      willingToModerate,
      favoriteGames,
      twitter: twitter.trim(),
      twitch: twitch.trim(),
      youtube: youtube.trim(),
      customLink: customLink.trim(),
    }),
    markSaved: () => {
      setBaseline({
        ranks: JSON.stringify(Object.entries(ranks).map(([gameName, rank]) => ({ gameName, rank }))),
        interestedInBuyIn,
        interestedInLAN,
        willingToModerate,
        favoriteGames: JSON.stringify([...favoriteGames].sort()),
        twitter: twitter.trim(),
        twitch: twitch.trim(),
        youtube: youtube.trim(),
        customLink: customLink.trim(),
      });
    },
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await updateExtendedProfile({
        ranks: Object.entries(ranks).map(([gameName, rank]) => ({
          gameName,
          rank,
        })),
        interestedInBuyIn,
        interestedInLAN,
        willingToModerate,
        favoriteGames,
        twitter: twitter.trim(),
        twitch: twitch.trim(),
        youtube: youtube.trim(),
        customLink: customLink.trim(),
      });

      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess("Saved!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {userGames.length > 0 && (
        <div>
          <h3 className="mb-1 text-sm font-medium text-foreground">
            Favorite Games
          </h3>
          <p className="mb-3 text-xs text-foreground/40">
            Pick up to 3 games to show on your card. {favoriteGames.length}/3 selected.
          </p>
          <div className="flex flex-wrap gap-2">
            {userGames.map((game) => {
              const isFav = favoriteGames.includes(game);
              const disabled = !isFav && favoriteGames.length >= 3;
              return (
                <button
                  key={game}
                  type="button"
                  onClick={() => toggleFavorite(game)}
                  disabled={disabled}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    isFav
                      ? "border border-neon bg-neon/10 text-neon"
                      : disabled
                        ? "border border-border/50 bg-surface text-foreground/20 cursor-not-allowed"
                        : "border border-border bg-surface text-foreground/60 hover:border-border-light"
                  }`}
                >
                  {game}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {rankedUserGames.length > 0 && (
        <div>
          <h3 className="mb-1 text-sm font-medium text-foreground">
            Your Ranks
          </h3>
          <p className="mb-4 text-xs text-foreground/40">
            Optional — helps us balance teams and set up fair matches. Click a
            game to pick your rank.
          </p>
          <div className="space-y-2">
            {rankedUserGames.map((gameName) => {
              const isExpanded = expandedGame === gameName;
              const currentRank = ranks[gameName];
              const tierColor = currentRank
                ? GAME_RANK_TIERS[gameName]?.find((t) =>
                    t.ranks.includes(currentRank)
                  )?.color
                : undefined;

              return (
                <div
                  key={gameName}
                  className="rounded-lg border border-border bg-surface overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedGame(isExpanded ? null : gameName)
                    }
                    className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-surface-light"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground">
                        {gameName}
                      </span>
                      {currentRank && (
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            color: tierColor,
                            backgroundColor: `${tierColor}15`,
                          }}
                        >
                          {currentRank}
                        </span>
                      )}
                    </div>
                    <motion.span
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-foreground/40"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        className="stroke-current"
                      >
                        <path
                          d="M2.5 4.5L6 8L9.5 4.5"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          duration: 0.2,
                          ease: [0.25, 0.1, 0.25, 1],
                        }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border/50 px-4 py-3">
                          <RankSelector
                            gameName={gameName}
                            value={currentRank || ""}
                            onChange={(rank) =>
                              setRanks((prev) => ({
                                ...prev,
                                [gameName]: rank,
                              }))
                            }
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-1 text-sm font-medium text-foreground">
          Social Links
        </h3>
        <p className="mb-3 text-xs text-foreground/40">
          Optional — shown on your member card.
        </p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-foreground/50">Twitter / X</label>
            <input
              type="text"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="@username"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-neon/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-foreground/50">Twitch</label>
            <input
              type="text"
              value={twitch}
              onChange={(e) => setTwitch(e.target.value)}
              placeholder="username"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-neon/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-foreground/50">YouTube</label>
            <input
              type="text"
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
              placeholder="channel name or URL"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-neon/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-foreground/50">Custom Link</label>
            <input
              type="text"
              value={customLink}
              onChange={(e) => setCustomLink(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-neon/50 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">
          Tournaments & Events
        </h3>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={interestedInBuyIn}
            onChange={(e) => setInterestedInBuyIn(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border bg-surface accent-neon"
          />
          <div>
            <span className="text-sm font-medium text-foreground group-hover:text-neon transition">
              Interested in pot / buy-in tournaments
            </span>
            <p className="text-xs text-foreground/40 mt-0.5">
              Small buy-in tournaments with prize pools. Just gauging interest
              for now.
            </p>
          </div>
        </label>

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

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={interestedInLAN}
            onChange={(e) => setInterestedInLAN(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border bg-surface accent-neon"
          />
          <div>
            <span className="text-sm font-medium text-foreground group-hover:text-neon transition">
              Interested in LAN events (Arizona)
            </span>
            <p className="text-xs text-foreground/40 mt-0.5">
              In-person gaming events in the Arizona area. Just gathering
              interest.
            </p>
          </div>
        </label>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {success && <p className="text-sm text-neon">{success}</p>}

      {!hideSubmit && (
        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? "Saving..." : "Save Extended Profile"}
        </Button>
      )}
    </form>
  );
});

export default ExtendedProfileForm;
