import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(),
}));

import { createServiceClient } from "@/lib/supabase/service";
import { getOrderByCheckoutSessionId } from "@/lib/orders/queries";
import type { OrderSummary } from "@/lib/orders/types";

function stubClient(data: unknown) {
  vi.mocked(createServiceClient).mockReturnValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data, error: null }),
        }),
      }),
    }),
  } as never);
}

const orderRow = {
  id: 1,
  checkout_session_id: "cs_test_123",
  customer_email: "cliente@example.com",
  status: "paid",
  email_status: "pending",
  email_sent_at: null,
  subtotal_cents: 5000,
  total_cents: 5000,
  created_at: "2026-08-18T10:30:00.000Z",
  order_items: [
    {
      product_slug: "skull-crush-tee",
      product_name: "Skull Crush Tee",
      size: "M",
      qty: 2,
      unit_price_cents: 2500,
    },
  ],
};

describe("getOrderByCheckoutSessionId", () => {
  it("maps a stored order with its items into an OrderSummary", async () => {
    stubClient(orderRow);

    const order = await getOrderByCheckoutSessionId("cs_test_123");

    const expected: OrderSummary = {
      id: 1,
      checkoutSessionId: "cs_test_123",
      customerEmail: "cliente@example.com",
      status: "paid",
      emailStatus: "pending",
      emailSentAt: null,
      subtotalCents: 5000,
      totalCents: 5000,
      createdAt: "2026-08-18T10:30:00.000Z",
      items: [
        {
          productSlug: "skull-crush-tee",
          productName: "Skull Crush Tee",
          size: "M",
          qty: 2,
          unitPriceCents: 2500,
        },
      ],
    };
    expect(order).toEqual(expected);
  });

  it("returns null when the session is not recorded yet (webhook pending)", async () => {
    stubClient(null);

    const order = await getOrderByCheckoutSessionId("cs_test_unknown");

    expect(order).toBeNull();
  });
});