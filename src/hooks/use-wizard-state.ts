"use client";

import { useState, useCallback, useEffect } from "react";

export interface WizardData {
  name?: string;
  age?: number;
  experienceLevel?: "beginner" | "intermediate" | "advanced";
  goals?: ("muscle_gain" | "fat_loss" | "strength" | "endurance" | "maintenance")[];
  equipment?: "full_gym" | "home_gym" | "bodyweight_only";
  injuries?: string;
}

export interface UseWizardStateReturn {
  currentStep: number;
  totalSteps: number;
  data: WizardData;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (partial: Partial<WizardData>) => void;
  canProceed: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
}

const STORAGE_KEY = "onboarding-wizard-data";
const STEP_KEY = "onboarding-wizard-step";

/**
 * Wizard state hook — tracks multi-step form data with localStorage persistence.
 *
 * IMPORTANT: Always initialize with default values (matching SSR) to avoid
 * hydration mismatches. Load from localStorage in useEffect after hydration.
 */
export function useWizardState(totalSteps = 5): UseWizardStateReturn {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>({});
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage AFTER hydration (not during useState initializer)
  useEffect(() => {
    const savedStep = localStorage.getItem(STEP_KEY);
    if (savedStep) {
      setCurrentStep(parseInt(savedStep, 10));
    }

    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        setData(JSON.parse(savedData) as WizardData);
      } catch {
        // Ignore parse errors
      }
    }

    setHydrated(true);
  }, []);

  // Persist to localStorage on changes (only after initial hydration load)
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, hydrated]);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STEP_KEY, currentStep.toString());
    }
  }, [currentStep, hydrated]);

  const setStep = useCallback((step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  }, [totalSteps]);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  }, [totalSteps]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const updateData = useCallback((partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  // Simple validation: can proceed if current step's required fields are filled
  const canProceed = (() => {
    switch (currentStep) {
      case 1: // Basic Info — age is required
        return data.age !== undefined && data.age >= 10 && data.age <= 100;
      case 2: // Experience Level
        return data.experienceLevel !== undefined;
      case 3: // Goals
        return data.goals !== undefined && data.goals.length > 0;
      case 4: // Equipment
        return data.equipment !== undefined;
      case 5: // Medical History — optional
        return true;
      default:
        return false;
    }
  })();

  return {
    currentStep,
    totalSteps,
    data,
    setStep,
    nextStep,
    prevStep,
    updateData,
    canProceed,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === totalSteps,
  };
}
