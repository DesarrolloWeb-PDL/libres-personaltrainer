import { initTRPC } from "@trpc/server";

/**
 * tRPC context — created per request.
 */
export const createTRPCContext = async (_opts?: unknown): Promise<object> => {
  return {};
};

const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create();

/** Reusable router and procedure helpers */
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
