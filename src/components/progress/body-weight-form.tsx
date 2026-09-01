"use client";

import { useState } from "react";

interface BodyWeightFormProps {
  onSubmit: (data: { bodyWeight: number; notes?: string }) => Promise<void>;
  isSubmitting?: boolean;
}

export function BodyWeightForm({ onSubmit, isSubmitting = false }: BodyWeightFormProps) {
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

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
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const adjustWeight = (delta: number) => {
    const current = parseFloat(weight) || 0;
    const newVal = Math.max(0, current + delta * 0.5);
    setWeight(String(newVal));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-zinc-900 border border-zinc-800 p-4"
      aria-labelledby="body-weight-form-title"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-10 bg-blue-500 rounded-full" />
        <h3 id="body-weight-form-title" className="font-semibold text-zinc-50">
          Log Body Weight
        </h3>
      </div>

      <div className="space-y-4">
        {/* Weight Input with +/- buttons */}
        <div>
          <label
            htmlFor="body-weight"
            className="mb-1 block text-xs font-medium text-zinc-500 uppercase tracking-wider"
          >
            Weight (kg)
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustWeight(-1)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-zinc-800 text-2xl font-bold text-zinc-300 hover:bg-zinc-700 active:bg-zinc-600 transition-colors"
              aria-label="Decrease weight"
            >
              −
            </button>
            <input
              id="body-weight"
              type="number"
              step="0.1"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="75.5"
              aria-required="true"
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? "weight-error" : undefined}
              className="flex-1 min-h-[44px] rounded-xl border border-zinc-600 bg-zinc-800 px-3 text-center text-3xl font-black text-zinc-50 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => adjustWeight(1)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-zinc-800 text-2xl font-bold text-zinc-300 hover:bg-zinc-700 active:bg-zinc-600 transition-colors"
              aria-label="Increase weight"
            >
              +
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor="body-notes"
            className="mb-1 block text-xs font-medium text-zinc-500 uppercase tracking-wider"
          >
            Notes (optional)
          </label>
          <input
            id="body-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Morning, fasted..."
            className="w-full min-h-[44px] rounded-xl border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !weight}
          aria-label={isSubmitting ? "Saving weight entry" : "Log weight entry"}
          className="w-full min-h-[44px] rounded-xl bg-blue-500 px-4 py-3 text-sm font-bold text-white hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Saving..." : success ? "✓ Saved!" : "Log Weight"}
        </button>
      </div>

      {error && (
        <p id="weight-error" role="alert" className="mt-2 text-xs text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}
