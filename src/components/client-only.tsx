"use client";

import { useState, useEffect } from "react";

/**
 * Renders children only on the client side.
 * Prevents SSR for components that depend on client-only context (e.g. tRPC).
 */
export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}
