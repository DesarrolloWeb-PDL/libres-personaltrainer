"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/trpc-client";
import { useFormattedDate } from "@/hooks/use-client-date";
import { useSession } from "next-auth/react";

/** Renders a formatted date/time from an ISO string, avoiding hydration mismatch. */
function FormattedDate({
  isoString,
  format,
}: {
  isoString: string;
  format: "date" | "time" | "datetime";
}) {
  const formatted = useFormattedDate(isoString, format);
  return <>{formatted || "\u00A0"}</>;
}

export default function WorkoutsPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  const router = useRouter();
  const currentProgram = api.program.getCurrent.useQuery({ userId });
  const sessions = api.session.listByUser.useQuery({ userId });
  const activeSession = api.session.getActive.useQuery({ userId });

  const programDays = currentProgram.data?.days ?? [];
  const completedSessions = sessions.data?.filter((s) => s.completedAt) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Workouts</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Start a session or review your training history.
        </p>
      </div>

      {/* Active Session Banner */}
      {activeSession.data && (
        <div className="rounded-xl border border-lime-500/30 bg-lime-500/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-lime-500 rounded-full" />
            <div className="flex-1">
              <p className="text-sm font-medium text-lime-400">Active Workout in Progress</p>
              <p className="text-xs text-zinc-400">
                {activeSession.data.day?.name ?? "Workout"} • Started{" "}
                <FormattedDate isoString={activeSession.data.startedAt} format="time" />
              </p>
            </div>
            <Link
              href={`/dashboard/workouts/${activeSession.data.id}`}
              className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-bold text-zinc-900 hover:bg-lime-400 transition-colors"
            >
              Resume
            </Link>
          </div>
        </div>
      )}

      {/* Start New Workout */}
      {programDays.length > 0 && !activeSession.data && (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-10 bg-blue-500 rounded-full" />
            <div>
              <h2 className="font-semibold text-zinc-50">Start a Workout</h2>
              <p className="text-xs text-zinc-400">Choose a day from your current program.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
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
        <div className="rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900 p-6 text-center">
          <p className="text-sm text-zinc-400">
            No training program found. Generate one from the dashboard first.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block rounded-xl bg-blue-500 px-4 py-2 text-sm font-bold text-white hover:bg-blue-400 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      )}

      {/* Workout History */}
      {completedSessions.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-zinc-50">History</h2>
          <div className="space-y-2">
            {completedSessions.map((session) => (
              <div key={session.id} className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-10 bg-zinc-700 rounded-full" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-zinc-50">Workout Session</h3>
                    <p className="text-xs text-zinc-400">
                      <FormattedDate isoString={session.startedAt} format="datetime" />
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/workouts/${session.id}`}
                    className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
      className="rounded-xl bg-zinc-800 border border-zinc-700 p-4 text-left transition hover:border-blue-500/50 hover:bg-zinc-700 disabled:opacity-50"
    >
      <p className="text-xs text-zinc-500">Day {dayNumber}</p>
      <p className="font-medium text-zinc-100">{name}</p>
      <p className="mt-1 text-xs text-zinc-400">{exerciseCount} exercises</p>
    </button>
  );
}
