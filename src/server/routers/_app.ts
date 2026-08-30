import { createTRPCRouter } from "../trpc";
import { exerciseRouter } from "./exercise";
import { userRouter } from "./user";
import { onboardingRouter } from "./onboarding";
import { programRouter } from "./program";
import { sessionRouter } from "./session";
import { progressRouter } from "./progress";
import { volumeRouter } from "./volume";

/**
 * Root tRPC router — aggregates all feature routers.
 */
export const appRouter = createTRPCRouter({
  exercise: exerciseRouter,
  user: userRouter,
  onboarding: onboardingRouter,
  program: programRouter,
  session: sessionRouter,
  progress: progressRouter,
  volume: volumeRouter,
});

export type AppRouter = typeof appRouter;
