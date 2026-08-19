import { z } from "zod";

export const MAX_COOKIE_BYTES = 3000;
export const MAX_LINES = 20;
export const MAX_QTY = 99;

const slug = z.string().trim().min(1).max(100);
const size = z.string().trim().min(1).max(24);

export const cartLineSchema = z.object({
  slug,
  size,
  qty: z.number().int().min(1).max(MAX_QTY),
});
export type CartLine = z.infer<typeof cartLineSchema>;

export const cartCookieSchema = z.array(cartLineSchema).max(MAX_LINES);

export const cartLineKeySchema = z.object({ slug, size });
export type CartLineKey = z.infer<typeof cartLineKeySchema>;

export const setQuantityInputSchema = cartLineKeySchema.extend({
  qty: z.coerce.number().int().min(0).max(MAX_QTY),
});
export type SetQuantityInput = z.infer<typeof setQuantityInputSchema>;