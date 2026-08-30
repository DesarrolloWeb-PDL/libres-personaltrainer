"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/trpc-client";

// TODO: Replace with real auth session in Phase 9
const userId = "user-placeholder";

/**
 * Dashboard page — shows current program, quick stats, and generate button.
 */
export default function DashboardPage() {
  const [generating, setGenerating] = useState(false);

  const currentProgram = api.program.getCurrent.useQuery({ userId });
  const sessions = api.session.listByUser.useQuery({ userId });
  const generateProgram = api.program.generate.useMutation({
    onSuccess: () => {
      currentProgram.refetch();
      setGenerating(false);
    },
    onError: () => setGenerating(false),
  });

  const handleGenerate = () => {
    setGenerating(true);
    generateProgram.mutate({
      userId,
      name: "My Training Program",
      trainingFrequency: 4,
      experienceLevel: "intermediate",
    });
  };

  const completedSessions =
    sessions.data?.filter((s) => s.completedAt !== null).length ?? 0;
  const totalSessions = sessions.data?.length ?? 0;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Welcome back
        </h1>
        <p className="mt-1 text-neutral-500 dark:text-neutral-400">
          Track your training progress and manage your programs.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Current Program
          </p>
          <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {currentProgram.data?.name ?? "None"}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Split Type
          </p>
          <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {currentProgram.data?.splitType?.replace(/_/g, " ").toUpperCase() ?? "—"}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Workouts Completed
          </p>
          <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {completedSessions}/{totalSessions}
          </p>
        </div>
      </div>

      {/* Current Program */}
      {currentProgram.data ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {currentProgram.data.name}
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {currentProgram.data.splitType?.replace(/_/g, " ")} • Started{" "}
            {currentProgram.data.startDate
              ? new Date(currentProgram.data.startDate).toLocaleDateString()
              : "—"}
          </p>

          {/* Weekly Schedule */}
          {currentProgram.data.days && currentProgram.data.days.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Weekly Schedule
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {currentProgram.data.days.map((day) => (
                  <div
                    key={day.id}
                    className="rounded border border-neutral-100 bg-neutral-50 p-3 text-center dark:border-neutral-800 dark:bg-neutral-800"
                  >
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Day {day.dayNumber}
                    </p>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                      {day.name ?? "Workout"}
                    </p>
                    <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                      {day.exercises.length} exercises
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-4 flex gap-3">
            <Link
              href="/dashboard/workouts"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Start Workout
            </Link>
          </div>
        </div>
      ) : (
        /* No Program — Generate CTA */
        <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-white p-8 text-center dark:border-neutral-700 dark:bg-neutral-900">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            No Training Program
          </h2>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">
            Generate a personalized training program based on your profile and goals.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="mt-4 rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate Program"}
          </button>
        </div>
      )}
    </div>
  );
}
