"use client";

import { useState, useEffect } from "react";
import { TRPCProvider } from "@/lib/api/trpc-client";

/**
 * Client-only providers wrapper — renders children only after
 * mounting on the client to prevent hydration mismatches.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a minimal placeholder that matches the server render
    return <div suppressHydrationWarning>{children}</div>;
  }

  return <TRPCProvider>{children}</TRPCProvider>;
}
