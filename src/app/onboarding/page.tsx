import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-50">
            Welcome to Libres
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Let&apos;s set up your profile to personalize your training program.
          </p>
        </div>
        <OnboardingWizard userId={session.user.id} />
      </div>
    </main>
  );
}
