import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const API_BASE = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0";

interface ExerciseGifDB {
  id: number;
  slug: string;
  name: string;
  muscle: string;
  bodyPart: string;
  equipment: string;
  category: string;
  secondaryMuscles: string[];
  instructions: string[];
  gifUrl: string;
}

const MUSCLE_MAP: Record<string, string> = {
  abs: "Abs",
  biceps: "Biceps",
  calves: "Calves",
  delts: "Shoulders",
  forearms: "Forearms",
  glutes: "Glutes",
  hamstrings: "Hamstrings",
  lats: "Lats",
  pectorals: "Chest",
  quads: "Quadriceps",
  traps: "Traps",
  triceps: "Triceps",
  "upper-back": "Back",
};

const EQUIPMENT_MAP: Record<string, string> = {
  band: "Resistance Band",
  barbell: "Barbell",
  bodyweight: "Bodyweight",
  cable: "Cable Machine",
  dumbbell: "Dumbbell",
  "ez-bar": "EZ Bar",
  kettlebell: "Kettlebell",
  machine: "Smith Machine",
  smith: "Smith Machine",
};

async function fetchExercises(): Promise<ExerciseGifDB[]> {
  console.log("Fetching exercises from API...");
  const response = await fetch(`${API_BASE}/api/es/exercises.json`);

  if (!response.ok) {
    throw new Error(`Failed to fetch exercises: ${response.statusText}`);
  }

  const data = await response.json();
  // API returns { count: number, exercises: ExerciseGifDB[] }
  const exercises = data.exercises || data;
  console.log(`  Fetched ${exercises.length} exercises`);
  return exercises;
}

async function main() {
  console.log("🏋️ Importing exercises from ExerciseGymGifsDB...\n");

  const exercises = await fetchExercises();

  // Get existing muscle groups and equipment
  const existingMuscleGroups = await prisma.muscleGroup.findMany();
  const existingEquipment = await prisma.equipment.findMany();

  const muscleGroupMap = new Map(existingMuscleGroups.map((mg) => [mg.name, mg.id]));
  const equipmentMap = new Map(existingEquipment.map((eq) => [eq.name, eq.id]));

  console.log(`  Found ${existingMuscleGroups.length} muscle groups in DB`);
  console.log(`  Found ${existingEquipment.length} equipment items in DB\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  // Batch process exercises
  const BATCH_SIZE = 50;
  for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
    const batch = exercises.slice(i, i + BATCH_SIZE);

    for (const ex of batch) {
      try {
        // Map muscle group
        const muscleGroupName = MUSCLE_MAP[ex.muscle];
        const muscleGroupId = muscleGroupName
          ? (muscleGroupMap.get(muscleGroupName) ?? null)
          : null;

        // Map equipment
        const equipmentName = EQUIPMENT_MAP[ex.equipment];
        const equipmentId = equipmentName ? (equipmentMap.get(equipmentName) ?? null) : null;

        // Check if exercise exists by name
        const existing = await prisma.exercise.findUnique({
          where: { name: ex.name },
        });

        if (existing) {
          // Update existing exercise
          await prisma.exercise.update({
            where: { id: existing.id },
            data: {
              nameEs: ex.name,
              slug: ex.slug,
              instructions: ex.instructions.join("\n"),
              gifUrl: ex.gifUrl,
              bodyPart: ex.bodyPart,
              category: ex.category,
              muscle: ex.muscle,
              muscleGroupId,
              equipmentId,
            },
          });
          updated++;
        } else {
          // Create new exercise
          await prisma.exercise.create({
            data: {
              name: ex.name,
              nameEs: ex.name,
              slug: ex.slug,
              instructions: ex.instructions.join("\n"),
              gifUrl: ex.gifUrl,
              bodyPart: ex.bodyPart,
              category: ex.category,
              muscle: ex.muscle,
              muscleGroupId,
              equipmentId,
            },
          });
          created++;
        }
      } catch (error) {
        console.error(`  Error processing "${ex.name}":`, error);
        skipped++;
      }
    }

    console.log(`  Progress: ${Math.min(i + BATCH_SIZE, exercises.length)}/${exercises.length}`);
  }

  console.log("\n📊 Import complete:");
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total:   ${exercises.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Import failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
