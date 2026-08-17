import { z } from "zod";

// Mínimo del evento que el webhook necesita verificar antes de procesar; el
// objeto completo ya viene firmado por Stripe y validado con constructEvent.
export const stripeEventSchema = z.object({
  type: z.string().min(1),
  data: z.object({
    object: z.object({
      id: z.string().min(1),
    }),
  }),
});

export const checkoutSessionCompletedSchema = stripeEventSchema.extend({
  type: z.literal("checkout.session.completed"),
});

export type CheckoutSessionCompleted = z.infer<
  typeof checkoutSessionCompletedSchema
>;