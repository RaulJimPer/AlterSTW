"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const pathSchema = z.string().trim().min(1).max(200);

// Fire-and-forget: must never block the storefront nor surface insert errors.
export async function trackPageVisitAction(path: string): Promise<void> {
  const parsed = pathSchema.safeParse(path);
  if (!parsed.success) return;

  try {
    const db = await createClient();
    await db.from("page_visits").insert({ path: parsed.data });
  } catch {
  }
}
