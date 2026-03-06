type BadgeVariant = "neon" | "warning" | "danger" | "neutral";

const variants: Record<BadgeVariant, string> = {
  neon: "bg-neon/15 text-neon border-neon/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  danger: "bg-danger/15 text-danger border-danger/30",
  neutral: "bg-surface-lighter text-foreground/70 border-border",
};

export default function Badge({
  children,
  variant = "neon",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
