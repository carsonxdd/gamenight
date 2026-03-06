"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { GAMES, POLL_LIMITS } from "@/lib/constants";
import { createPoll } from "@/app/polls/actions";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreatePollModal({ open, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [game, setGame] = useState("");
  const [multiSelect, setMultiSelect] = useState(false);
  const [options, setOptions] = useState(["", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const addOption = () => {
    if (options.length < POLL_LIMITS.MAX_OPTIONS) {
      setOptions((prev) => [...prev, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > POLL_LIMITS.MIN_OPTIONS) {
      setOptions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedOptions = options.map((o) => o.trim()).filter(Boolean);
    if (trimmedOptions.length < POLL_LIMITS.MIN_OPTIONS) {
      setError(`At least ${POLL_LIMITS.MIN_OPTIONS} options required`);
      return;
    }

    setLoading(true);
    setError("");
    const result = await createPoll({
      title,
      description: description || undefined,
      game: game || undefined,
      multiSelect,
      options: trimmedOptions,
    });
    setLoading(false);

    if (result?.error) {
      setError(result.error);
    } else {
      onClose();
      setTitle("");
      setDescription("");
      setGame("");
      setMultiSelect(false);
      setOptions(["", ""]);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Poll">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-foreground/70">Question</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Should we try to kill the Ender Dragon this weekend?"
            maxLength={POLL_LIMITS.TITLE_MAX}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground placeholder:text-foreground/30 focus:border-neon focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-foreground/70">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add context or details..."
            rows={2}
            maxLength={POLL_LIMITS.DESCRIPTION_MAX}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground placeholder:text-foreground/30 focus:border-neon focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-foreground/70">Game (optional)</label>
          <select
            value={game}
            onChange={(e) => setGame(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-neon focus:outline-none"
          >
            <option value="">No specific game</option>
            {GAMES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm text-foreground/70">Options</label>
            {options.length < POLL_LIMITS.MAX_OPTIONS && (
              <button
                type="button"
                onClick={addOption}
                className="text-xs text-neon hover:text-neon-dim"
              >
                + Add option
              </button>
            )}
          </div>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  maxLength={POLL_LIMITS.OPTION_MAX}
                  className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-foreground placeholder:text-foreground/30 focus:border-neon focus:outline-none"
                />
                {options.length > POLL_LIMITS.MIN_OPTIONS && (
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="shrink-0 rounded-lg px-2 text-foreground/30 transition hover:text-danger"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground/70">
          <input
            type="checkbox"
            checked={multiSelect}
            onChange={(e) => setMultiSelect(e.target.checked)}
            className="rounded accent-neon"
          />
          Allow multiple selections
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating..." : "Create Poll"}
        </Button>
      </form>
    </Modal>
  );
}
