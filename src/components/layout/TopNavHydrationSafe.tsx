"use client";

import { useEffect, useState } from "react";
import { TopNav } from "@/components/layout/TopNav";

export function TopNavHydrationSafe() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ height: "69px" }} />;
  }

  return <TopNav />;
}
