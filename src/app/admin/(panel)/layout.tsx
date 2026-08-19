import { requireAdmin } from "@/lib/auth/guard";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  return <AdminShell adminEmail={admin.email}>{children}</AdminShell>;
}