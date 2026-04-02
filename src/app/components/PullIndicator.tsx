/**
 * Reusable pull-to-refresh visual indicator.
 * Shows a rotating circle while pulling, animates spin when refreshing.
 */
export function PullIndicator({
  pullY,
  isRefreshing,
  color = '#1978e5',
}: {
  pullY: number;
  isRefreshing: boolean;
  color?: string;
}) {
  if (pullY <= 8 && !isRefreshing) return null;

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-[height,opacity] duration-200 will-change-[height]"
      style={{
        height: Math.min(pullY, 55),
        opacity: Math.min(pullY / 35, 1),
      }}
    >
      <div
        className={`w-7 h-7 rounded-full border-2 border-t-transparent ${isRefreshing ? 'animate-spin' : ''}`}
        style={{
          borderColor: `${color} transparent transparent transparent`,
          transform: isRefreshing ? undefined : `rotate(${pullY * 3}deg)`,
          transition: isRefreshing ? undefined : 'transform 0.05s linear',
        }}
      />
    </div>
  );
}
