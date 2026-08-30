import Link from "next/link";

/**
 * Dashboard layout — shared shell for dashboard routes.
 * Provides navigation header and main content area.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Top nav */}
      <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/dashboard" className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            Libres
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/workouts"
              className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Workouts
            </Link>
            <Link
              href="/exercises"
              className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Exercises
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
