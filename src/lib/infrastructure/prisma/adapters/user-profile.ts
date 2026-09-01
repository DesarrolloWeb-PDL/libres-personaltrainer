import type {
  ProfileRepository,
  ProfileRecord,
  CreateProfileData,
  UpdateProfileData,
} from "@/lib/ports/profile-repository";
import { prisma } from "../client";

/**
 * Prisma adapter for the ProfileRepository port.
 *
 * Implements profile data access using Prisma + SQLite.
 * Handles profile creation during onboarding and subsequent updates.
 */
export class PrismaProfileAdapter implements ProfileRepository {
  async findByUserId(userId: string): Promise<ProfileRecord | null> {
    return prisma.profile.findUnique({
      where: { userId },
    }) as Promise<ProfileRecord | null>;
  }

  async create(data: CreateProfileData): Promise<ProfileRecord> {
    return prisma.profile.create({
      data,
    }) as Promise<ProfileRecord>;
  }

  async update(userId: string, data: UpdateProfileData): Promise<ProfileRecord> {
    return prisma.profile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    }) as Promise<ProfileRecord>;
  }
}
