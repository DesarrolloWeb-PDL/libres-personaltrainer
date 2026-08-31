import { createTRPCRouter } from "../trpc";
import { exerciseRouter } from "./exercise";
import { muscleGroupRouter } from "./muscleGroup";
import { equipmentRouter } from "./equipment";
import { userRouter } from "./user";
import { onboardingRouter } from "./onboarding";
import { programRouter } from "./program";
import { sessionRouter } from "./session";
import { progressRouter } from "./progress";
import { volumeRouter } from "./volume";
import { nutritionRouter } from "./nutrition";

/**
 * Root tRPC router — aggregates all feature routers.
 */
export const appRouter = createTRPCRouter({
  exercise: exerciseRouter,
  muscleGroup: muscleGroupRouter,
  equipment: equipmentRouter,
  user: userRouter,
  onboarding: onboardingRouter,
  program: programRouter,
  session: sessionRouter,
  progress: progressRouter,
  volume: volumeRouter,
  nutrition: nutritionRouter,
});

export type AppRouter = typeof appRouter;
