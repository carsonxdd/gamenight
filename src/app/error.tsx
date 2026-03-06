"use client";

import Button from "@/components/ui/Button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold text-danger">Something went wrong</h2>
      <p className="text-foreground/50">An unexpected error occurred.</p>
      <Button onClick={reset} variant="secondary">
        Try Again
      </Button>
    </div>
  );
}
