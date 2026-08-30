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

export function StepEquipment({ data, onUpdate }: StepEquipmentProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-50">Available Equipment</h2>
        <p className="mt-1 text-sm text-zinc-400">
          What equipment do you have access to?
        </p>
      </div>

      <div className="space-y-3">
        {EQUIPMENT.map((eq) => {
          const isSelected = data.equipment === eq.value;
          return (
            <label
              key={eq.value}
              className={`flex cursor-pointer rounded-xl border p-4 transition-colors ${
                isSelected
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
              }`}
            >
              <input
                type="radio"
                name="equipment"
                value={eq.value}
                checked={isSelected}
                onChange={() => onUpdate({ equipment: eq.value })}
                className="mt-0.5 h-4 w-4 border-zinc-600 text-blue-500 focus:ring-blue-500"
              />
              <div className="ml-3">
                <span className="block text-sm font-medium text-zinc-100">
                  {eq.label}
                </span>
                <span className="block text-xs text-zinc-400">
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
