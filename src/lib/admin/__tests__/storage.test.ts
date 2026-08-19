import { beforeEach, describe, expect, it, vi } from "vitest";

const { createBrowserClientMock } = vi.hoisted(() => ({
  createBrowserClientMock: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: createBrowserClientMock,
}));

import {
  deleteProductImage,
  uploadProductImage,
  validateImageFile,
} from "@/lib/admin/storage";

function stubStorageClient(overrides: {
  upload?: ReturnType<typeof vi.fn>;
  remove?: ReturnType<typeof vi.fn>;
  getPublicUrl?: ReturnType<typeof vi.fn>;
}) {
  createBrowserClientMock.mockReturnValue({
    storage: {
      from: vi.fn(() => ({
        upload: overrides.upload ?? vi.fn().mockResolvedValue({ error: null }),
        remove: overrides.remove ?? vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl:
          overrides.getPublicUrl ??
          vi.fn().mockReturnValue({
            data: {
              publicUrl:
                "https://x.supabase.co/storage/v1/object/public/product-images/a/1.jpg",
            },
          }),
      })),
    },
  });
}

function makeFile(name = "camiseta.jpg", type = "image/jpeg", size = 1024): File {
  return new File([new Uint8Array(size)], name, { type });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
});

describe("validateImageFile", () => {
  it("accepts supported image types within the size limit", () => {
    expect(validateImageFile(makeFile())).toBeNull();
    expect(validateImageFile(makeFile("a.webp", "image/webp"))).toBeNull();
    expect(validateImageFile(makeFile("a.png", "image/png"))).toBeNull();
    expect(validateImageFile(makeFile("a.avif", "image/avif"))).toBeNull();
  });

  it("rejects unsupported types", () => {
    expect(validateImageFile(makeFile("doc.pdf", "application/pdf"))).toContain(
      "Formato no admitido",
    );
  });

  it("rejects files over the 2 MB limit", () => {
    expect(validateImageFile(makeFile("big.jpg", "image/jpeg", 2 * 1024 * 1024 + 1))).toContain(
      "supera los 2 MB",
    );
  });
});

describe("uploadProductImage", () => {
  it("uploads a valid image and returns its public URL", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    stubStorageClient({ upload });

    const result = await uploadProductImage(makeFile(), "skull-crush-tee");

    expect(result).toEqual({
      ok: true,
      path: expect.stringMatching(
        /^skull-crush-tee\/\d+-[a-z0-9]+\.jpg$/,
      ),
      url: "https://x.supabase.co/storage/v1/object/public/product-images/a/1.jpg",
    });
    expect(upload).toHaveBeenCalledTimes(1);
    if (result.ok) {
      expect(upload).toHaveBeenCalledWith(result.path, expect.any(File), {
        upsert: false,
      });
    }
  });

  it("fails fast when the file is invalid", async () => {
    const upload = vi.fn();
    stubStorageClient({ upload });

    const result = await uploadProductImage(
      makeFile("doc.pdf", "application/pdf"),
      "skull-crush-tee",
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Formato no admitido");
    expect(upload).not.toHaveBeenCalled();
  });

  it("returns an error when the upload fails", async () => {
    const upload = vi.fn().mockResolvedValue({ error: { message: "denied" } });
    stubStorageClient({ upload });

    const result = await uploadProductImage(makeFile(), "skull-crush-tee");

    expect(result).toEqual({ ok: false, error: expect.stringContaining("subir") });
  });
});

describe("deleteProductImage", () => {
  it("removes a valid product-images path", async () => {
    const remove = vi.fn().mockResolvedValue({ error: null });
    stubStorageClient({ remove });

    const result = await deleteProductImage("product-images/skull-crush-tee/1.jpg");

    expect(result).toEqual({ ok: true });
    expect(remove).toHaveBeenCalledWith(["product-images/skull-crush-tee/1.jpg"]);
  });

  it("rejects paths outside product-images", async () => {
    const remove = vi.fn();
    stubStorageClient({ remove });

    const result = await deleteProductImage("other/x.jpg");

    expect(result.ok).toBe(false);
    expect(remove).not.toHaveBeenCalled();
  });

  it("returns an error when the removal fails", async () => {
    const remove = vi.fn().mockResolvedValue({ error: { message: "denied" } });
    stubStorageClient({ remove });

    const result = await deleteProductImage("product-images/x.jpg");

    expect(result).toEqual({ ok: false, error: expect.stringContaining("borrar") });
  });
});