import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type CookieOptions = {
  path?: string;
  sameSite?: "lax" | "strict";
  httpOnly?: boolean;
  maxAge?: number;
};

const { cookiesStore, cookiesMock } = vi.hoisted(() => {
  const store = new Map<string, { value: string; options?: CookieOptions }>();
  return {
    cookiesStore: store,
    cookiesMock: vi.fn(() => ({
      get: (name: string) => store.get(name),
      set: (name: string, value: string, options?: CookieOptions) => {
        store.set(name, { value, options });
      },
      delete: (name: string) => {
        store.delete(name);
      },
    })),
  };
});

vi.mock("next/headers", () => ({ cookies: cookiesMock }));

import { CART_COOKIE, readCart, writeCart, clearCartCookie } from "@/lib/cart/cart";
import { CartError } from "@/lib/cart/errors";
import { MAX_COOKIE_BYTES } from "@/lib/cart/zod";

describe("readCart", () => {
  beforeEach(() => {
    cookiesStore.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty list when the cookie is missing", async () => {
    expect(await readCart()).toEqual([]);
    expect(cookiesMock).toHaveBeenCalled();
  });

  it("returns an empty list when the cookie is not valid JSON", async () => {
    cookiesStore.set(CART_COOKIE, { value: "{not-json" });
    expect(await readCart()).toEqual([]);
  });

  it("returns an empty list when the JSON fails validation", async () => {
    cookiesStore.set(CART_COOKIE, { value: JSON.stringify([{ slug: "tee", qty: 0 }]) });
    expect(await readCart()).toEqual([]);
  });

  it("parses a valid cookie payload", async () => {
    const lines = [{ slug: "skull-crush-tee", size: "M", qty: 2 }];
    cookiesStore.set(CART_COOKIE, { value: JSON.stringify(lines) });
    expect(await readCart()).toEqual(lines);
  });
});

describe("writeCart", () => {
  beforeEach(() => {
    cookiesStore.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("stores the JSON payload with session-scoped options", async () => {
    const lines = [{ slug: "skull-crush-tee", size: "M", qty: 1 }];
    await writeCart(lines);

    const saved = cookiesStore.get(CART_COOKIE);
    expect(saved?.value).toBe(JSON.stringify(lines));
    expect(saved?.options).toEqual({
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    });
  });

  it("throws limit-bytes when the payload exceeds the byte guard", async () => {
    const lines = Array.from({ length: 20 }, (_, index) => ({
      slug: "a".repeat(100 - String(index).length) + String(index),
      size: "b".repeat(24),
      qty: 99,
    }));
    const payload = JSON.stringify(lines);
    expect(payload.length).toBeGreaterThan(MAX_COOKIE_BYTES);

    await expect(writeCart(lines)).rejects.toThrowError(CartError);
    expect(cookiesStore.has(CART_COOKIE)).toBe(false);
  });
});

describe("clearCartCookie", () => {
  it("drops the cookie from the store", async () => {
    cookiesStore.set(CART_COOKIE, { value: "[]" });
    await clearCartCookie();
    expect(cookiesStore.has(CART_COOKIE)).toBe(false);
  });
});