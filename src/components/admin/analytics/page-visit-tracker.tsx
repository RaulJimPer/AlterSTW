"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageVisitAction } from "@/lib/analytics/track";

export function PageVisitTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) void trackPageVisitAction(pathname);
  }, [pathname]);
  return null;
}
