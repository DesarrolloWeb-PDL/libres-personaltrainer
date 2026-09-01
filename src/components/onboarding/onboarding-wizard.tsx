"use client";

import { useRouter } from "next/navigation";
import { useWizardState } from "@/hooks/use-wizard-state";
import { StepProfile } from "./step-profile";
import { StepExperience } from "./step-experience";
import { StepGoals } from "./step-goals";
import { StepEquipment } from "./step-equipment";
import { StepLimitations } from "./step-limitations";

const STEP_LABELS = ["Profile", "Experience", "Goals", "Equipment", "Medical"];

interface OnboardingWizardProps {
  userId: string;
}

export function OnboardingWizard({ userId }: OnboardingWizardProps) {
  const router = useRouter();
  const {
    currentStep,
    totalSteps,
    data,
    nextStep,
    prevStep,
    updateData,
    canProceed,
    isFirstStep,
    isLastStep,
  } = useWizardState();

  const handleSubmit = async () => {
    const { createCaller } = await import("@/app/api/trpc/[trpc]/caller");
    const caller = createCaller();

    // 1. Save profile via onboarding wizard
    await caller.onboarding.submitWizard({
      userId,
      name: data.name,
      age: data.age,
      experienceLevel: data.experienceLevel,
      goals: data.goals,
      equipment: data.equipment,
      injuries: data.injuries,
    });

    // DON'T auto-generate program — let user choose on dashboard

    localStorage.removeItem("onboarding-wizard-data");
    localStorage.removeItem("onboarding-wizard-step");

    router.push("/dashboard");
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepProfile data={data} onUpdate={updateData} />;
      case 2:
        return <StepExperience data={data} onUpdate={updateData} />;
      case 3:
        return <StepGoals data={data} onUpdate={updateData} />;
      case 4:
        return <StepEquipment data={data} onUpdate={updateData} />;
      case 5:
        return <StepLimitations data={data} onUpdate={updateData} />;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Step {currentStep} of {totalSteps}: {STEP_LABELS[currentStep - 1]}
      </div>

      <nav aria-label="Onboarding progress">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEP_LABELS.map((label, i) => {
              const step = i + 1;
              const isActive = step === currentStep;
              const isCompleted = step < currentStep;
              return (
                <div key={label} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                        isCompleted
                          ? "bg-blue-500 text-white"
                          : isActive
                            ? "border-2 border-blue-500 text-blue-500"
                            : "border-2 border-zinc-600 text-zinc-500"
                      }`}
                      aria-current={isActive ? "step" : undefined}
                      aria-label={`Step ${step}: ${label}${isCompleted ? " (completed)" : isActive ? " (current)" : ""}`}
                    >
                      {isCompleted ? (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step
                      )}
                    </div>
                    <span
                      className={`mt-1 text-[10px] font-medium ${
                        isActive ? "text-blue-500" : isCompleted ? "text-blue-500" : "text-zinc-500"
                      }`}
                      aria-hidden="true"
                    >
                      {label}
                    </span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div
                      className={`mx-1 h-0.5 flex-1 ${
                        step < currentStep ? "bg-blue-500" : "bg-zinc-700"
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      <div
        className="min-h-[280px]"
        role="region"
        aria-label={`Step ${currentStep}: ${STEP_LABELS[currentStep - 1]}`}
      >
        {renderStep()}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={prevStep}
          disabled={isFirstStep}
          aria-label="Go to previous step"
          className="min-h-[44px] rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-bold text-zinc-300 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>

        {isLastStep ? (
          <button
            onClick={handleSubmit}
            disabled={!canProceed}
            aria-label="Complete onboarding setup"
            className="min-h-[44px] rounded-xl bg-blue-500 px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Complete Setup
          </button>
        ) : (
          <button
            onClick={nextStep}
            disabled={!canProceed}
            aria-label={`Continue to step ${currentStep + 1}`}
            className="min-h-[44px] rounded-xl bg-blue-500 px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
