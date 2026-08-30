"use client";

import type { WizardData } from "@/hooks/use-wizard-state";

interface StepLimitationsProps {
  data: WizardData;
  onUpdate: (partial: Partial<WizardData>) => void;
}

export function StepLimitations({ data, onUpdate }: StepLimitationsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-50">Medical History</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Optional but recommended — helps us avoid exercises that could cause discomfort.
        </p>
      </div>

      <div>
        <label
          htmlFor="injuries"
          className="block text-sm font-medium text-zinc-300"
        >
          Injuries or Limitations{" "}
          <span className="text-zinc-500">(optional)</span>
        </label>
        <textarea
          id="injuries"
          rows={4}
          value={data.injuries ?? ""}
          onChange={(e) =>
            onUpdate({ injuries: e.target.value || undefined })
          }
          placeholder="e.g. Lower back pain, right shoulder impingement, knee surgery in 2023..."
          className="mt-1 block w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Include any past or current injuries, surgeries, or physical limitations.
        </p>
      </div>

      <div className="rounded-xl bg-lime-500/10 border border-lime-500/20 p-4">
        <p className="text-sm text-lime-400">
          <strong>Why we ask:</strong> This information helps the training engine
          suggest safer exercise substitutions and avoid movements that might
          aggravate existing conditions.
        </p>
      </div>
    </div>
  );
}
