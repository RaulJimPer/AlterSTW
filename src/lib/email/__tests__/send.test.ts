import { afterEach, describe, expect, it, vi } from "vitest";

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
}));

vi.mock("@/lib/email/client", () => ({
  getResend: () => ({
    emails: { send: sendMock },
  }),
}));

import { sendOrderConfirmation } from "@/lib/email/send";
import type { OrderConfirmationEmailInput } from "@/lib/email/types";

const INPUT: OrderConfirmationEmailInput = {
  to: "cliente@example.com",
  orderId: 7,
  checkoutSessionId: "cs_test_valid",
  createdAt: "2026-08-18T10:30:00.000Z",
  items: [
    {
      productSlug: "skull-crush-tee",
      productName: "Skull Crush Tee",
      size: "M",
      qty: 1,
      unitPriceCents: 2500,
    },
  ],
  subtotalCents: 2500,
  totalCents: 2500,
};

describe("sendOrderConfirmation", () => {
  afterEach(() => sendMock.mockReset());

  it("sends via Resend with the house HTML and returns ok", async () => {
    vi.stubEnv("EMAIL_FROM", "AlterSTW <tienda@alterstw.com>");
    sendMock.mockResolvedValue({ data: { id: "em_1" }, error: null });

    const result = await sendOrderConfirmation(INPUT);

    expect(result).toEqual({ ok: true });
    expect(sendMock).toHaveBeenCalledTimes(1);
    const args = sendMock.mock.calls[0][0] as {
      from: string;
      to: string[];
      subject: string;
      html: string;
    };
    expect(args.from).toBe("AlterSTW <tienda@alterstw.com>");
    expect(args.to).toEqual(["cliente@example.com"]);
    expect(args.subject).toContain("Pedido 7 confirmado");
    expect(args.html).toMatch(/ALTER<span[^>]*>STW<\/span>/);
    vi.unstubAllEnvs();
  });

  it("never throws and reports a provider error", async () => {
    vi.stubEnv("EMAIL_FROM", "AlterSTW <tienda@alterstw.com>");
    sendMock.mockResolvedValue({ data: null, error: { message: "Rate limit" } });

    const result = await sendOrderConfirmation(INPUT);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Rate limit");
    vi.unstubAllEnvs();
  });

  it("never throws when the provider call rejects", async () => {
    vi.stubEnv("EMAIL_FROM", "AlterSTW <tienda@alterstw.com>");
    sendMock.mockRejectedValue(new Error("network down"));

    const result = await sendOrderConfirmation(INPUT);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("network down");
    vi.unstubAllEnvs();
  });

  it("returns an error for an invalid payload without calling Resend", async () => {
    vi.stubEnv("EMAIL_FROM", "AlterSTW <tienda@alterstw.com>");
    const result = await sendOrderConfirmation({
      ...INPUT,
      items: [],
    });

    expect(result.ok).toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});