"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import Card from "@/components/ui/Card";
import {
  createInviteCode,
  getInviteCodes,
  toggleInviteCode,
  deleteInviteCode,
} from "@/app/admin/access-actions";

interface InviteCodeData {
  id: string;
  code: string;
  label: string | null;
  maxUses: number;
  uses: number;
  expiresAt: string | null;
  isActive: boolean;
  createdBy: { name: string; gamertag: string | null };
  usedBy: { id: string; name: string; gamertag: string | null }[];
  createdAt: string;
}

export default function InviteCodesPanel() {
  const [codes, setCodes] = useState<InviteCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState(0);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadCodes = async () => {
    const result = await getInviteCodes();
    if ("codes" in result) {
      setCodes(result.codes as unknown as InviteCodeData[]);
    }
    setLoading(false);
  };

  useEffect(() => { loadCodes(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    const result = await createInviteCode({
      label: label || undefined,
      maxUses,
      expiresInDays: expiresInDays > 0 ? expiresInDays : undefined,
    });
    setCreating(false);
    if ("success" in result) {
      setShowCreate(false);
      setLabel("");
      setMaxUses(1);
      setExpiresInDays(0);
      loadCodes();
    }
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await toggleInviteCode(id, !isActive);
    loadCodes();
  };

  const handleDelete = async (id: string) => {
    await deleteInviteCode(id);
    loadCodes();
  };

  if (loading) {
    return <p className="text-sm text-foreground/40">Loading invite codes...</p>;
  }

  return (
    <motion.div {...fadeIn} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Invite Codes</h3>
          <p className="text-xs text-foreground/40">
            Generate codes for invite-only mode
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-neon px-3 py-1.5 text-xs font-semibold text-background transition hover:bg-neon-dim"
        >
          + New Code
        </button>
      </div>

      {showCreate && (
        <Card className="space-y-3 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-foreground/50">Label (optional)</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Discord drop"
                maxLength={50}
                className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground placeholder:text-foreground/20 focus:border-neon/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-foreground/50">Max Uses</label>
              <input
                type="number"
                min={1}
                max={1000}
                value={maxUses}
                onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:border-neon/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-foreground/50">Expires in (days, 0 = never)</label>
              <input
                type="number"
                min={0}
                max={365}
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:border-neon/50 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="rounded-lg bg-neon px-4 py-1.5 text-xs font-semibold text-background transition hover:bg-neon-dim disabled:opacity-50"
            >
              {creating ? "Creating..." : "Generate Code"}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-border px-4 py-1.5 text-xs text-foreground/50 transition hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </Card>
      )}

      {codes.length === 0 ? (
        <p className="text-sm text-foreground/30">No invite codes yet.</p>
      ) : (
        <div className="space-y-2">
          {codes.map((c) => {
            const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
            const isFull = c.uses >= c.maxUses;
            const isUsable = c.isActive && !isExpired && !isFull;

            return (
              <Card key={c.id} className={`flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between ${!isUsable ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleCopy(c.code, c.id)}
                    className="rounded bg-surface-lighter px-2 py-1 font-mono text-sm tracking-widest text-neon transition hover:bg-surface-light"
                    title="Copy code"
                  >
                    {copiedId === c.id ? "Copied!" : c.code}
                  </button>
                  <div>
                    {c.label && <span className="text-xs text-foreground/50">{c.label}</span>}
                    <p className="text-xs text-foreground/30">
                      {c.uses}/{c.maxUses} used
                      {isExpired && " · Expired"}
                      {isFull && " · Full"}
                      {!c.isActive && " · Disabled"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(c.id, c.isActive)}
                    className={`rounded px-2 py-1 text-xs transition ${
                      c.isActive
                        ? "text-warning hover:bg-warning/10"
                        : "text-neon hover:bg-neon/10"
                    }`}
                  >
                    {c.isActive ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="rounded px-2 py-1 text-xs text-danger transition hover:bg-danger/10"
                  >
                    Delete
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
