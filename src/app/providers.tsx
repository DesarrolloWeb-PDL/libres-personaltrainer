"use client";

import { TRPCProvider } from "@/lib/api/trpc-client";

/**
 * Client-only providers wrapper — prevents hydration mismatches
 * by only rendering providers on the client side.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <TRPCProvider>{children}</TRPCProvider>;
}
