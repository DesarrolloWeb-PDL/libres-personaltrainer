import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWizardState } from "./use-wizard-state";

/**
 * Unit tests for useWizardState hook.
 *
 * Tests step navigation, form data, localStorage persistence, and validation.
 */

describe("useWizardState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("initializes with step 1 and empty data", () => {
    const { result } = renderHook(() => useWizardState());

    expect(result.current.currentStep).toBe(1);
    expect(result.current.totalSteps).toBe(5);
    expect(result.current.data).toEqual({});
    expect(result.current.isFirstStep).toBe(true);
    expect(result.current.isLastStep).toBe(false);
  });

  it("navigates to next step", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.updateData({ age: 25 });
    });

    act(() => {
      result.current.nextStep();
    });

    expect(result.current.currentStep).toBe(2);
  });

  it("navigates to previous step", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setStep(3);
    });

    act(() => {
      result.current.prevStep();
    });

    expect(result.current.currentStep).toBe(2);
  });

  it("does not go below step 1", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.prevStep();
    });

    expect(result.current.currentStep).toBe(1);
  });

  it("does not go above total steps", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setStep(5);
    });

    act(() => {
      result.current.nextStep();
    });

    expect(result.current.currentStep).toBe(5);
  });

  it("updates form data", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.updateData({ age: 28, name: "Test" });
    });

    expect(result.current.data.age).toBe(28);
    expect(result.current.data.name).toBe("Test");
  });

  it("validates step 1 requires age", () => {
    const { result } = renderHook(() => useWizardState());

    // No age set
    expect(result.current.canProceed).toBe(false);

    act(() => {
      result.current.updateData({ age: 25 });
    });

    expect(result.current.canProceed).toBe(true);
  });

  it("validates age range", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.updateData({ age: 5 });
    });

    expect(result.current.canProceed).toBe(false);

    act(() => {
      result.current.updateData({ age: 101 });
    });

    expect(result.current.canProceed).toBe(false);
  });

  it("validates step 2 requires experience level", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setStep(2);
    });

    expect(result.current.canProceed).toBe(false);

    act(() => {
      result.current.updateData({ experienceLevel: "beginner" });
    });

    expect(result.current.canProceed).toBe(true);
  });

  it("validates step 3 requires at least one goal", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setStep(3);
    });

    expect(result.current.canProceed).toBe(false);

    act(() => {
      result.current.updateData({ goals: ["muscle_gain"] });
    });

    expect(result.current.canProceed).toBe(true);
  });

  it("validates step 4 requires equipment selection", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setStep(4);
    });

    expect(result.current.canProceed).toBe(false);

    act(() => {
      result.current.updateData({ equipment: "full_gym" });
    });

    expect(result.current.canProceed).toBe(true);
  });

  it("step 5 (medical) can always proceed", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setStep(5);
    });

    expect(result.current.canProceed).toBe(true);
  });

  it("persists data to localStorage", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.updateData({ age: 30, name: "Persist" });
    });

    const saved = JSON.parse(localStorage.getItem("onboarding-wizard-data")!);
    expect(saved.age).toBe(30);
    expect(saved.name).toBe("Persist");
  });

  it("persists step to localStorage", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setStep(3);
    });

    const savedStep = localStorage.getItem("onboarding-wizard-step");
    expect(savedStep).toBe("3");
  });

  it("restores state from localStorage", () => {
    localStorage.setItem(
      "onboarding-wizard-data",
      JSON.stringify({ age: 25, name: "Restored" })
    );
    localStorage.setItem("onboarding-wizard-step", "2");

    const { result } = renderHook(() => useWizardState());

    expect(result.current.currentStep).toBe(2);
    expect(result.current.data.age).toBe(25);
    expect(result.current.data.name).toBe("Restored");
  });
});
