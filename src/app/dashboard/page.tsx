"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/trpc-client";
import { useClientDate, useFormattedDate } from "@/hooks/use-client-date";

const userId = "cmtg8qhsf0000pgkzcm8m2mma";

/** Split icon mapping */
const SPLIT_ICONS: Record<string, string> = {
  push_pull_legs: "💪",
  upper_lower: "⚖️",
  full_body: "🏋️",
};

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

export default function DashboardPage() {
  const [generating, setGenerating] = useState(false);
  const [selectedSplit, setSelectedSplit] = useState<string | null>(null);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const clientDate = useClientDate();

  const currentProgram = api.program.getCurrent.useQuery({ userId });
  const sessions = api.session.listByUser.useQuery({ userId });
  const activeSession = api.session.getActive.useQuery({ userId });
  const planOptions = api.program.getPlanOptions.useQuery({ userId });

  const generateProgram = api.program.generate.useMutation({
    onSuccess: () => {
      currentProgram.refetch();
      setGenerating(false);
      setSelectedSplit(null);
      setShowPlanSelection(false);
    },
    onError: () => {
      setGenerating(false);
      setSelectedSplit(null);
    },
  });

  const deleteProgram = api.program.deleteCurrent.useMutation({
    onSuccess: () => {
      currentProgram.refetch();
      sessions.refetch();
      setShowPlanSelection(true);
    },
  });

  const handleSelectPlan = (option: {
    splitType: string;
    name: string;
    frequency: number;
  }) => {
    setGenerating(true);
    setSelectedSplit(option.splitType);
    generateProgram.mutate({
      userId,
      name: option.name,
      splitType: option.splitType as "push_pull_legs" | "upper_lower" | "full_body",
      trainingFrequency: option.frequency,
      experienceLevel: "intermediate", // Will be overridden by profile in backend
    });
  };

  const completedSessions =
    sessions.data?.filter((s) => s.completedAt !== null).length ?? 0;

  // Determine today's workout — only after client hydration
  const programDays = currentProgram.data?.days ?? [];
  const today = clientDate?.getDay() ?? 0;
  const todayIndex = today === 0 ? 6 : today - 1;
  const todayWorkout =
    programDays.length > 0 ? programDays[todayIndex % programDays.length] : null;

  // Calculate weekly progress
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

      {/* ═══════════════════════════════════════════════════════════════
          NO PROGRAM → PERSONALIZED PLAN SELECTION
          ═══════════════════════════════════════════════════════════════ */}
      {(!currentProgram.data || showPlanSelection) && (
        <div className="space-y-4">
          <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-10 bg-blue-500 rounded-full" />
              <div>
                <h2 className="text-xl font-bold text-zinc-50">
                  Choose Your Training Plan
                </h2>
                <p className="text-sm text-zinc-400">
                  Based on your profile, here are the best options for you.
                </p>
              </div>
            </div>
          </div>

          {planOptions.isLoading && (
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-blue-500 mx-auto mb-3" />
              <p className="text-sm text-zinc-400">Building your personalized plans...</p>
            </div>
          )}

          {planOptions.data && (
            <div className="space-y-3">
              {planOptions.data.map((option) => (
                <button
                  key={option.splitType}
                  onClick={() => handleSelectPlan(option)}
                  disabled={generating}
                  className={`w-full rounded-xl border p-5 text-left transition disabled:opacity-50 ${
                    selectedSplit === option.splitType
                      ? "bg-blue-500/20 border-blue-500/50"
                      : "bg-zinc-900 border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{SPLIT_ICONS[option.splitType] ?? "🏋️"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-zinc-100">{option.name}</h3>
                        {selectedSplit === option.splitType && generating && (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-zinc-400 mb-3">{option.description}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-400">
                          {option.frequency} days/week
                        </span>
                        <span className="inline-flex items-center rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300">
                          {option.focus}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-400">
                          Best for: {option.bestFor}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <svg
                        className={`h-5 w-5 transition-colors ${
                          selectedSplit === option.splitType
                            ? "text-blue-500"
                            : "text-zinc-600"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 4.5l7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {planOptions.data && planOptions.data.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900 p-6 text-center">
              <p className="text-sm text-zinc-400">
                Complete your profile to get personalized plan recommendations.
              </p>
              <Link
                href="/onboarding"
                className="mt-4 inline-block rounded-xl bg-blue-500 px-6 py-3 font-bold text-white hover:bg-blue-400 transition-colors"
              >
                Complete Profile
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          ACTIVE SESSION BANNER
          ═══════════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════════
          TODAY'S WORKOUT
          ═══════════════════════════════════════════════════════════════ */}
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
            {todayWorkout.exercises.reduce(
              (acc, e) => acc + (e.sets ?? 3) * ((e.reps ?? 10) * 3 + 90),
              0,
            ) / 60 | 0}{" "}
            min
          </p>
          <Link
            href="/dashboard/workouts"
            className="block w-full rounded-xl bg-blue-500 py-3 text-center text-lg font-bold text-white hover:bg-blue-400 active:bg-blue-600 transition-colors"
          >
            Start Today&apos;s Workout
          </Link>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STATS GRID
          ═══════════════════════════════════════════════════════════════ */}
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
        {currentProgram.data && (
          <>
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-10 bg-amber-500 rounded-full" />
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Program
                  </p>
                  <p className="text-lg font-bold text-zinc-50 truncate">
                    {currentProgram.data.name}
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
                    {currentProgram.data.splitType?.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          CURRENT PROGRAM OVERVIEW
          ═══════════════════════════════════════════════════════════════ */}
      {currentProgram.data && programDays.length > 0 && (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-10 bg-blue-500 rounded-full" />
            <div className="flex-1">
              <h2 className="font-semibold text-zinc-50">
                {currentProgram.data.name}
              </h2>
              <p className="text-xs text-zinc-400">
                {currentProgram.data.splitType?.replace(/_/g, " ")} • Started{" "}
                {currentProgram.data.startDate ? (
                  <FormattedDate
                    isoString={currentProgram.data.startDate}
                    format="date"
                  />
                ) : (
                  "—"
                )}
              </p>
            </div>
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
                  <p
                    className={`text-sm font-medium ${
                      isToday ? "text-blue-400" : "text-zinc-100"
                    }`}
                  >
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
          <button
            onClick={() => {
              if (window.confirm("This will delete your current program and all workout history. Are you sure?")) {
                deleteProgram.mutate({ userId });
              }
            }}
            disabled={deleteProgram.isPending}
            className="mt-2 block w-full rounded-xl border border-zinc-700 py-3 text-center text-sm font-medium text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-colors disabled:opacity-50"
          >
            {deleteProgram.isPending ? "Deleting..." : "Change Program"}
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          START WORKOUT (fallback)
          ═══════════════════════════════════════════════════════════════ */}
      {currentProgram.data && !todayWorkout && !activeSession.data && (
        <Link
          href="/dashboard/workouts"
          className="block w-full rounded-xl bg-blue-500 py-4 text-center text-lg font-bold text-white hover:bg-blue-400 active:bg-blue-600 transition-colors"
        >
          Start Workout
        </Link>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          RECENT WORKOUTS
          ═══════════════════════════════════════════════════════════════ */}
      {sessions.data && sessions.data.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-zinc-50">
            Recent Workouts
          </h2>
          <div className="space-y-2">
            {sessions.data
              .slice(-5)
              .reverse()
              .map((session) => (
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
                        <FormattedDate
                          isoString={session.startedAt}
                          format="datetime"
                        />
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
