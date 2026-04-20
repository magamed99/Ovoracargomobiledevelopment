export function RowSkeleton() {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5 animate-pulse">
      <div className="w-[52px] h-[52px] rounded-2xl bg-white/[0.07] shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex justify-between">
          <div className="h-3.5 w-32 rounded-lg bg-white/[0.07]" />
          <div className="h-3 w-10 rounded-lg bg-white/[0.05]" />
        </div>
        <div className="h-3 w-20 rounded-lg bg-white/[0.05]" />
        <div className="h-3 w-48 rounded-lg bg-white/[0.04]" />
      </div>
    </div>
  );
}
