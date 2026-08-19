import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminUser = { id: string; email: string };

export async function getAdminUser(): Promise<AdminUser | null> {
  const db = await createClient();
  const { data: session } = await db.auth.getUser();
  const user = session.user;
  if (!user?.email) return null;

  const { data, error } = await db
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || data === null) return null;

  return { id: user.id, email: user.email };
}

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (admin === null) redirect("/admin/login");
  return admin;
}