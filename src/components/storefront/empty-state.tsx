import Link from "next/link";
import { StampBadge } from "./stamp-badge";

export function EmptyState({ resetHref = "/productos" }: { resetHref?: string }) {
  return (
    <div className="tilework-on-paper flex flex-col items-center justify-center gap-4 rounded-print border border-rule bg-paper px-6 py-16 text-center">
      <StampBadge variant="vintage" label="NADA POR AQUÍ" />
      <p className="max-w-sm text-sm leading-relaxed">
        No hay productos que cumplan esos filtros. Limpia los filtros y vuelve
        a mirar el catálogo.
      </p>
      <Link href={resetHref} className="btn-secondary">
        Ver catálogo completo
      </Link>
    </div>
  );
}
