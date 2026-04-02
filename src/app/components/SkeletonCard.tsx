/**
 * Skeleton loader components for perceived-performance improvements.
 * Usage: replace a spinner while content is loading.
 */

function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-current opacity-[0.07] ${className}`}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-shimmer"
        style={{
          background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.65) 50%,transparent 100%)',
        }}
      />
    </div>
  );
}

/** Trip card skeleton — matches the layout of a TripsPage card */
export function TripCardSkeleton({ isDark = true }: { isDark?: boolean }) {
  const base = isDark ? 'text-white' : 'text-[#0f172a]';
  const bg   = isDark ? 'bg-[#162030] border-[#1e2d3a]' : 'bg-white border-[#e8edf4]';
  return (
    <div className={`rounded-3xl border overflow-hidden shadow-lg ${bg}`}>
      {/* Map banner placeholder */}
      <Shimmer className={`h-[110px] w-full rounded-none ${base}`} />
      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Shimmer className={`h-4 flex-1 ${base}`} />
          <Shimmer className={`h-4 w-20 ${base}`} />
        </div>
        <div className="flex items-center gap-2">
          <Shimmer className={`h-3 w-24 ${base}`} />
          <Shimmer className={`h-3 w-16 ${base}`} />
        </div>
        <div className="flex justify-between items-center pt-1">
          <Shimmer className={`h-8 w-8 rounded-full ${base}`} />
          <Shimmer className={`h-8 w-24 rounded-xl ${base}`} />
        </div>
      </div>
    </div>
  );
}

/** Chat row skeleton — matches MessagesPage list items */
export function ChatRowSkeleton({ isDark = true }: { isDark?: boolean }) {
  const base = isDark ? 'text-white' : 'text-[#0f172a]';
  const bg   = isDark ? 'bg-[#1a2c32]' : 'bg-white';
  return (
    <div className={`flex items-center gap-4 p-4 ${bg}`}>
      <Shimmer className={`h-12 w-12 rounded-full shrink-0 ${base}`} />
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Shimmer className={`h-3.5 w-32 ${base}`} />
          <Shimmer className={`h-3 w-10 ${base}`} />
        </div>
        <Shimmer className={`h-3 w-48 ${base}`} />
      </div>
    </div>
  );
}

/** Generic list skeleton — N rows of text */
export function ListSkeleton({ rows = 5, isDark = true }: { rows?: number; isDark?: boolean }) {
  const base = isDark ? 'text-white' : 'text-[#0f172a]';
  return (
    <div className="flex flex-col gap-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Shimmer className={`h-4 w-3/4 ${base}`} />
          <Shimmer className={`h-3 w-1/2 ${base}`} />
        </div>
      ))}
    </div>
  );
}
