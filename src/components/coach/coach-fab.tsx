"use client";

interface CoachFabProps {
  onClick: () => void;
}

/**
 * Floating action button that opens the AI coach chat drawer.
 *
 * Positioned above the bottom tab navigation so it never overlaps the nav bar.
 */
export function CoachFab({ onClick }: CoachFabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open coach"
      className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-transform hover:scale-105 active:scale-95"
    >
      <svg
        className="h-7 w-7"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.75}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 013.75 21.75v-3.75c0-2.9 2.35-5.25 5.25-5.25h6c2.9 0 5.25 2.35 5.25 5.25V21a5.972 5.972 0 01-1.695 3.337A9.764 9.764 0 0112 20.25c4.97 0 9-3.694 9-8.25z"
        />
      </svg>
    </button>
  );
}
