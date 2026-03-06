"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import Card from "@/components/ui/Card";

interface GameStat {
  gameName: string;
  count: number;
  players: string[];
}

interface Props {
  gameStats: GameStat[];
}

export default function GamePopularity({ gameStats }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const max = gameStats.length > 0 ? gameStats[0].count : 1;

  if (gameStats.length === 0) {
    return (
      <Card>
        <p className="text-center text-foreground/50">No game data yet.</p>
      </Card>
    );
  }

  return (
    <motion.div
      {...staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-3"
    >
      {gameStats.map((game) => (
        <motion.div key={game.gameName} {...staggerItem}>
          <Card>
            <button
              onClick={() =>
                setExpanded(
                  expanded === game.gameName ? null : game.gameName
                )
              }
              className="w-full text-left"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  {game.gameName}
                </span>
                <span className="text-xs text-foreground/50">
                  {game.count} {game.count === 1 ? "player" : "players"}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-surface-light">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(game.count / max) * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full bg-neon/70"
                />
              </div>
            </button>
            {expanded === game.gameName && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="mt-3 flex flex-wrap gap-2"
              >
                {game.players.map((player) => (
                  <span
                    key={player}
                    className="rounded-full border border-neon/30 bg-neon/10 px-2.5 py-0.5 text-xs text-neon"
                  >
                    {player}
                  </span>
                ))}
              </motion.div>
            )}
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
