type StampVariant = "category" | "nuevo" | "ultimas" | "agotado" | "vintage";

function tiltFor(label: string): -1 | 1 {
  let hash = 0;
  for (const char of label) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return hash & 1 ? 1 : -1;
}

const STYLES: Record<StampVariant, string> = {
  category: "border-purple text-purple",
  nuevo: "border-red text-red",
  ultimas: "border-red text-red",
  agotado: "border-void bg-void text-paper",
  vintage: "border-purple-bright bg-purple-bright text-ink",
};

export function StampBadge({
  variant,
  label,
  className = "",
}: {
  variant: StampVariant;
  label: string;
  className?: string;
}) {
  const tilt = tiltFor(label);
  return (
    <span
      className={`inline-block select-none border-2 px-1.5 py-0.5 font-display text-[0.65rem] font-extrabold uppercase tracking-widest ${
        STYLES[variant]
      } ${tilt === 1 ? "rotate-2" : "-rotate-2"} ${className}`}
    >
      {label}
    </span>
  );
}
