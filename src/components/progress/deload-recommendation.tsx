"use client";

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

export function DeloadRecommendation({
  data,
  onActivateDeload,
  isActivating = false,
}: DeloadRecommendationProps) {
  const { recommendation, reason, weeksSinceDeload, lastDeloadWeek, totalDeloads } = data;

  const config = {
    deload_now: {
      accentColor: "bg-red-500",
      badgeColor: "bg-red-500/10 text-red-400",
      buttonColor: "bg-red-500 hover:bg-red-400",
      label: "Deload Now",
    },
    adjust: {
      accentColor: "bg-amber-500",
      badgeColor: "bg-amber-500/10 text-amber-400",
      buttonColor: "bg-amber-500 hover:bg-amber-400",
      label: "Approaching Deload",
    },
    continue: {
      accentColor: "bg-lime-500",
      badgeColor: "bg-lime-500/10 text-lime-400",
      buttonColor: "bg-lime-500 hover:bg-lime-400",
      label: "Continue Training",
    },
  };

  const recConfig = config[recommendation];

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
      <div className="flex items-start gap-3">
        <div className={`w-1 h-10 ${recConfig.accentColor} rounded-full flex-shrink-0`} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-zinc-50">Deload Status</h3>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${recConfig.badgeColor}`}
            >
              {recConfig.label}
            </span>
          </div>

          <p className="mt-2 text-sm text-zinc-400">{reason}</p>

          {/* Stats */}
          <div className="mt-3 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-black text-zinc-50">{weeksSinceDeload}</p>
              <p className="text-xs text-zinc-500">Weeks Since Deload</p>
            </div>
            <div>
              <p className="text-2xl font-black text-zinc-50">{lastDeloadWeek ?? "Never"}</p>
              <p className="text-xs text-zinc-500">Last Deload</p>
            </div>
            <div>
              <p className="text-2xl font-black text-zinc-50">{totalDeloads}</p>
              <p className="text-xs text-zinc-500">Total Deloads</p>
            </div>
          </div>

          {/* Action Button */}
          {recommendation !== "continue" && onActivateDeload && (
            <div className="mt-4">
              <button
                onClick={onActivateDeload}
                disabled={isActivating}
                className={`w-full min-h-[44px] rounded-xl px-4 py-3 text-sm font-bold text-white transition-colors ${recConfig.buttonColor} disabled:opacity-50`}
              >
                {isActivating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
