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

export function StepExperience({ data, onUpdate }: StepExperienceProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-50">Experience Level</h2>
        <p className="mt-1 text-sm text-zinc-400">
          How would you describe your training experience?
        </p>
      </div>

      <div className="space-y-3">
        {LEVELS.map((level) => {
          const isSelected = data.experienceLevel === level.value;
          return (
            <label
              key={level.value}
              className={`flex cursor-pointer rounded-xl border p-4 transition-colors ${
                isSelected
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
              }`}
            >
              <input
                type="radio"
                name="experienceLevel"
                value={level.value}
                checked={isSelected}
                onChange={() => onUpdate({ experienceLevel: level.value })}
                className="mt-0.5 h-4 w-4 border-zinc-600 text-blue-500 focus:ring-blue-500"
              />
              <div className="ml-3">
                <span className="block text-sm font-medium text-zinc-100">{level.label}</span>
                <span className="block text-xs text-zinc-400">{level.description}</span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
