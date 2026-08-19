import { createClient } from "@supabase/supabase-js";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name} in .env.local`);
  }
  return value;
}

// Service-role client (bypasses RLS). Runtime use is restricted to the Stripe
// webhook, which is the only writer of orders and stock, and to reading an
// order back for the success page by checkout_session_id.
export function createServiceClient() {
  return createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}