import { appRouter } from "@/server/routers/_app";

/**
 * Client-side tRPC caller — creates a direct caller for server-side router
 * without going through HTTP. Useful for client components that need to call
 * tRPC procedures directly.
 */
export function createCaller() {
  return appRouter.createCaller({});
}
