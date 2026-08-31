"use client";

import { TRPCProvider } from "@/lib/api/trpc-client";

/**
 * Client-only providers wrapper.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <TRPCProvider>{children}</TRPCProvider>;
}
