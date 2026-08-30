"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/trpc-client";

const userId = "cmtg8qhsf0000pgkzcm8m2mma";

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
  const recentSessions = sessions.data?.slice(-5).reverse() ?? [];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-10 bg-blue-500 rounded-full" />
          <div>
            <h1 className="text-2xl font-bold text-zinc-50">Welcome back</h1>
            <p className="text-sm text-zinc-400">
              Track your training progress and crush your goals.
            </p>
          </div>
        </div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-zinc-800 px-4 py-1.5">
          <span className="text-sm">🔥</span>
          <span className="text-sm font-medium text-zinc-300">0 day streak</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-blue-500 rounded-full" />
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Total Workouts
              </p>
              <p className="text-3xl font-black text-zinc-50">
                {completedSessions}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-lime-500 rounded-full" />
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Sessions
              </p>
              <p className="text-3xl font-black text-zinc-50">
                {completedSessions}/{totalSessions}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-amber-500 rounded-full" />
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Program
              </p>
              <p className="text-lg font-bold text-zinc-50 truncate">
                {currentProgram.data?.name ?? "None"}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-rose-500 rounded-full" />
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Streak
              </p>
              <p className="text-3xl font-black text-zinc-50">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <Link
        href="/dashboard/workouts"
        className="block w-full rounded-xl bg-blue-500 py-4 text-center text-lg font-bold text-white hover:bg-blue-400 active:bg-blue-600 transition-colors"
      >
        Start Workout
      </Link>

      {/* Current Program */}
      {currentProgram.data && currentProgram.data.days && currentProgram.data.days.length > 0 && (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-10 bg-blue-500 rounded-full" />
            <div>
              <h2 className="font-semibold text-zinc-50">{currentProgram.data.name}</h2>
              <p className="text-xs text-zinc-400">
                {currentProgram.data.splitType?.replace(/_/g, " ")} • Started{" "}
                {currentProgram.data.startDate
                  ? new Date(currentProgram.data.startDate).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {currentProgram.data.days.map((day) => (
              <div
                key={day.id}
                className="rounded-lg bg-zinc-800 border border-zinc-700 p-3 text-center"
              >
                <p className="text-xs text-zinc-500">Day {day.dayNumber}</p>
                <p className="text-sm font-medium text-zinc-100">
                  {day.name ?? "Workout"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {day.exercises.length} exercises
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Program CTA */}
      {!currentProgram.data && (
        <div className="rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900 p-6 text-center">
          <h2 className="text-lg font-semibold text-zinc-50">
            No Training Program
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Generate a personalized training program based on your profile and goals.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="mt-4 rounded-xl bg-blue-500 px-6 py-3 font-bold text-white hover:bg-blue-400 disabled:opacity-50 transition-colors"
          >
            {generating ? "Generating..." : "Generate Program"}
          </button>
        </div>
      )}

      {/* Recent Workouts */}
      {recentSessions.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-zinc-50">Recent Workouts</h2>
          <div className="space-y-2">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="rounded-xl bg-zinc-900 border border-zinc-800 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-1 h-10 bg-lime-500 rounded-full" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-zinc-50">
                      Workout Session
                    </h3>
                    <p className="text-sm text-zinc-400">
                      {new Date(session.startedAt).toLocaleDateString()} at{" "}
                      {new Date(session.startedAt).toLocaleTimeString()}
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
