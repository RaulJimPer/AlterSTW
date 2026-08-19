"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setProductStatus } from "@/lib/admin/actions";

export function ProductStatusAction({
  slug,
  published,
}: {
  slug: string;
  published: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const result = await setProductStatus(slug, !published);
      if (result.ok) router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      className={published ? "admin-btn" : "admin-btn-primary"}
    >
      {published ? "Despublicar" : "Publicar"}
    </button>
  );
}