"use client";

import Link from "next/link";

/**
 * Dashboard layout — shared shell for dashboard routes.
 * Provides navigation header and main content area.
 *
 * Accessibility:
 * - Semantic HTML (header, nav, main)
 * - ARIA labels for navigation
 * - Skip to main content link
 * - Keyboard navigation support
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Top nav */}
      <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link
            href="/dashboard"
            className="text-lg font-bold text-neutral-900 dark:text-neutral-100"
            aria-label="Libres - Go to dashboard"
          >
            Libres
          </Link>
          <nav aria-label="Main navigation">
            <ul className="flex items-center gap-4">
              <li>
                <Link
                  href="/dashboard"
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/workouts"
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  Workouts
                </Link>
              </li>
              <li>
                <Link
                  href="/exercises"
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  Exercises
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/progress"
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  Progress
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/volume"
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  Volume
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
