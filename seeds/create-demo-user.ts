import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@libres.app" },
    update: {},
    create: {
      email: "demo@libres.app",
      name: "Demo User",
    },
  });
  console.log("User created:", user.id, user.name);

  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      age: 28,
      experienceLevel: "intermediate",
      goals: "muscle_gain,strength",
      equipment: "full_gym",
    },
  });
  console.log("Profile created:", profile.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
