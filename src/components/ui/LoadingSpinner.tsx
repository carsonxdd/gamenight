export default function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-border border-t-neon"
      style={{ width: size, height: size }}
    />
  );
}
