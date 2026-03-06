import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <h2 className="text-6xl font-extrabold text-neon text-glow">404</h2>
      <p className="text-foreground/50">Page not found</p>
      <Link
        href="/"
        className="rounded-lg border border-neon px-6 py-2 text-neon transition hover:bg-neon/10"
      >
        Go Home
      </Link>
    </div>
  );
}
