import type {
  UserRepository,
  UserRecord,
} from "@/lib/ports/user-repository";
import { prisma } from "../client";

/**
 * Prisma adapter for the UserRepository port.
 *
 * Implements user data access using Prisma + SQLite.
 */
export class PrismaUserAdapter implements UserRepository {
  async findById(id: string): Promise<UserRecord | null> {
    return prisma.user.findUnique({
      where: { id },
    }) as Promise<UserRecord | null>;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    return prisma.user.findUnique({
      where: { email },
    }) as Promise<UserRecord | null>;
  }

  async create(data: {
    email: string;
    name?: string;
  }): Promise<UserRecord> {
    return prisma.user.create({
      data,
    }) as Promise<UserRecord>;
  }
}
