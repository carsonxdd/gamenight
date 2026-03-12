"use client";

import { useState } from "react";
import { validateInviteCode } from "@/app/admin/access-actions";
import DiscordLoginButton from "./DiscordLoginButton";

export default function InviteCodeGate() {
  const [code, setCode] = useState("");
  const [validated, setValidated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const handleValidate = async () => {
    if (!code.trim()) return;
    setChecking(true);
    setError(null);
    const result = await validateInviteCode(code);
    setChecking(false);
    if (result.valid) {
      setValidated(true);
      // Store code in sessionStorage so we can redeem it after Discord login
      sessionStorage.setItem("inviteCode", code.toUpperCase().trim());
    } else {
      setError(result.error || "Invalid code");
    }
  };

  if (validated) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-neon">Invite code accepted!</p>
        <DiscordLoginButton />
        <div className="mt-2 flex items-start gap-2.5 rounded-lg border border-border bg-surface-lighter p-4 text-left">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-neon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-foreground/50 leading-relaxed">
            We only request Discord&apos;s &quot;identify&quot; scope — the only info we receive is your <span className="text-foreground/70">username</span> and <span className="text-foreground/70">profile picture</span>. We don&apos;t ask for your email, and we cannot see your password, DMs, friends list, or servers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <p className="text-foreground/60">This community requires an invite code to join.</p>
      <div className="flex w-full max-w-xs gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null); }}
          placeholder="Enter invite code"
          maxLength={20}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-center text-sm font-mono tracking-widest text-foreground placeholder:text-foreground/20 focus:border-neon/50 focus:outline-none focus:ring-1 focus:ring-neon/50"
          onKeyDown={(e) => e.key === "Enter" && handleValidate()}
        />
        <button
          onClick={handleValidate}
          disabled={checking || !code.trim()}
          className="rounded-lg bg-neon px-4 py-2 text-sm font-semibold text-background transition hover:bg-neon-dim disabled:opacity-50"
        >
          {checking ? "..." : "Go"}
        </button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
