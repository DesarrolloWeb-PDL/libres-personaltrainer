import { createTRPCRouter, publicProcedure } from "../trpc";

/**
 * Coach tRPC router — read-only availability checks for the AI coach.
 */
export const coachRouter = createTRPCRouter({
  /** Returns whether the coach feature is enabled server-side. */
  getAvailability: publicProcedure.query(() => ({
    enabled: !!process.env.OPENAI_API_KEY,
  })),
});
