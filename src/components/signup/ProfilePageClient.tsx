"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProfileForm, { ProfileFormHandle } from "./ProfileForm";
import ExtendedProfileForm, { ExtendedProfileFormHandle } from "./ExtendedProfileForm";
import { GameSelection } from "./GameSelector";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { updateProfile } from "@/app/profile/actions";
import { updateExtendedProfile } from "@/app/profile/actions";

interface RankData {
  gameName: string;
  rank: string;
}

interface ProfilePageClientProps {
  defaultName: string;
  initialGames: GameSelection[];
  initialSlots: string[];
  initialModerate: boolean;
  initialTimezone?: string;
  initialRanks: RankData[];
  initialBuyIn: boolean;
  initialLAN: boolean;
  initialFavoriteGames?: string[];
  initialTwitter?: string;
  initialTwitch?: string;
  initialYoutube?: string;
  initialCustomLink?: string;
}

export default function ProfilePageClient({
  defaultName,
  initialGames,
  initialSlots,
  initialModerate,
  initialTimezone,
  initialRanks,
  initialBuyIn,
  initialLAN,
  initialFavoriteGames,
  initialTwitter,
  initialTwitch,
  initialYoutube,
  initialCustomLink,
}: ProfilePageClientProps) {
  const profileRef = useRef<ProfileFormHandle>(null);
  const extendedRef = useRef<ExtendedProfileFormHandle>(null);
  const [currentGames, setCurrentGames] = useState<string[]>(
    initialGames.map((g) => g.name)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleGamesChange = useCallback((games: GameSelection[]) => {
    setCurrentGames(games.map((g) => g.name));
  }, []);

  const handleSave = async () => {
    setError("");
    setSuccess("");

    const profileData = profileRef.current?.getData();
    const extendedData = extendedRef.current?.getData();

    if (!profileData || !extendedData) return;

    // Validate profile form
    const validationError = profileRef.current?.validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const [profileResult, extendedResult] = await Promise.all([
        updateProfile(profileData),
        updateExtendedProfile(extendedData),
      ]);

      if (profileResult?.error) {
        setError(profileResult.error);
      } else if (extendedResult?.error) {
        setError(extendedResult.error);
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
    <>
      <div className="mx-auto max-w-2xl px-4 py-12 space-y-8 pb-28">
        <div>
          <h1 className="mb-2 text-center text-3xl font-bold text-foreground">
            Your Profile
          </h1>
          <p className="mb-8 text-center text-foreground/50">
            Update your preferences
          </p>

          <Card className="p-6 sm:p-8">
            <ProfileForm
              ref={profileRef}
              defaultName={defaultName}
              initialGames={initialGames}
              initialSlots={initialSlots}
              initialModerate={initialModerate}
              initialTimezone={initialTimezone}
              mode="edit"
              onGamesChange={handleGamesChange}
              hideSubmit
              hideModerate
            />
          </Card>
        </div>

        <div>
          <h2 className="mb-2 text-center text-2xl font-bold text-foreground">
            Extended Profile
          </h2>
          <p className="mb-4 text-center text-foreground/50">
            Ranks, tournaments, and events
          </p>

          <Card className="p-6 sm:p-8">
            <ExtendedProfileForm
              ref={extendedRef}
              userGames={currentGames}
              initialRanks={initialRanks}
              initialBuyIn={initialBuyIn}
              initialLAN={initialLAN}
              initialModerate={initialModerate}
              initialFavoriteGames={initialFavoriteGames}
              initialTwitter={initialTwitter}
              initialTwitch={initialTwitch}
              initialYoutube={initialYoutube}
              initialCustomLink={initialCustomLink}
              hideSubmit
            />
          </Card>
        </div>
      </div>

      {/* Sticky bottom save bar */}
      <div className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between gap-4">
          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                key="error"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-danger truncate"
              >
                {error}
              </motion.p>
            )}
            {success && (
              <motion.p
                key="success"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-neon"
              >
                {success}
              </motion.p>
            )}
            {!error && !success && <div />}
          </AnimatePresence>

          <Button
            size="lg"
            disabled={loading}
            onClick={handleSave}
            className="min-w-[140px]"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </>
  );
}
