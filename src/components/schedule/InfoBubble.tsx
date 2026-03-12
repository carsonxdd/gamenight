"use client";

import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "schedule-info-dismissed";

export default function InfoBubble() {
  const [expanded, setExpanded] = useState(false);
  const [ready, setReady] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const wasDismissed = localStorage.getItem(STORAGE_KEY) === "true";
    requestAnimationFrame(() => {
      setExpanded(!wasDismissed);
      setReady(true);
      setGlowing(true);
    });
    const timer = setTimeout(() => setGlowing(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Measure content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      requestAnimationFrame(() => setContentHeight(height));
    }
  }, [expanded, ready]);

  const handleDismiss = () => {
    setExpanded(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const handleOpen = () => {
    setExpanded(true);
  };

  if (!ready) return null;

  return (
    <>
      {/* Inline "i" button — visible when collapsed, sits in the subtitle row via parent flex */}
      <button
        onClick={handleOpen}
        className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-full border bg-surface text-neon transition-all duration-300 hover:bg-neon/10 ${
          expanded ? "pointer-events-none opacity-0" : "opacity-100"
        } ${
          glowing
            ? "border-neon/50 shadow-[0_0_12px_rgba(var(--neon-rgb,0,255,65),0.25)]"
            : "border-border"
        }`}
        aria-label="Show info"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Expandable card — renders below the subtitle row */}
      <div
        className={`w-full overflow-hidden rounded-xl border bg-surface transition-all duration-400 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
          glowing
            ? "border-neon/50 shadow-[0_0_15px_rgba(var(--neon-rgb,0,255,65),0.2)]"
            : "border-border"
        } ${expanded ? "p-4 mb-0" : "p-0 border-transparent bg-transparent mb-0"}`}
        style={{
          maxHeight: expanded ? `${contentHeight + 32}px` : "0px",
          opacity: expanded ? 1 : 0,
        }}
      >
        <div ref={contentRef}>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neon/10 text-neon">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Want to create an event?</p>
              <p className="mt-1 text-sm text-foreground/60">
                Use the &quot;+ New Game Night&quot; button to submit a public event for
                moderator approval, or create an invite-only event for your friends.
                Reach out to a{" "}
                <span className="font-medium text-red-400">moderator</span> with
                questions.
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="shrink-0 text-foreground/30 transition hover:text-foreground/60"
              aria-label="Dismiss"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
