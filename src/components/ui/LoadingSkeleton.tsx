export function LoadingSkeleton({
  className = 'h-6 w-full',
  rows = 1
}: {
  className?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-lg bg-[var(--border-subtle)]/70 ${className}`}
        />
      ))}
    </div>
  );
}
