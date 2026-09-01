"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api/trpc-client";
import { WorkoutLogger } from "@/components/workout/workout-logger";
import { useFormattedDate } from "@/hooks/use-client-date";
import { useSession } from "next-auth/react";

/** Renders a formatted time from an ISO string, avoiding hydration mismatch. */
function SessionTime({ startedAt }: { startedAt: string }) {
  const time = useFormattedDate(startedAt, "time");
  return <>{time || "\u00A0"}</>;
}

export default function WorkoutSessionPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const workoutSession = api.session.getById.useQuery({ id: sessionId });
  const logSet = api.session.logSet.useMutation({
    onSuccess: () => workoutSession.refetch(),
  });
  const completeSession = api.session.complete.useMutation({
    onSuccess: () => router.push("/dashboard/workouts"),
  });

  if (workoutSession.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-zinc-400">Loading workout...</p>
      </div>
    );
  }

  if (!workoutSession.data) {
    return (
      <div className="py-20 text-center">
        <p className="text-zinc-400">Workout session not found.</p>
      </div>
    );
  }

  const exercises = workoutSession.data.day?.exercises ?? [];

  const handleLogSet = async (
    setId: string,
    data: { reps: number; weight: number; rpe: number },
  ) => {
    await logSet.mutateAsync({ setId, ...data });
  };

  const handleCompleteWorkout = async () => {
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
                {workoutSession.data.day?.name ?? "Workout"}
              </h1>
              <p className="text-sm text-zinc-400">
                Started at <SessionTime startedAt={workoutSession.data.startedAt} />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Workout Logger */}
      <WorkoutLogger
        exercises={exercises}
        userId={userId}
        onLogSet={handleLogSet}
        onCompleteWorkout={handleCompleteWorkout}
        onSubstitutionApplied={() => workoutSession.refetch()}
      />
    </div>
  );
}
