"use client";

import type { WizardData } from "@/hooks/use-wizard-state";

interface StepGoalsProps {
  data: WizardData;
  onUpdate: (partial: Partial<WizardData>) => void;
}

type GoalOption = NonNullable<WizardData["goals"]>[number];

const GOALS: { value: GoalOption; label: string; description: string }[] = [
  {
    value: "muscle_gain",
    label: "Muscle Gain",
    description: "Build size and hypertrophy through progressive overload.",
  },
  {
    value: "fat_loss",
    label: "Fat Loss",
    description: "Reduce body fat while preserving lean mass.",
  },
  {
    value: "strength",
    label: "Strength",
    description: "Increase max force production on main lifts.",
  },
  {
    value: "endurance",
    label: "Endurance",
    description: "Improve work capacity and muscular endurance.",
  },
  {
    value: "maintenance",
    label: "Maintenance",
    description: "Maintain current physique and performance.",
  },
];

/**
 * Step 3: Goals — multi-select checkboxes.
 */
export function StepGoals({ data, onUpdate }: StepGoalsProps) {
  const selected = data.goals ?? [];

  const toggleGoal = (goal: GoalOption) => {
    const next = selected.includes(goal)
      ? selected.filter((g) => g !== goal)
      : [...selected, goal];
    onUpdate({ goals: next.length > 0 ? next : undefined });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Your Goals
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Select all that apply. We&apos;ll tailor your program accordingly.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {GOALS.map((goal) => {
          const isSelected = selected.includes(goal.value);
          return (
            <label
              key={goal.value}
              className={`flex cursor-pointer rounded-lg border p-4 transition-colors ${
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                  : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600"
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleGoal(goal.value)}
                className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <span className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {goal.label}
                </span>
                <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                  {goal.description}
                </span>
              </div>
            </label>
          );
        })}
      </div>

      {selected.length > 0 && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {selected.length} goal{selected.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}
