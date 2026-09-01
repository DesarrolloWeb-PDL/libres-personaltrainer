import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "@/lib/auth";
import { Session } from "next-auth";

/**
 * tRPC context — created per request.
 */
export const createTRPCContext = async (
  _opts?: unknown,
): Promise<{
  session: Session | null;
}> => {
  const session = await auth();
  return { session };
};

const t = initTRPC.context<Awaited<ReturnType<typeof createTRPCContext>>>().create();

/** Reusable router and procedure helpers */
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});
