import { describe, expect, it } from "vitest";
import { renderOrderConfirmation } from "@/lib/email/template";
import type { OrderConfirmationEmailInput } from "@/lib/email/types";

const INPUT: OrderConfirmationEmailInput = {
  to: "cliente@example.com",
  orderId: 42,
  checkoutSessionId: "cs_test_abc123",
  createdAt: "2026-08-18T10:30:00.000Z",
  items: [
    {
      productSlug: "skull-crush-tee",
      productName: "Skull Crush Tee",
      size: "M",
      qty: 2,
      unitPriceCents: 2500,
    },
    {
      productSlug: "street-zip",
      productName: "Street Zip Hoodie",
      size: "L",
      qty: 1,
      unitPriceCents: 4900,
    },
  ],
  subtotalCents: 9900,
  totalCents: 9900,
};

describe("renderOrderConfirmation", () => {
  it("renders the house HTML with the order reference and totals (es-ES)", () => {
    const html = renderOrderConfirmation(INPUT);

    expect(html).toContain("<html lang=\"es\">");
    expect(html).toMatch(/ALTER<span[^>]*>STW<\/span>/);
    expect(html).toContain("Pedido confirmado");
    expect(html).toContain("Pedido #42");
    expect(html).toContain("cs_test_abc123");
    expect(html).toContain("Skull Crush Tee");
    expect(html).toContain("talla M");
    expect(html).toContain("Street Zip Hoodie");
    expect(html).toMatch(/99,00\s*€/);
    expect(html).toContain("/checkout/success?session_id=cs_test_abc123");
    expect(html).toContain("/productos");
  });

  it("formats per-unit and line totals in cents as EUR", () => {
    const html = renderOrderConfirmation(INPUT);

    expect(html).toMatch(/25,00\s*€/);
    expect(html).toMatch(/50,00\s*€/);
    expect(html).toMatch(/49,00\s*€/);
  });

  it("escapes html-sensitive characters in user data", () => {
    const hostile = renderOrderConfirmation({
      ...INPUT,
      items: [
        {
          productSlug: "x",
          productName: "<script>alert(1)</script>",
          size: "M",
          qty: 1,
          unitPriceCents: 1000,
        },
      ],
    });

    expect(hostile).not.toContain("<script>");
    expect(hostile).toContain("&lt;script&gt;");
  });
});