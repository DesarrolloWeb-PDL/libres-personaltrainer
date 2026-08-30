"use client";

import type { WizardData } from "@/hooks/use-wizard-state";

interface StepExperienceProps {
  data: WizardData;
  onUpdate: (partial: Partial<WizardData>) => void;
}

const LEVELS = [
  {
    value: "beginner" as const,
    label: "Beginner",
    description:
      "New to weight training or returning after a long break. Focus on learning proper form and building a foundation.",
  },
  {
    value: "intermediate" as const,
    label: "Intermediate",
    description:
      "6–18 months of consistent training. Comfortable with compound lifts and ready for structured programming.",
  },
  {
    value: "advanced" as const,
    label: "Advanced",
    description:
      "2+ years of serious training. Proficient in all major lifts and experienced with periodization.",
  },
];

/**
 * Step 2: Experience Level — radio button selection.
 */
export function StepExperience({ data, onUpdate }: StepExperienceProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Experience Level
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          How would you describe your training experience?
        </p>
      </div>

      <div className="space-y-3">
        {LEVELS.map((level) => {
          const isSelected = data.experienceLevel === level.value;
          return (
            <label
              key={level.value}
              className={`flex cursor-pointer rounded-lg border p-4 transition-colors ${
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                  : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600"
              }`}
            >
              <input
                type="radio"
                name="experienceLevel"
                value={level.value}
                checked={isSelected}
                onChange={() => onUpdate({ experienceLevel: level.value })}
                className="mt-0.5 h-4 w-4 border-neutral-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <span className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {level.label}
                </span>
                <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                  {level.description}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
