import { getResend } from "./client";
import type { OrderConfirmationEmailInput, SendEmailResult } from "./types";
import { renderOrderConfirmation } from "./template";
import { orderConfirmationEmailInputSchema } from "./zod";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name} in .env.local`);
  }
  return value;
}

export async function sendOrderConfirmation(
  input: OrderConfirmationEmailInput,
): Promise<SendEmailResult> {
  const parsed = orderConfirmationEmailInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Payload de email inválido" };
  }

  const html = renderOrderConfirmation(parsed.data);

  // Best-effort: any provider failure is reported and never thrown.
  try {
    const { error } = await getResend().emails.send({
      from: requiredEnv("EMAIL_FROM"),
      to: [parsed.data.to],
      subject: `Pedido ${parsed.data.orderId} confirmado · AlterSTW`,
      html,
    });

    if (error) {
      return { ok: false, error: error.message ?? "Fallo del proveedor de email" };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Fallo del proveedor de email",
    };
  }
}