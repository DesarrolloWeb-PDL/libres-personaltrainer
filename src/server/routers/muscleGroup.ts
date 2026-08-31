import { createTRPCRouter, publicProcedure } from "../trpc";
import { prisma } from "@/lib/infrastructure/prisma/client";

/**
 * MuscleGroup tRPC router — list all muscle groups.
 */
export const muscleGroupRouter = createTRPCRouter({
  list: publicProcedure.query(() => {
    return prisma.muscleGroup.findMany({
      orderBy: { name: "asc" },
    });
  }),
});
