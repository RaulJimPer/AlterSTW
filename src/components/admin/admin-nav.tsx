"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/inventario", label: "Inventario" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/analytics", label: "Estadísticas" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1" aria-label="Secciones del panel">
      {LINKS.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "rounded bg-[#18181b] px-3 py-2 text-sm font-semibold text-white"
                : "rounded px-3 py-2 text-sm font-medium text-[#52525b] hover:bg-[#f4f4f5] hover:text-[#18181b]"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}