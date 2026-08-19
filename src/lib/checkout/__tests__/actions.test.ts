import { beforeEach, describe, expect, it, vi } from "vitest";

const { readCartMock, clearCartCookieMock, revalidatePathMock, createMock } =
  vi.hoisted(() => ({
    readCartMock: vi.fn(),
    clearCartCookieMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    createMock: vi.fn(),
  }));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/cart/cart", () => ({
  readCart: readCartMock,
  clearCartCookie: clearCartCookieMock,
}));

vi.mock("@/lib/cart/queries", () => ({
  resolveCart: vi.fn(),
}));

vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({
    checkout: { sessions: { create: createMock } },
  }),
}));

import { resolveCart } from "@/lib/cart/queries";
import { createCheckoutSession, clearCartAfterOrder } from "@/lib/checkout/actions";
import { buildCartState } from "@/lib/cart/totals";
import type { CartLineItem } from "@/lib/cart/types";

const AVAILABLE_TEE: CartLineItem = {
  slug: "skull-crush-tee",
  size: "M",
  qty: 2,
  name: "Skull Crush Tee",
  image: "/images/seed/skull-crush.jpg",
  priceCents: 2500,
  stock: 3,
  available: true,
};

describe("createCheckoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a EUR payment session with price_data and product_slug metadata", async () => {
    readCartMock.mockResolvedValue([
      { slug: "skull-crush-tee", size: "M", qty: 2 },
    ]);
    vi.mocked(resolveCart).mockResolvedValue(buildCartState([AVAILABLE_TEE]));
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://alterstw.com");
    createMock.mockResolvedValue({
      url: "https://checkout.stripe.com/c/pay/cs_test",
    });

    const result = await createCheckoutSession();

    expect(result).toEqual({
      ok: true,
      url: "https://checkout.stripe.com/c/pay/cs_test",
    });
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "payment",
        success_url:
          "https://alterstw.com/checkout/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "https://alterstw.com/checkout/cancel",
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              currency: "eur",
              unit_amount: 2500,
              product_data: expect.objectContaining({
                metadata: { product_slug: "skull-crush-tee" },
              }),
            }),
            metadata: {
              product_slug: "skull-crush-tee",
              size: "M",
              product_name: "Skull Crush Tee",
            },
            quantity: 2,
          }),
        ],
      }),
    );

    const firstItem = createMock.mock.calls[0][0].line_items[0];
    expect(firstItem.price_data.metadata).toBeUndefined();
    expect(firstItem.metadata).toEqual({
      product_slug: "skull-crush-tee",
      size: "M",
      product_name: "Skull Crush Tee",
    });
    vi.unstubAllEnvs();
  });

  it("returns an error for an empty cart", async () => {
    readCartMock.mockResolvedValue([]);
    vi.mocked(resolveCart).mockResolvedValue(buildCartState([]));

    const result = await createCheckoutSession();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("artículos disponibles");
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns an error when any line is no longer available (hard stock gate)", async () => {
    readCartMock.mockResolvedValue([
      { slug: "skull-crush-tee", size: "M", qty: 2 },
      { slug: "street-zip", size: "L", qty: 1 },
    ]);
    const soldOut: CartLineItem = {
      slug: "street-zip",
      size: "L",
      qty: 0,
      name: "Street Zip Hoodie",
      image: "/images/seed/street-zip.jpg",
      stock: 0,
      priceCents: null,
      available: false,
    };
    vi.mocked(resolveCart).mockResolvedValue(
      buildCartState([AVAILABLE_TEE, soldOut]),
    );

    const result = await createCheckoutSession();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("no está disponible");
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns an error when Stripe fails instead of throwing", async () => {
    readCartMock.mockResolvedValue([
      { slug: "skull-crush-tee", size: "M", qty: 2 },
    ]);
    vi.mocked(resolveCart).mockResolvedValue(buildCartState([AVAILABLE_TEE]));
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://alterstw.com");
    createMock.mockRejectedValue(new Error("stripe down"));

    const result = await createCheckoutSession();

    expect(result.ok).toBe(false);
    vi.unstubAllEnvs();
  });
});

describe("clearCartAfterOrder", () => {
  it("clears the session cart cookie and revalidates the layout", async () => {
    await clearCartAfterOrder();

    expect(clearCartCookieMock).toHaveBeenCalledTimes(1);
    expect(revalidatePathMock).toHaveBeenCalledWith("/", "layout");
  });
});