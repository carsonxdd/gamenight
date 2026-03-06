interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export default function Card({ children, className = "", glow }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface p-4 ${glow ? "box-glow" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
