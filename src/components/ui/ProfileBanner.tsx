"use client";

import { useState } from "react";
import Link from "next/link";
import { dismissProfileBanner } from "@/app/profile/actions";

export default function ProfileBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = async () => {
    setDismissed(true);
    await dismissProfileBanner();
  };

  return (
    <div className="mb-6 flex items-center justify-between rounded-lg border border-neon/30 bg-neon/5 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-neon text-lg">!</span>
        <p className="text-sm text-foreground/80">
          <span className="font-medium text-foreground">Finish setting up your profile</span>
          {" — "}add your ranks, tournament interest, and more.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/profile#extended"
          className="text-sm font-medium text-neon hover:underline"
        >
          Go to Profile
        </Link>
        <button
          onClick={handleDismiss}
          className="text-foreground/40 hover:text-foreground transition text-lg leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
