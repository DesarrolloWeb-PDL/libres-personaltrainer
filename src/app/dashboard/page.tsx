"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/trpc-client";
import { useClientDate, useFormattedDate } from "@/hooks/use-client-date";

/** Renders a formatted time from an ISO string, avoiding hydration mismatch. */
function SessionTime({ startedAt }: { startedAt: string }) {
  const time = useFormattedDate(startedAt, "time");
  return <>{time || "\u00A0"}</>;
}

/** Renders a formatted date from an ISO string, avoiding hydration mismatch. */
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

const userId = "cmtg8qhsf0000pgkzcm8m2mma";

const PRESET_PROGRAMS = [
  {
    id: "ppl",
    name: "Push / Pull / Legs",
    frequency: 6,
    experience: "intermediate" as const,
    description: "Best for muscle gain. Hit each muscle 2x/week.",
    icon: "💪",
    split: "push_pull_legs",
  },
  {
    id: "upper_lower",
    name: "Upper / Lower",
    frequency: 4,
    experience: "intermediate" as const,
    description: "Balanced training. Great for most goals.",
    icon: "⚖️",
    split: "upper_lower",
  },
  {
    id: "full_body",
    name: "Full Body",
    frequency: 3,
    experience: "beginner" as const,
    description: "Best for beginners or limited time.",
    icon: "🏋️",
    split: "full_body",
  },
];

