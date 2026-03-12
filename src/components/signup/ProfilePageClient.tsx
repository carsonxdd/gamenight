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
import InviteGroupManager from "@/components/profile/InviteGroupManager";
import { InvitableMember } from "@/components/schedule/ScheduleView";
import Link from "next/link";

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
  groups?: { id: string; name: string; memberIds: string[] }[];
  members?: InvitableMember[];
  primeStartHour?: number;
  primeEndHour?: number;
  extendedStartHour?: number;
  extendedEndHour?: number;
  anchorTimezone?: string;
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
  groups = [],
  members = [],
  primeStartHour,
  primeEndHour,
  extendedStartHour,
  extendedEndHour,
  anchorTimezone,
}: ProfilePageClientProps) {
  const profileRef = useRef<ProfileFormHandle>(null);
  const extendedRef = useRef<ExtendedProfileFormHandle>(null);
  const [currentGames, setCurrentGames] = useState<string[]>(
    initialGames.map((g) => g.name)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profileDirty, setProfileDirty] = useState(false);
  const [extendedDirty, setExtendedDirty] = useState(false);
  const isDirty = profileDirty || extendedDirty;

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
        profileRef.current?.markSaved();
        extendedRef.current?.markSaved();
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
              onDirty={setProfileDirty}
              hideSubmit
              hideModerate
              primeStartHour={primeStartHour}
              primeEndHour={primeEndHour}
              extendedStartHour={extendedStartHour}
              extendedEndHour={extendedEndHour}
              anchorTimezone={anchorTimezone}
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
              onDirty={setExtendedDirty}
              hideSubmit
            />
          </Card>
        </div>

        <div>
          <h2 className="mb-2 text-center text-2xl font-bold text-foreground">
            Quick-Select Groups
          </h2>
          <p className="mb-4 text-center text-foreground/50">
            Save groups of friends for quick event invites
          </p>

          <Card className="p-6 sm:p-8">
            <InviteGroupManager groups={groups} members={members} />
          </Card>
        </div>

        <div>
          <Link
            href="/about?tab=Feedback"
            className="group block rounded-xl border border-border bg-surface p-5 text-center transition hover:border-neon/40"
          >
            <p className="text-sm font-semibold text-foreground group-hover:text-neon transition">
              Have a suggestion or found a bug?
            </p>
            <p className="mt-1 text-xs text-foreground/40">
              Submit feedback on the About page &rarr;
            </p>
          </Link>
        </div>
      </div>

      {/* Sticky bottom save bar — slides in when dirty */}
      <AnimatePresence>
        {(isDirty || error || success) && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm"
          >
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

              {isDirty && (
                <Button
                  size="lg"
                  disabled={loading}
                  onClick={handleSave}
                  className="min-w-[140px]"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
