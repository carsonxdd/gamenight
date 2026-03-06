"use client";

import { signIn } from "next-auth/react";

export default function DiscordLoginButton() {
  return (
    <button
      onClick={() => signIn("discord", { callbackUrl: "/signup" })}
      className="inline-flex items-center gap-3 rounded-lg bg-discord px-6 py-3 font-semibold text-white transition hover:bg-discord-hover"
    >
      <svg width="24" height="24" viewBox="0 0 71 55" fill="currentColor">
        <path d="M60.1 4.9A58.5 58.5 0 0 0 45.4.2a.2.2 0 0 0-.2.1 40.5 40.5 0 0 0-1.8 3.7 54 54 0 0 0-16.2 0A37.2 37.2 0 0 0 25.4.3a.2.2 0 0 0-.2-.1A58.4 58.4 0 0 0 10.6 5a.2.2 0 0 0-.1 0C1.5 16.7-.9 28.1.3 39.4v.1a58.8 58.8 0 0 0 17.9 9.1.2.2 0 0 0 .2-.1 42 42 0 0 0 3.6-5.9.2.2 0 0 0-.1-.3 38.8 38.8 0 0 1-5.5-2.6.2.2 0 0 1 0-.4l1.1-.9a.2.2 0 0 1 .2 0 42 42 0 0 0 35.8 0 .2.2 0 0 1 .2 0l1.1.9a.2.2 0 0 1 0 .3 36.4 36.4 0 0 1-5.5 2.7.2.2 0 0 0-.1.3 47.2 47.2 0 0 0 3.6 5.9.2.2 0 0 0 .3.1A58.6 58.6 0 0 0 70.5 39.5v-.1C72 26.4 68 15.1 60.2 5a.2.2 0 0 0 0 0zM23.7 32.3c-3 0-5.4-2.7-5.4-6.1s2.4-6 5.4-6 5.5 2.7 5.4 6-2.4 6.1-5.4 6.1zm20 0c-3 0-5.4-2.7-5.4-6.1s2.4-6 5.4-6 5.5 2.7 5.4 6-2.3 6.1-5.4 6.1z" />
      </svg>
      Sign in with Discord
    </button>
  );
}
