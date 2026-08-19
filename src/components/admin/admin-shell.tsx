import { logout } from "@/lib/auth/actions";
import { AdminNav } from "./admin-nav";

export function AdminShell({
  adminEmail,
  children,
}: {
  adminEmail: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <aside className="flex flex-col gap-6 border-b border-[#d4d4d8] bg-white px-6 py-6 lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div>
          <p className="font-bold uppercase tracking-wide text-[#18181b]">
            AlterSTW
          </p>
          <p className="text-xs text-[#71717a]">Panel de administración</p>
        </div>
        <AdminNav />
        <div className="mt-auto flex flex-col gap-3">
          <p className="truncate text-xs text-[#71717a]" title={adminEmail}>
            {adminEmail}
          </p>
          <form action={logout}>
            <button type="submit" className="admin-btn w-full">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10">
        {children}
      </main>
    </div>
  );
}