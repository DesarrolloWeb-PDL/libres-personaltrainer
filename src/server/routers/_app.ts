import { createTRPCRouter } from "../trpc";
import { exerciseRouter } from "./exercise";
import { userRouter } from "./user";
import { onboardingRouter } from "./onboarding";

/**
 * Root tRPC router — aggregates all feature routers.
 */
export const appRouter = createTRPCRouter({
  exercise: exerciseRouter,
  user: userRouter,
  onboarding: onboardingRouter,
});

export type AppRouter = typeof appRouter;
