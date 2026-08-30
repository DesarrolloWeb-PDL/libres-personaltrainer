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
 */
export function useWizardState(totalSteps = 5): UseWizardStateReturn {
  const [currentStep, setCurrentStep] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STEP_KEY);
      return saved ? parseInt(saved, 10) : 1;
    }
    return 1;
  });

  const [data, setData] = useState<WizardData>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved) as WizardData;
        } catch {
          return {};
        }
      }
    }
    return {};
  });

  // Persist to localStorage on changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem(STEP_KEY, currentStep.toString());
  }, [currentStep]);

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
