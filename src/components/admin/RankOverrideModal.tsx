"use client";

import { useState, useMemo, useTransition } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import RankSelector from "@/components/signup/RankSelector";
import { GAME_RANK_TIERS } from "@/lib/constants";
import { setUserRanks } from "@/app/admin/actions";

interface PlayerData {
  id: string;
  name: string;
  gamertag: string | null;
  rawGames: string[];
  ranks: { gameName: string; rank: string }[];
}

interface Props {
  player: PlayerData | null;
  onClose: () => void;
}

export default function RankOverrideModal({ player, onClose }: Props) {
  const [isPending, startTransition] = useTransition();

  const rankedGames = useMemo(
    () => (player?.rawGames ?? []).filter((g) => g in GAME_RANK_TIERS),
    [player?.rawGames]
  );

  const [ranks, setRanks] = useState<Record<string, string>>({});

  // Reset ranks when player changes
  const [lastPlayerId, setLastPlayerId] = useState<string | null>(null);
  if (player && player.id !== lastPlayerId) {
    setLastPlayerId(player.id);
    const map: Record<string, string> = {};
    for (const g of rankedGames) {
      const existing = player.ranks.find((r) => r.gameName === g);
      map[g] = existing?.rank || "";
    }
    setRanks(map);
  }

  function handleSubmit() {
    if (!player) return;
    const rankData = Object.entries(ranks).map(([gameName, rank]) => ({ gameName, rank }));
    startTransition(async () => {
      const result = await setUserRanks(player.id, rankData);
      if (result.error) {
        alert(result.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <Modal open={!!player} onClose={onClose} title={`Set Ranks — ${player?.gamertag || player?.name}`} wide>
      {rankedGames.length === 0 ? (
        <p className="text-sm text-foreground/50">
          This player has no games with rank tiers.
        </p>
      ) : (
        <div className="space-y-4">
          {rankedGames.map((gameName) => (
            <div key={gameName}>
              <h4 className="mb-2 text-sm font-medium text-foreground">{gameName}</h4>
              <RankSelector
                gameName={gameName}
                value={ranks[gameName] || ""}
                onChange={(rank) =>
                  setRanks((prev) => ({ ...prev, [gameName]: rank }))
                }
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={isPending || rankedGames.length === 0}
          onClick={handleSubmit}
        >
          {isPending ? "Saving..." : "Save Ranks"}
        </Button>
      </div>
    </Modal>
  );
}
