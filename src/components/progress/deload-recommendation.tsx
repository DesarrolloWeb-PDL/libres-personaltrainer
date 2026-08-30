"use client";

import { useState } from "react";

interface DeloadRecommendation {
  recommendation: "deload_now" | "continue" | "adjust";
  reason: string;
  weeksSinceDeload: number;
  lastDeloadWeek: string | null;
  totalDeloads: number;
}

interface DeloadRecommendationProps {
  data: DeloadRecommendation;
  onActivateDeload?: () => void;
  isActivating?: boolean;
}

/**
 * DeloadRecommendation — Shows deload status and one-click activation.
 * Displays current week, weeks since last deload, and recommendation.
 */
export function DeloadRecommendation({
  data,
  onActivateDeload,
  isActivating = false,
}: DeloadRecommendationProps) {
  const { recommendation, reason, weeksSinceDeload, lastDeloadWeek, totalDeloads } = data;

  const config = {
    deload_now: {
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-900/30",
      border: "border-red-200 dark:border-red-800",
      icon: "🔴",
      label: "Deload Now",
    },
    adjust: {
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      border: "border-yellow-200 dark:border-yellow-800",
      icon: "🟡",
      label: "Approaching Deload",
    },
    continue: {
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30",
      border: "border-green-200 dark:border-green-800",
      icon: "🟢",
      label: "Continue Training",
    },
  };

  const recConfig = config[recommendation];

  return (
    <div
      className={`rounded-lg border ${recConfig.border} bg-white p-4 dark:bg-neutral-900`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <span className="text-2xl">{recConfig.icon}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Deload Status
            </h3>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${recConfig.bg} ${recConfig.color}`}
            >
              {recConfig.label}
            </span>
          </div>

          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
            {reason}
          </p>

          {/* Stats */}
          <div className="mt-3 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {weeksSinceDeload}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Weeks Since Deload
              </p>
            </div>
            <div>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {lastDeloadWeek ?? "Never"}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Last Deload
              </p>
            </div>
            <div>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {totalDeloads}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Total Deloads
              </p>
            </div>
          </div>

          {/* Action Button */}
          {recommendation !== "continue" && onActivateDeload && (
            <div className="mt-4">
              <button
                onClick={onActivateDeload}
                disabled={isActivating}
                className={`w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                  recommendation === "deload_now"
                    ? "bg-red-600 hover:bg-red-700 disabled:bg-red-400"
                    : "bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400"
                }`}
              >
                {isActivating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Activating...
                  </span>
                ) : (
                  "Activate Deload Week"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
