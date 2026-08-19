import { formatPrice } from "@/lib/catalog/format";

export function HangingPriceTag({
  cents,
  size = "sm",
}: {
  cents: number;
  size?: "sm" | "lg";
}) {
  const big = size === "lg";
  return (
    <span className="inline-flex items-start gap-1.5">
      <span
        aria-hidden
        className={`${big ? "mt-3" : "mt-2"} h-2 w-2 rounded-full border-2 border-red bg-paper`}
      />
      <span
        className={`inline-block rounded-print border-2 border-red bg-paper font-display font-bold tabular-nums text-red ${
          big ? "px-2.5 py-1 text-lg" : "px-1.5 py-0.5 text-sm"
        }`}
      >
        {formatPrice(cents)}
      </span>
    </span>
  );
}
