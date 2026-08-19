import { describe, expect, it, vi } from "vitest";

const { constructEventMock, sessionsRetrieveMock } = vi.hoisted(() => ({
  constructEventMock: vi.fn(),
  sessionsRetrieveMock: vi.fn(),
}));

const { StripeMock } = vi.hoisted(() => {
  class StripeFake {
    webhooks = { constructEvent: constructEventMock };
    checkout = { sessions: { retrieve: sessionsRetrieveMock } };
  }
  return { StripeMock: StripeFake };
});

vi.mock("stripe", () => ({ default: StripeMock }));

import { getStripe, verifyStripeWebhook } from "@/lib/stripe/server";

describe("getStripe", () => {
  it("builds a server-side client from STRIPE_SECRET_KEY", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    expect(getStripe()).toBeInstanceOf(StripeMock);
    vi.unstubAllEnvs();
  });

  it("reuses a single client instance", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    expect(getStripe()).toBe(getStripe());
    vi.unstubAllEnvs();
  });
});

describe("verifyStripeWebhook", () => {
  it("returns the decoded event on a valid signature", () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    const event = { type: "checkout.session.completed", data: { object: { id: "cs_1" } } };
    constructEventMock.mockReturnValue(event);

    expect(verifyStripeWebhook('{"id":"evt"}', "sig")).toBe(event);
    expect(constructEventMock).toHaveBeenCalledWith(
      '{"id":"evt"}',
      "sig",
      "whsec_test",
    );
    vi.unstubAllEnvs();
  });

  it("propagates signature errors to the caller", () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    constructEventMock.mockImplementation(() => {
      throw new Error("No signatures found");
    });

    expect(() => verifyStripeWebhook("{}", "bad")).toThrow("No signatures found");
    vi.unstubAllEnvs();
  });
});