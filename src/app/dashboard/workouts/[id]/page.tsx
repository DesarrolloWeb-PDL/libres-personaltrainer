"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api/trpc-client";
import { WorkoutLogger } from "@/components/workout/workout-logger";

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
        <p className="text-zinc-400">Loading workout...</p>
      </div>
    );
  }

  if (!session.data) {
    return (
      <div className="py-20 text-center">
        <p className="text-zinc-400">Workout session not found.</p>
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
    const userId = session.data?.userId ?? "user-1";
    await completeSession.mutateAsync({ id: sessionId, userId });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push("/dashboard/workouts")}
          className="mb-2 text-sm text-blue-500 hover:text-blue-400"
        >
          ← Back to Workouts
        </button>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-blue-500 rounded-full" />
            <div>
              <h1 className="text-2xl font-bold text-zinc-50">
                {session.data.day?.name ?? "Workout"}
              </h1>
              <p className="text-sm text-zinc-400">
                Started at {new Date(session.data.startedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
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
