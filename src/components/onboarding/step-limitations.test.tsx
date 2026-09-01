import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StepLimitations } from "./step-limitations";
import type { WizardData } from "@/hooks/use-wizard-state";

describe("StepLimitations", () => {
  const defaultProps = {
    data: {} as WizardData,
    onUpdate: vi.fn(),
  };

  it("renders the step heading", () => {
    render(<StepLimitations {...defaultProps} />);
    expect(screen.getByText("Medical History")).toBeInTheDocument();
  });

  it("renders a textarea for injuries", () => {
    render(<StepLimitations {...defaultProps} />);
    expect(screen.getByLabelText(/injuries or limitations/i)).toBeInTheDocument();
  });

  it("calls onUpdate when text is entered", () => {
    const onUpdate = vi.fn();
    render(<StepLimitations data={{}} onUpdate={onUpdate} />);

    fireEvent.change(screen.getByLabelText(/injuries or limitations/i), {
      target: { value: "Lower back pain" },
    });

    expect(onUpdate).toHaveBeenCalledWith({
      injuries: "Lower back pain",
    });
  });

  it("displays existing injury text", () => {
    render(<StepLimitations data={{ injuries: "Shoulder issue" }} onUpdate={vi.fn()} />);

    expect(screen.getByLabelText(/injuries or limitations/i)).toHaveValue("Shoulder issue");
  });

  it("renders the info box explaining why injuries are collected", () => {
    render(<StepLimitations {...defaultProps} />);
    expect(screen.getByText(/Why we ask/)).toBeInTheDocument();
  });

  it("clears injuries when textarea is emptied", () => {
    const onUpdate = vi.fn();
    render(<StepLimitations data={{ injuries: "old" }} onUpdate={onUpdate} />);

    fireEvent.change(screen.getByLabelText(/injuries or limitations/i), {
      target: { value: "" },
    });

    expect(onUpdate).toHaveBeenCalledWith({ injuries: undefined });
  });
});
