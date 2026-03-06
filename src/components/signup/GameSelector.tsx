"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GAME_CATEGORIES, ALL_GAME_DEFS, GAMES } from "@/lib/constants";

export interface GameSelection {
  name: string;
  modes?: string[];
}

interface GameSelectorProps {
  selected: GameSelection[];
  onChange: (games: GameSelection[]) => void;
  mode?: "setup" | "edit";
}

export default function GameSelector({
  selected,
  onChange,
  mode = "setup",
}: GameSelectorProps) {
  const [customGame, setCustomGame] = useState("");
  const [expandedGames, setExpandedGames] = useState<Set<string>>(() => new Set());

  const getSelection = (name: string) =>
    selected.find((g) => g.name === name);

  const isSelected = (name: string) => !!getSelection(name);

  const toggleGame = (name: string) => {
    if (isSelected(name)) {
      onChange(selected.filter((g) => g.name !== name));
      setExpandedGames((prev) => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
    } else {
      onChange([...selected, { name }]);
      // Auto-expand options on first click during setup
      const def = gameDef(name);
      if (mode === "setup" && def?.modes) {
        setExpandedGames((prev) => new Set(prev).add(name));
      }
    }
  };

  const toggleExpand = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const toggleMode = (gameName: string, modeName: string) => {
    const existing = getSelection(gameName);
    if (!existing) return;

    const currentModes = existing.modes || [];
    const newModes = currentModes.includes(modeName)
      ? currentModes.filter((m) => m !== modeName)
      : [...currentModes, modeName];

    onChange(
      selected.map((g) =>
        g.name === gameName
          ? { ...g, modes: newModes.length > 0 ? newModes : undefined }
          : g
      )
    );
  };

  const addCustom = () => {
    const trimmed = customGame.trim();
    if (trimmed && !isSelected(trimmed)) {
      onChange([...selected, { name: trimmed }]);
      setCustomGame("");
    }
  };

  const gameDef = (name: string) =>
    ALL_GAME_DEFS.find((g) => g.name === name);

  return (
    <div>
      <label className="mb-3 block text-sm font-medium text-foreground">
        Games You Play
      </label>

      <div className="space-y-6">
        {GAME_CATEGORIES.map((category) => (
          <div key={category.name}>
            <div className="mb-2">
              <p className="text-xs font-medium uppercase tracking-wider text-foreground/40">
                {category.name}
              </p>
              <p className="text-xs text-foreground/25">{category.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {category.games.map((game) => {
                const on = isSelected(game.name);
                const sel = getSelection(game.name);
                const isExpanded = expandedGames.has(game.name);
                return (
                  <div key={game.name} className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => toggleGame(game.name)}
                      className={`rounded-lg border p-2.5 text-left text-sm transition flex items-center justify-between ${
                        on
                          ? "border-neon bg-neon/10 text-neon"
                          : "border-border bg-surface text-foreground/70 hover:border-border-light"
                      }`}
                    >
                      <span>{game.name}</span>
                      {on && game.modes && (
                        <span
                          onClick={(e) => toggleExpand(game.name, e)}
                          className={`ml-1 flex h-5 w-5 items-center justify-center rounded text-xs transition-transform hover:bg-neon/20 ${
                            isExpanded ? "rotate-45" : ""
                          }`}
                        >
                          +
                        </span>
                      )}
                      {!on && game.modes && (
                        <span className="ml-1 text-[10px] text-foreground/30">
                          +options
                        </span>
                      )}
                    </button>
                    <AnimatePresence initial={false}>
                      {on && game.modes && isExpanded && (
                        <motion.div
                          key={`${game.name}-modes`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="mt-1 rounded-lg border border-border/50 bg-surface-light p-2 space-y-1">
                            <p className="text-[10px] uppercase tracking-wider text-foreground/30 mb-1">
                              Interested in (optional)
                            </p>
                            {game.modes.map((m) => (
                              <label
                                key={m}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={sel?.modes?.includes(m) || false}
                                  onChange={() => toggleMode(game.name, m)}
                                  className="h-3.5 w-3.5 rounded border-border bg-surface accent-neon"
                                />
                                <span className="text-xs text-foreground/60">
                                  {m}
                                </span>
                              </label>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Custom game input */}
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={customGame}
          onChange={(e) => setCustomGame(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && (e.preventDefault(), addCustom())
          }
          placeholder="Other game..."
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-neon focus:outline-none"
        />
        <button
          type="button"
          onClick={addCustom}
          className="rounded-lg border border-border px-4 py-2 text-sm text-foreground/70 transition hover:border-neon hover:text-neon"
        >
          Add
        </button>
      </div>

      {/* Custom games display */}
      {selected.filter((g) => !GAMES.includes(g.name)).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selected
            .filter((g) => !GAMES.includes(g.name))
            .map((g) => (
              <span
                key={g.name}
                className="inline-flex items-center gap-1 rounded-full border border-neon/30 bg-neon/10 px-2.5 py-1 text-xs text-neon"
              >
                {g.name}
                <button
                  type="button"
                  onClick={() => toggleGame(g.name)}
                  className="hover:text-danger"
                >
                  ×
                </button>
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
