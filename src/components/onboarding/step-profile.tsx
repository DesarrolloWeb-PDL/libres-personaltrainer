"use client";

import type { WizardData } from "@/hooks/use-wizard-state";

interface StepProfileProps {
  data: WizardData;
  onUpdate: (partial: Partial<WizardData>) => void;
}

/**
 * Step 1: Basic Info — name (optional) and age (required).
 *
 * Accessibility:
 * - ARIA labels for all inputs
 * - Error messages linked to inputs via aria-describedby
 * - Required field indicators
 * - Keyboard navigation support
 */
export function StepProfile({ data, onUpdate }: StepProfileProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Basic Information
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Tell us a bit about yourself to personalize your experience.
        </p>
      </div>

      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Name <span className="text-neutral-400">(optional)</span>
        </label>
        <input
          id="name"
          type="text"
          value={data.name ?? ""}
          onChange={(e) => onUpdate({ name: e.target.value || undefined })}
          placeholder="Your name"
          aria-label="Your name (optional)"
          className="mt-1 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
        />
      </div>

      {/* Age */}
      <div>
        <label
          htmlFor="age"
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Age <span className="text-red-500" aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <input
          id="age"
          type="number"
          min={10}
          max={100}
          value={data.age ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            onUpdate({ age: val ? parseInt(val, 10) : undefined });
          }}
          placeholder="e.g. 28"
          aria-required="true"
          aria-invalid={data.age !== undefined && (data.age < 10 || data.age > 100) ? "true" : "false"}
          aria-describedby={data.age !== undefined && (data.age < 10 || data.age > 100) ? "age-error" : undefined}
          className="mt-1 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
        />
        {data.age !== undefined && (data.age < 10 || data.age > 100) && (
          <p id="age-error" role="alert" className="mt-1 text-xs text-red-500">
            Age must be between 10 and 100.
          </p>
        )}
      </div>
    </div>
  );
}
