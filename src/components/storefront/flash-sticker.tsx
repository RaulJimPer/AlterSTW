type FlashStickerColor = "yellow" | "red" | "purple";

const STYLES: Record<FlashStickerColor, string> = {
  yellow: "border-ink bg-yellow text-ink",
  red: "border-red bg-paper text-red",
  purple: "border-purple bg-paper text-purple",
};

export function FlashSticker({
  label,
  color = "yellow",
}: {
  label: string;
  color?: FlashStickerColor;
}) {
  return (
    <span
      className={`inline-flex items-center border px-1.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-widest ${
        STYLES[color]
      }`}
    >
      {label}
    </span>
  );
}
