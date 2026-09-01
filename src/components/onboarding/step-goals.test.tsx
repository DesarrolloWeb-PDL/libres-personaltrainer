import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StepGoals } from "./step-goals";
import type { WizardData } from "@/hooks/use-wizard-state";

describe("StepGoals", () => {
  const defaultProps = {
    data: {} as WizardData,
    onUpdate: vi.fn(),
  };

  it("renders the step heading", () => {
    render(<StepGoals {...defaultProps} />);
    expect(screen.getByText("Your Goals")).toBeInTheDocument();
  });

  it("renders all five goal options", () => {
    render(<StepGoals {...defaultProps} />);
    expect(screen.getByText("Muscle Gain")).toBeInTheDocument();
    expect(screen.getByText("Fat Loss")).toBeInTheDocument();
    expect(screen.getByText("Strength")).toBeInTheDocument();
    expect(screen.getByText("Endurance")).toBeInTheDocument();
    expect(screen.getByText("Maintenance")).toBeInTheDocument();
  });

  it("toggles a goal on click", () => {
    const onUpdate = vi.fn();
    render(<StepGoals data={{}} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByText("Muscle Gain"));

    expect(onUpdate).toHaveBeenCalledWith({
      goals: ["muscle_gain"],
    });
  });

  it("allows multiple selections", () => {
    const onUpdate = vi.fn();
    render(<StepGoals data={{ goals: ["muscle_gain", "strength"] }} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByText("Fat Loss"));

    expect(onUpdate).toHaveBeenCalledWith({
      goals: ["muscle_gain", "strength", "fat_loss"],
    });
  });

  it("deselects a goal when clicked again", () => {
    const onUpdate = vi.fn();
    render(<StepGoals data={{ goals: ["muscle_gain", "strength"] }} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByText("Muscle Gain"));

    expect(onUpdate).toHaveBeenCalledWith({
      goals: ["strength"],
    });
  });

  it("shows selected count", () => {
    render(<StepGoals data={{ goals: ["muscle_gain", "fat_loss"] }} onUpdate={vi.fn()} />);

    expect(screen.getByText("2 goals selected")).toBeInTheDocument();
  });

  it("shows checked state for selected goals", () => {
    render(<StepGoals data={{ goals: ["muscle_gain"] }} onUpdate={vi.fn()} />);

    // The checkbox doesn't have a value attr; find it by label association
    const muscleGainLabel = screen.getByText("Muscle Gain").closest("label")!;
    const checkbox = muscleGainLabel.querySelector("input[type='checkbox']")!;
    expect(checkbox).toBeChecked();
  });
});
