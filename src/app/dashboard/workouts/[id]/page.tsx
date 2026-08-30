"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api/trpc-client";
import { WorkoutLogger } from "@/components/workout/workout-logger";

/**
 * Active workout session page — shows exercises and allows logging sets.
 */
export default function WorkoutSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const session = api.session.getById.useQuery({ id: sessionId });
  const logSet = api.session.logSet.useMutation({
    onSuccess: () => session.refetch(),
  });
  const completeSession = api.session.complete.useMutation({
    onSuccess: () => router.push("/dashboard/workouts"),
  });

  if (session.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-neutral-500 dark:text-neutral-400">Loading workout...</p>
      </div>
    );
  }

  if (!session.data) {
    return (
      <div className="py-20 text-center">
        <p className="text-neutral-500 dark:text-neutral-400">
          Workout session not found.
        </p>
      </div>
    );
  }

  const exercises = session.data.day?.exercises ?? [];

  const handleLogSet = async (
    setId: string,
    data: { reps: number; weight: number; rpe: number },
  ) => {
    await logSet.mutateAsync({ setId, ...data });
  };

  const handleCompleteWorkout = async () => {
    await completeSession.mutateAsync({ id: sessionId });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push("/dashboard/workouts")}
          className="mb-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          ← Back to Workouts
        </button>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {session.data.day?.name ?? "Workout"}
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Started at {new Date(session.data.startedAt).toLocaleTimeString()}
        </p>
      </div>

      {/* Workout Logger */}
      <WorkoutLogger
        exercises={exercises}
        onLogSet={handleLogSet}
        onCompleteWorkout={handleCompleteWorkout}
      />
    </div>
  );
}
