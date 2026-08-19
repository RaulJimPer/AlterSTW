"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "./zod";

export type LoginResult = { ok: true } | { ok: false; error: string };

const GENERIC_ERROR = "No se pudo iniciar sesión. Revisa tus credenciales.";

export async function loginWithPassword(input: {
  email: string;
  password: string;
}): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC_ERROR };

  const db = await createClient();
  const { error } = await db.auth.signInWithPassword(parsed.data);

  if (error) return { ok: false, error: GENERIC_ERROR };

  redirect("/admin");
}

export async function logout(): Promise<void> {
  const db = await createClient();
  await db.auth.signOut();
  redirect("/admin/login");
}