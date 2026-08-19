import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifyMock, retrieveMock, rpcMock, orderUpdateMock, getOrderMock, sendMock } =
  vi.hoisted(() => ({
    verifyMock: vi.fn(),
    retrieveMock: vi.fn(),
    rpcMock: vi.fn(),
    orderUpdateMock: vi.fn(),
    getOrderMock: vi.fn(),
    sendMock: vi.fn(),
  }));

vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({
    checkout: { sessions: { retrieve: retrieveMock } },
    webhooks: { constructEvent: verifyMock },
  }),
  verifyStripeWebhook: verifyMock,
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    rpc: rpcMock,
    from: () => ({
      update: (payload: unknown) => {
        orderUpdateMock(payload);
        return { eq: () => Promise.resolve({ error: null }) };
      },
    }),
  }),
}));

vi.mock("@/lib/orders/queries", () => ({
  getOrderByCheckoutSessionId: getOrderMock,
}));

vi.mock("@/lib/email/send", () => ({
  sendOrderConfirmation: sendMock,
}));

import { POST } from "@/app/api/webhooks/stripe/route";

function sessionPayload(overrides: Record<string, unknown> = {}) {
  return {
    id: "cs_test_123",
    amount_subtotal: 5000,
    amount_total: 5000,
    customer_details: { email: "cliente@example.com" },
    line_items: {
      data: [
        {
          quantity: 2,
          description: "Skull Crush Tee",
          metadata: {
            product_slug: "skull-crush-tee",
            product_name: "Skull Crush Tee",
            size: "M",
          },
          price: { unit_amount: 2500 },
        },
      ],
    },
    ...overrides,
  };
}

const PAID_ORDER = {
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

async function postEvent(body: string, signature = "sig") {
  const request = new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: { "content-type": "application/json", "stripe-signature": signature },
    body,
  });
  return POST(request);
}

describe("Stripe webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendMock.mockResolvedValue({ ok: true });
    getOrderMock.mockResolvedValue(PAID_ORDER);
    orderUpdateMock.mockResolvedValue({ error: null });
  });

  it("answers 400 on a failed signature without processing anything", async () => {
    verifyMock.mockImplementation(() => {
      throw new Error("bad signature");
    });

    const response = await postEvent("{}", "bad");

    expect(response.status).toBe(400);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("ignores non checkout.session.completed events", async () => {
    verifyMock.mockReturnValue({
      type: "checkout.session.async_payment_failed",
      data: { object: { id: "cs_x" } },
    });

    const response = await postEvent("{}");

    expect(response.status).toBe(200);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("answers 500 when the session cannot be retrieved", async () => {
    verifyMock.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_123" } },
    });
    retrieveMock.mockRejectedValue(new Error("down"));

    const response = await postEvent("{}");

    expect(response.status).toBe(500);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("records the paid order transactionally and sends the email once", async () => {
    verifyMock.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_123" } },
    });
    retrieveMock.mockResolvedValue(sessionPayload());
    rpcMock.mockResolvedValue({ data: "paid", error: null });

    const response = await postEvent('{"event":true}');

    expect(response.status).toBe(200);
    expect(rpcMock).toHaveBeenCalledWith(
      "record_checkout_payment",
      expect.objectContaining({
        p_checkout_session_id: "cs_test_123",
        p_customer_email: "cliente@example.com",
        p_subtotal_cents: 5000,
        p_total_cents: 5000,
      }),
    );
    expect(rpcMock).toHaveBeenCalledWith(
      "record_checkout_payment",
      expect.objectContaining({
        p_lines: [
          expect.objectContaining({
            product_slug: "skull-crush-tee",
            product_name: "Skull Crush Tee",
            size: "M",
            qty: 2,
            unit_price_cents: 2500,
          }),
        ],
      }),
    );
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(orderUpdateMock).toHaveBeenCalled();
  });

  it("does not re-send the email on a replay (RPC returns exists)", async () => {
    verifyMock.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_123" } },
    });
    retrieveMock.mockResolvedValue(sessionPayload());
    rpcMock.mockResolvedValue({ data: "exists", error: null });

    const response = await postEvent('{"event":true}');

    expect(response.status).toBe(200);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("records a stock_failed order without sending an email", async () => {
    verifyMock.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_123" } },
    });
    retrieveMock.mockResolvedValue(sessionPayload());
    rpcMock.mockResolvedValue({ data: "stock_failed", error: null });

    const response = await postEvent('{"event":true}');

    expect(response.status).toBe(200);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("degrades gracefully when the email fails (status failed, still 200)", async () => {
    verifyMock.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_123" } },
    });
    retrieveMock.mockResolvedValue(sessionPayload());
    rpcMock.mockResolvedValue({ data: "paid", error: null });
    sendMock.mockResolvedValue({ ok: false, error: "Resend offline" });

    const response = await postEvent('{"event":true}');

    expect(response.status).toBe(200);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(orderUpdateMock).toHaveBeenCalledWith({
      email_status: "failed",
      email_sent_at: null,
    });
  });

  it("marks the email failed and skips sending when there is no customer email", async () => {
    verifyMock.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_123" } },
    });
    retrieveMock.mockResolvedValue(
      sessionPayload({ customer_details: { email: null } }),
    );
    rpcMock.mockResolvedValue({ data: "paid", error: null });
    getOrderMock.mockResolvedValue({ ...PAID_ORDER, customerEmail: null });

    const response = await postEvent('{"event":true}');

    expect(response.status).toBe(200);
    expect(sendMock).not.toHaveBeenCalled();
    expect(orderUpdateMock).toHaveBeenCalledWith({
      email_status: "failed",
      email_sent_at: null,
    });
  });

  it("answers 500 when the RPC transaction fails (Stripe retries)", async () => {
    verifyMock.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_123" } },
    });
    retrieveMock.mockResolvedValue(sessionPayload());
    rpcMock.mockResolvedValue({ data: null, error: new Error("db down") });

    const response = await postEvent('{"event":true}');

    expect(response.status).toBe(500);
    expect(sendMock).not.toHaveBeenCalled();
  });
});