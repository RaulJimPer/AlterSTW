import { z } from "zod";

export const orderConfirmationEmailInputSchema = z.object({
  to: z.string().trim().min(1),
  orderId: z.number().int().positive(),
  checkoutSessionId: z.string().trim().min(1),
  createdAt: z.string().trim().min(1),
  items: z
    .array(
      z.object({
        productSlug: z.string().trim().min(1),
        productName: z.string().trim().min(1),
        size: z.string().trim().min(1),
        qty: z.number().int().positive(),
        unitPriceCents: z.number().int().nonnegative(),
      }),
    )
    .min(1),
  subtotalCents: z.number().int().nonnegative(),
  totalCents: z.number().int().nonnegative(),
});

export type OrderConfirmationEmailInput = z.infer<
  typeof orderConfirmationEmailInputSchema
>;