import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-[#71717a]">
        404
      </p>
      <h1 className="text-2xl font-bold tracking-tight">No se encontró nada</h1>
      <p className="text-sm text-[#52525b]">
        La página que buscas no existe en el panel.
      </p>
      <Link href="/admin/productos" className="admin-btn">
        Volver a productos
      </Link>
    </div>
  );
}