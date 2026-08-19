import { describe, expect, it } from "vitest";
import {
  parseAdminOrderFilters,
  parseAdminProductFilters,
} from "@/lib/admin/zod";

describe("parseAdminProductFilters", () => {
  it("returns defaults for empty params", () => {
    expect(parseAdminProductFilters({})).toEqual({ page: 1 });
  });

  it("parses status, categoryId, q and page", () => {
    expect(
      parseAdminProductFilters({
        status: "draft",
        categoryId: "3",
        q: "tee",
        page: "2",
      }),
    ).toEqual({
      status: "draft",
      categoryId: "3",
      q: "tee",
      page: 2,
    });
  });

  it("drops invalid status and page values", () => {
    expect(
      parseAdminProductFilters({ status: "weird", page: "abc" }),
    ).toEqual({ page: 1 });
  });

  it("takes the first value of array params", () => {
    expect(parseAdminProductFilters({ q: ["tee", "hoodie"] }).q).toBe("tee");
  });
});

describe("parseAdminOrderFilters", () => {
  it("returns defaults for empty params", () => {
    expect(parseAdminOrderFilters({})).toEqual({ page: 1 });
  });

  it("parses status and emailStatus", () => {
    expect(
      parseAdminOrderFilters({ status: "stock_failed", emailStatus: "failed" }),
    ).toEqual({ status: "stock_failed", emailStatus: "failed", page: 1 });
  });

  it("drops invalid options", () => {
    expect(
      parseAdminOrderFilters({ status: "bogus", emailStatus: "bogus" }),
    ).toEqual({ page: 1 });
  });
});