export function SkeletonCard() {
  return (
    <div
      aria-hidden
      className="flex h-full flex-col overflow-hidden rounded-print border border-rule bg-paper"
    >
      <div className="aspect-[4/5] animate-pulse bg-rule/50" />
      <div className="flex items-start justify-between gap-2 p-3">
        <div className="space-y-2">
          <div className="h-3 w-16 animate-pulse bg-rule/70" />
          <div className="h-3 w-10 animate-pulse bg-rule/50" />
        </div>
        <div className="h-5 w-20 animate-pulse self-end bg-rule/70" />
      </div>
    </div>
  );
}
