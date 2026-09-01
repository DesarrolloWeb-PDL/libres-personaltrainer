import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { PrismaUserAdapter } from "@/lib/infrastructure/prisma/adapters/user";

const userRepo = new PrismaUserAdapter();

/**
 * User tRPC router — basic user operations.
 */
export const userRouter = createTRPCRouter({
  /** Get user by ID */
  getById: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => {
    return userRepo.findById(input.id);
  }),

  /** Get user by email */
  getByEmail: publicProcedure.input(z.object({ email: z.string().email() })).query(({ input }) => {
    return userRepo.findByEmail(input.email);
  }),

  /** Create a new user */
  create: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
      }),
    )
    .mutation(({ input }) => {
      return userRepo.create(input);
    }),
});
