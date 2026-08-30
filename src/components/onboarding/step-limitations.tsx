"use client";

import type { WizardData } from "@/hooks/use-wizard-state";

interface StepLimitationsProps {
  data: WizardData;
  onUpdate: (partial: Partial<WizardData>) => void;
}

/**
 * Step 5: Medical History — optional textarea for injuries/limitations.
 */
export function StepLimitations({ data, onUpdate }: StepLimitationsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Medical History
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Optional but recommended — helps us avoid exercises that could cause discomfort.
        </p>
      </div>

      <div>
        <label
          htmlFor="injuries"
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Injuries or Limitations{" "}
          <span className="text-neutral-400">(optional)</span>
        </label>
        <textarea
          id="injuries"
          rows={4}
          value={data.injuries ?? ""}
          onChange={(e) =>
            onUpdate({ injuries: e.target.value || undefined })
          }
          placeholder="e.g. Lower back pain, right shoulder impingement, knee surgery in 2023..."
          className="mt-1 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
        />
        <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
          Include any past or current injuries, surgeries, or physical limitations.
        </p>
      </div>

      <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-900/20">
        <p className="text-sm text-emerald-700 dark:text-emerald-300">
          <strong>Why we ask:</strong> This information helps the training engine
          suggest safer exercise substitutions and avoid movements that might
          aggravate existing conditions.
        </p>
      </div>
    </div>
  );
}
