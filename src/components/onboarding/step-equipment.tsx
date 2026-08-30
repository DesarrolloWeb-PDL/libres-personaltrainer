"use client";

import type { WizardData } from "@/hooks/use-wizard-state";

interface StepEquipmentProps {
  data: WizardData;
  onUpdate: (partial: Partial<WizardData>) => void;
}

const EQUIPMENT = [
  {
    value: "full_gym" as const,
    label: "Full Gym",
    description:
      "Access to barbells, dumbbells, cable machines, squat racks, and benches.",
  },
  {
    value: "home_gym" as const,
    label: "Home Gym",
    description:
      "Dumbbells, an adjustable bench, and minimal equipment at home.",
  },
  {
    value: "bodyweight_only" as const,
    label: "Bodyweight Only",
    description:
      "No equipment — using bodyweight exercises like push-ups, dips, and squats.",
  },
];

/**
 * Step 4: Equipment — radio button selection.
 */
export function StepEquipment({ data, onUpdate }: StepEquipmentProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Available Equipment
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          What equipment do you have access to?
        </p>
      </div>

      <div className="space-y-3">
        {EQUIPMENT.map((eq) => {
          const isSelected = data.equipment === eq.value;
          return (
            <label
              key={eq.value}
              className={`flex cursor-pointer rounded-lg border p-4 transition-colors ${
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                  : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600"
              }`}
            >
              <input
                type="radio"
                name="equipment"
                value={eq.value}
                checked={isSelected}
                onChange={() => onUpdate({ equipment: eq.value })}
                className="mt-0.5 h-4 w-4 border-neutral-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <span className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {eq.label}
                </span>
                <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                  {eq.description}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
