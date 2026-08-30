import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

/**
 * Onboarding page — entry point for the 5-step wizard.
 *
 * In production, userId would come from session/auth.
 * For now, we use a placeholder that Phase 9 can wire to real auth.
 */
export default function OnboardingPage() {
  // TODO: Replace with real auth session in Phase 9
  const userId = "user-placeholder";

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-12 dark:bg-neutral-950">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Welcome to Libres
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Let&apos;s set up your profile to personalize your training program.
          </p>
        </div>
        <OnboardingWizard userId={userId} />
      </div>
    </main>
  );
}
