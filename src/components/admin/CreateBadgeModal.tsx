"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { BADGE_CATEGORIES, BADGE_TIERS, METRIC_KEYS } from "@/lib/badges/constants";
import { createCustomBadge } from "@/app/badges/actions";
import type { BadgeData } from "./BadgeManager";

interface Props {
  onClose: () => void;
  onCreated: (badge: BadgeData) => void;
}

export default function CreateBadgeModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Star");
  const [category, setCategory] = useState("custom");
  const [tier, setTier] = useState("binary");
  const [triggerType, setTriggerType] = useState<"manual" | "threshold">("manual");
  const [metric, setMetric] = useState<string>(METRIC_KEYS[0]);
  const [value, setValue] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Name is required");
    if (!description.trim()) return setError("Description is required");

    setSaving(true);
    setError("");

    const result = await createCustomBadge({
      name: name.trim(),
      description: description.trim(),
      icon,
      category,
      tier,
      triggerType,
      metric: triggerType === "threshold" ? metric : undefined,
      value: triggerType === "threshold" ? value : undefined,
    });

    setSaving(false);

    if (result.error) {
      setError(result.error);
    } else if (result.id) {
      onCreated({
        id: result.id,
        key: `custom_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
        name: name.trim(),
        description: description.trim(),
        icon,
        category,
        tier,
        source: "custom",
        isEnabled: true,
        triggerConfig: triggerType === "threshold"
          ? JSON.stringify({ type: "threshold", metric, value })
          : JSON.stringify({ type: "manual" }),
        earnedCount: 0,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return (
    <Modal open onClose={onClose} title="Create Custom Badge">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-foreground/50">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            placeholder="Badge name"
            maxLength={50}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-foreground/50">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            placeholder="How to earn this badge"
            maxLength={150}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-foreground/50">Icon (Lucide name)</label>
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            placeholder="e.g. Star, Trophy, Flame"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-foreground/50">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {BADGE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-foreground/50">Tier</label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {Object.entries(BADGE_TIERS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-foreground/50">Trigger Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                checked={triggerType === "manual"}
                onChange={() => setTriggerType("manual")}
                className="accent-neon"
              />
              Manual
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                checked={triggerType === "threshold"}
                onChange={() => setTriggerType("threshold")}
                className="accent-neon"
              />
              Threshold
            </label>
          </div>
        </div>

        {triggerType === "threshold" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs text-foreground/50">Metric</label>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                {METRIC_KEYS.map((m) => (
                  <option key={m} value={m}>
                    {m.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-foreground/50">Value</label>
              <input
                type="number"
                min={1}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground/60 hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-neon px-4 py-2 text-sm font-medium text-background transition hover:bg-neon/90 disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Badge"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
