import { createTRPCRouter } from "../trpc";
import { exerciseRouter } from "./exercise";
import { userRouter } from "./user";
import { onboardingRouter } from "./onboarding";
import { programRouter } from "./program";
import { sessionRouter } from "./session";

/**
 * Root tRPC router — aggregates all feature routers.
 */
export const appRouter = createTRPCRouter({
  exercise: exerciseRouter,
  user: userRouter,
  onboarding: onboardingRouter,
  program: programRouter,
  session: sessionRouter,
});

export type AppRouter = typeof appRouter;
