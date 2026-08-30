import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

interface MuscleGroupSeed {
  name: string;
  nameEs: string;
  category: string;
}

interface EquipmentSeed {
  name: string;
  nameEs: string;
}

interface MediaSeed {
  type: string;
  url: string;
  isPrimary: boolean;
}

interface ExerciseSeed {
  name: string;
  nameEs: string;
  instructions: string;
  muscleGroup: string;
  equipment: string;
  media: MediaSeed[];
}

function loadJson<T>(filename: string): T[] {
  const filePath = join(__dirname, filename);
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T[];
}

async function seedMuscleGroups() {
  const data = loadJson<MuscleGroupSeed>("muscle-groups.json");
  console.log(`  Seeding ${data.length} muscle groups...`);

  for (const mg of data) {
    await prisma.muscleGroup.upsert({
      where: { name: mg.name },
      update: { nameEs: mg.nameEs, category: mg.category },
      create: { name: mg.name, nameEs: mg.nameEs, category: mg.category },
    });
  }
  console.log(`  ✓ Muscle groups seeded`);
}

async function seedEquipment() {
  const data = loadJson<EquipmentSeed>("equipment.json");
  console.log(`  Seeding ${data.length} equipment items...`);

  for (const eq of data) {
    await prisma.equipment.upsert({
      where: { name: eq.name },
      update: { nameEs: eq.nameEs },
      create: { name: eq.name, nameEs: eq.nameEs },
    });
  }
  console.log(`  ✓ Equipment seeded`);
}

async function seedExercises() {
  const data = loadJson<ExerciseSeed>("exercises.json");
  console.log(`  Seeding ${data.length} exercises...`);

  for (const ex of data) {
    const exercise = await prisma.exercise.upsert({
      where: { name: ex.name },
      update: {
        nameEs: ex.nameEs,
        instructions: ex.instructions,
      },
      create: {
        name: ex.name,
        nameEs: ex.nameEs,
        instructions: ex.instructions,
      },
    });

    // Link muscle group
    if (ex.muscleGroup) {
      const mg = await prisma.muscleGroup.findUnique({
        where: { name: ex.muscleGroup },
      });
      if (mg) {
        await prisma.exercise.update({
          where: { id: exercise.id },
          data: { muscleGroupId: mg.id },
        });
      }
    }

    // Link equipment
    if (ex.equipment) {
      const eq = await prisma.equipment.findUnique({
        where: { name: ex.equipment },
      });
      if (eq) {
        await prisma.exercise.update({
          where: { id: exercise.id },
          data: { equipmentId: eq.id },
        });
      }
    }

    // Create media entries
    for (const media of ex.media) {
      await prisma.exerciseMedia.create({
        data: {
          exerciseId: exercise.id,
          type: media.type,
          url: media.url,
          isPrimary: media.isPrimary,
        },
      });
    }
  }
  console.log(`  ✓ Exercises seeded`);
}

async function main() {
  console.log("🌱 Starting seed...");

  await seedMuscleGroups();
  await seedEquipment();
  await seedExercises();

  const counts = await Promise.all([
    prisma.muscleGroup.count(),
    prisma.equipment.count(),
    prisma.exercise.count(),
    prisma.exerciseMedia.count(),
  ]);

  console.log("\n📊 Seed complete:");
  console.log(`   Muscle groups: ${counts[0]}`);
  console.log(`   Equipment:     ${counts[1]}`);
  console.log(`   Exercises:     ${counts[2]}`);
  console.log(`   Media entries: ${counts[3]}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