export default function DashboardPage() {
  const [generating, setGenerating] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const clientDate = useClientDate();

  const currentProgram = api.program.getCurrent.useQuery({ userId });
  const sessions = api.session.listByUser.useQuery({ userId });
  const activeSession = api.session.getActive.useQuery({ userId });

  const generateProgram = api.program.generate.useMutation({
    onSuccess: () => {
      currentProgram.refetch();
      setGenerating(false);
      setShowPresets(false);
    },
    onError: () => setGenerating(false),
  });

  const handleGeneratePreset = (preset: (typeof PRESET_PROGRAMS)[number]) => {
    setGenerating(true);
    generateProgram.mutate({
      userId,
      name: preset.name,
      trainingFrequency: preset.frequency,
      experienceLevel: preset.experience,
    });
  };

  const completedSessions =
    sessions.data?.filter((s) => s.completedAt !== null).length ?? 0;
  const totalSessions = sessions.data?.length ?? 0;

  // Determine today's workout — only after client hydration to avoid mismatch
  const programDays = currentProgram.data?.days ?? [];
  const today = clientDate?.getDay() ?? 0;
  const todayIndex = today === 0 ? 6 : today - 1; // Convert to 0=Mon...6=Sun
  const todayWorkout =
    programDays.length > 0 ? programDays[todayIndex % programDays.length] : null;

  // Calculate weekly progress — only after client hydration
  const weekSessions = (() => {
    if (!clientDate || !sessions.data) return 0;
    const weekStart = new Date(clientDate);
    weekStart.setDate(clientDate.getDate() - clientDate.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    return sessions.data.filter(
      (s) => s.completedAt && new Date(s.completedAt) >= weekStart,
    ).length;
  })();
  const targetSessions = programDays.length;

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
          <span className="text-sm font-medium text-zinc-300">
            {completedSessions} workouts completed
          </span>
        </div>
      </div>

      {/* Today's Workout - PROMINENT */}
      {currentProgram.data && todayWorkout && !activeSession.data && (
        <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-10 bg-blue-500 rounded-full" />
            <div>
              <p className="text-xs font-medium text-blue-400 uppercase tracking-wider">
                Today&apos;s Workout
              </p>
              <h2 className="text-xl font-bold text-zinc-50">
                {todayWorkout.name ?? `Day ${todayWorkout.dayNumber}`}
              </h2>
            </div>
          </div>
          <p className="text-sm text-zinc-400 mb-4">
            {todayWorkout.exercises.length} exercises • ~
            {todayWorkout.exercises.reduce((acc, e) => acc + (e.sets ?? 3) * ((e.reps ?? 10) * 3 + 90), 0) / 60 | 0} min
          </p>
          <Link
            href="/dashboard/workouts"
            className="block w-full rounded-xl bg-blue-500 py-3 text-center text-lg font-bold text-white hover:bg-blue-400 active:bg-blue-600 transition-colors"
          >
            Start Today&apos;s Workout
          </Link>
        </div>
      )}

      {/* Active Session Banner */}
      {activeSession.data && (
        <div className="rounded-xl border border-lime-500/30 bg-lime-500/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-lime-500 rounded-full" />
            <div className="flex-1">
              <p className="text-sm font-medium text-lime-400">
                Active Workout in Progress
              </p>
              <p className="text-xs text-zinc-400">
                {activeSession.data.day?.name ?? "Workout"} • Started{" "}
                <SessionTime startedAt={activeSession.data.startedAt} />
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
                This Week
              </p>
              <p className="text-3xl font-black text-zinc-50">
                {weekSessions}/{targetSessions}
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
                Split
              </p>
              <p className="text-lg font-bold text-zinc-50 truncate">
                {currentProgram.data?.splitType?.replace(/_/g, " ") ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Program Overview */}
      {currentProgram.data && programDays.length > 0 && (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-10 bg-blue-500 rounded-full" />
            <div className="flex-1">
              <h2 className="font-semibold text-zinc-50">{currentProgram.data.name}</h2>
              <p className="text-xs text-zinc-400">
                {currentProgram.data.splitType?.replace(/_/g, " ")} • Started{" "}
                {currentProgram.data.startDate ? (
                  <FormattedDate isoString={currentProgram.data.startDate} format="date" />
                ) : (
                  "—"
                )}
              </p>
            </div>
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
            >
              {showPresets ? "Close" : "Change Program"}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {programDays.map((day) => {
              const isToday =
                todayIndex % programDays.length === day.dayNumber - 1;
              return (
                <div
                  key={day.id}
                  className={`rounded-lg border p-3 text-center ${
                    isToday
                      ? "bg-blue-500/20 border-blue-500/50"
                      : "bg-zinc-800 border-zinc-700"
                  }`}
                >
                  <p className="text-xs text-zinc-500">Day {day.dayNumber}</p>
                  <p className={`text-sm font-medium ${isToday ? "text-blue-400" : "text-zinc-100"}`}>
                    {day.name ?? "Workout"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {day.exercises.length} exercises
                  </p>
                </div>
              );
            })}
          </div>
          <Link
            href="/dashboard/workouts"
            className="mt-4 block w-full rounded-xl bg-zinc-800 border border-zinc-700 py-3 text-center text-sm font-bold text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            View All Workouts
          </Link>
        </div>
      )}

      {/* No Program → Show Preset Selection */}
      {!currentProgram.data && !showPresets && (
        <div className="rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900 p-6 text-center">
          <h2 className="text-lg font-semibold text-zinc-50">
            No Training Program
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Choose a preset program to get started. It takes 10 seconds.
          </p>
          <button
            onClick={() => setShowPresets(true)}
            className="mt-4 rounded-xl bg-blue-500 px-6 py-3 font-bold text-white hover:bg-blue-400 transition-colors"
          >
            Choose Program
          </button>
        </div>
      )}

      {/* Preset Program Selection */}
      {(showPresets || !currentProgram.data) && (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-10 bg-blue-500 rounded-full" />
              <div>
                <h2 className="font-semibold text-zinc-50">Choose Your Program</h2>
                <p className="text-xs text-zinc-400">Pick a training split that fits your schedule.</p>
              </div>
            </div>
            <button
              onClick={() => setShowPresets(false)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label="Close preset selection"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-3">
            {PRESET_PROGRAMS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleGeneratePreset(preset)}
                disabled={generating}
                className="w-full rounded-xl bg-zinc-800 border border-zinc-700 p-4 text-left transition hover:border-blue-500/50 hover:bg-zinc-700 disabled:opacity-50"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{preset.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-zinc-100">{preset.name}</h3>
                    <p className="text-xs text-zinc-400 mt-1">{preset.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="inline-flex items-center rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                        {preset.frequency} days/week
                      </span>
                      <span className="inline-flex items-center rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-300 capitalize">
                        {preset.experience}
                      </span>
                    </div>
                  </div>
                  {generating && (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-blue-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Start Workout (fallback if no today workout but program exists) */}
      {currentProgram.data && !todayWorkout && !activeSession.data && (
        <Link
          href="/dashboard/workouts"
          className="block w-full rounded-xl bg-blue-500 py-4 text-center text-lg font-bold text-white hover:bg-blue-400 active:bg-blue-600 transition-colors"
        >
          Start Workout
        </Link>
      )}

      {/* Recent Workouts */}
      {sessions.data && sessions.data.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-zinc-50">Recent Workouts</h2>
          <div className="space-y-2">
            {sessions.data.slice(-5).reverse().map((session) => (
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
                      <FormattedDate isoString={session.startedAt} format="datetime" />
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/workouts/${session.id}`}
                    className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
                  >
                    {session.completedAt ? "View" : "Resume"}
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
