import { createTRPCRouter, publicProcedure } from "../trpc";
import { prisma } from "@/lib/infrastructure/prisma/client";

/**
 * Equipment tRPC router — list all equipment.
 */
export const equipmentRouter = createTRPCRouter({
  list: publicProcedure.query(() => {
    return prisma.equipment.findMany({
      orderBy: { name: "asc" },
    });
  }),
});
