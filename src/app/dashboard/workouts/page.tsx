"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/trpc-client";

// TODO: Replace with real auth session
const userId = "cmtg8qhsf0000pgkzcm8m2mma";

/**
 * Workout list page — shows all past sessions and current active session.
 */
export default function WorkoutsPage() {
  const router = useRouter();
  const currentProgram = api.program.getCurrent.useQuery({ userId });
  const sessions = api.session.listByUser.useQuery({ userId });
  const activeSession = api.session.getActive.useQuery({ userId });

  const programDays = currentProgram.data?.days ?? [];
  const completedSessions = sessions.data?.filter((s) => s.completedAt) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Workouts
        </h1>
        <p className="mt-1 text-neutral-500 dark:text-neutral-400">
          Start a session or review your training history.
        </p>
      </div>

      {/* Active Session Banner */}
      {activeSession.data && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Active Workout in Progress
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300">
                {activeSession.data.day?.name ?? "Workout"} • Started{" "}
                {new Date(activeSession.data.startedAt).toLocaleTimeString()}
              </p>
            </div>
            <Link
              href={`/dashboard/workouts/${activeSession.data.id}`}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Resume
            </Link>
          </div>
        </div>
      )}

      {/* Start New Workout */}
      {programDays.length > 0 && !activeSession.data && (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Start a Workout
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Choose a day from your current program.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {programDays.map((day) => (
              <StartWorkoutCard
                key={day.id}
                dayId={day.id}
                dayNumber={day.dayNumber}
                name={day.name ?? `Day ${day.dayNumber}`}
                exerciseCount={day.exercises.length}
                programId={currentProgram.data!.id}
                userId={userId}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Program */}
      {!currentProgram.data && (
        <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-white p-8 text-center dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-neutral-500 dark:text-neutral-400">
            No training program found. Generate one from the dashboard first.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Go to Dashboard
          </Link>
        </div>
      )}

      {/* Workout History */}
      {completedSessions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            History
          </h2>
          <div className="mt-3 space-y-2">
            {completedSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Workout Session
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {new Date(session.startedAt).toLocaleDateString()} at{" "}
                    {new Date(session.startedAt).toLocaleTimeString()}
                  </p>
                </div>
                <Link
                  href={`/dashboard/workouts/${session.id}`}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * StartWorkoutCard — creates a session and navigates to it.
 */
function StartWorkoutCard({
  dayId,
  dayNumber,
  name,
  exerciseCount,
  programId,
  userId,
}: {
  dayId: string;
  dayNumber: number;
  name: string;
  exerciseCount: number;
  programId: string;
  userId: string;
}) {
  const startSession = api.session.start.useMutation();
  const router = useRouter();

  const handleStart = async () => {
    const session = await startSession.mutateAsync({
      userId,
      programId,
      dayId,
    });
    router.push(`/dashboard/workouts/${session.id}`);
  };

  return (
    <button
      onClick={handleStart}
      disabled={startSession.isPending}
      className="rounded-lg border border-neutral-200 bg-white p-4 text-left transition hover:border-blue-300 hover:shadow-sm disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-blue-600"
    >
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Day {dayNumber}
      </p>
      <p className="font-medium text-neutral-900 dark:text-neutral-100">
        {name}
      </p>
      <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
        {exerciseCount} exercises
      </p>
    </button>
  );
}
