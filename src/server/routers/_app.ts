import { createTRPCRouter } from "../trpc";
import { exerciseRouter } from "./exercise";

/**
 * Root tRPC router — aggregates all feature routers.
 */
export const appRouter = createTRPCRouter({
  exercise: exerciseRouter,
});

export type AppRouter = typeof appRouter;
