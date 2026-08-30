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

/**
 * Onboarding wizard — multi-step form with progress indicator,
 * navigation, and form validation per step.
 */
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
    // Dynamic import to avoid SSR issues with tRPC caller
    const { createCaller } = await import("@/app/api/trpc/[trpc]/caller");
    const caller = createCaller();

    await caller.onboarding.submitWizard({
      userId,
      name: data.name,
      age: data.age,
      experienceLevel: data.experienceLevel,
      goals: data.goals,
      equipment: data.equipment,
      injuries: data.injuries,
    });

    // Clear wizard localStorage
    localStorage.removeItem("onboarding-wizard-data");
    localStorage.removeItem("onboarding-wizard-step");

    // Redirect to dashboard
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
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEP_LABELS.map((label, i) => {
            const step = i + 1;
            const isActive = step === currentStep;
            const isCompleted = step < currentStep;
            return (
              <div key={label} className="flex flex-1 items-center">
                {/* Step circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                      isCompleted
                        ? "bg-blue-600 text-white"
                        : isActive
                          ? "border-2 border-blue-600 text-blue-600"
                          : "border-2 border-neutral-300 text-neutral-400 dark:border-neutral-600 dark:text-neutral-500"
                    }`}
                  >
                    {isCompleted ? (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      step
                    )}
                  </div>
                  <span
                    className={`mt-1 text-[10px] font-medium ${
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : isCompleted
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-neutral-400 dark:text-neutral-500"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {/* Connector line */}
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={`mx-1 h-0.5 flex-1 ${
                      step < currentStep
                        ? "bg-blue-600"
                        : "bg-neutral-200 dark:bg-neutral-700"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="min-h-[280px]">{renderStep()}</div>

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={prevStep}
          disabled={isFirstStep}
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          Back
        </button>

        {isLastStep ? (
          <button
            onClick={handleSubmit}
            disabled={!canProceed}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Complete Setup
          </button>
        ) : (
          <button
            onClick={nextStep}
            disabled={!canProceed}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
