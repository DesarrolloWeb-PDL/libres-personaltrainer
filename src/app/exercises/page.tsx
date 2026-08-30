import { prisma } from "@/lib/infrastructure/prisma/client";
import { ExerciseBrowser } from "@/components/exercise/exercise-browser";

export const dynamic = "force-dynamic";

/**
 * Exercise browser page — server component that fetches data and renders the browser.
 */
export default async function ExercisesPage() {
  const [exercises, muscleGroups, equipment] = await Promise.all([
    prisma.exercise.findMany({
      include: { muscleGroup: true, equipment: true, media: true },
      orderBy: { name: "asc" },
    }),
    prisma.muscleGroup.findMany({ orderBy: { name: "asc" } }),
    prisma.equipment.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        Exercise Database
      </h1>
      <ExerciseBrowser
        exercises={exercises}
        muscleGroups={muscleGroups}
        equipment={equipment}
      />
    </main>
  );
}
