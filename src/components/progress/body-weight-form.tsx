"use client";

import { useState } from "react";

interface BodyWeightFormProps {
  onSubmit: (data: { bodyWeight: number; notes?: string }) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * BodyWeightForm — Simple form for logging body weight with optional notes.
 */
export function BodyWeightForm({
  onSubmit,
  isSubmitting = false,
}: BodyWeightFormProps) {
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedWeight = parseFloat(weight);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      setError("Please enter a valid weight greater than 0.");
      return;
    }

    await onSubmit({
      bodyWeight: parsedWeight,
      notes: notes.trim() || undefined,
    });

    setWeight("");
    setNotes("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
    >
      <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        Log Body Weight
      </h3>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="body-weight"
            className="mb-1 block text-xs text-neutral-500 dark:text-neutral-400"
          >
            Weight (kg)
          </label>
          <input
            id="body-weight"
            type="number"
            step="0.1"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="75.5"
            className="w-full rounded border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>

        <div className="flex-1">
          <label
            htmlFor="body-notes"
            className="mb-1 block text-xs text-neutral-500 dark:text-neutral-400"
          >
            Notes (optional)
          </label>
          <input
            id="body-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Morning, fasted..."
            className="w-full rounded border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !weight}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Log"}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}
