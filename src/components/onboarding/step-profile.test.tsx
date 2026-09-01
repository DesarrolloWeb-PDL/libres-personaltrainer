import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StepProfile } from "./step-profile";
import type { WizardData } from "@/hooks/use-wizard-state";

describe("StepProfile", () => {
  const defaultProps = {
    data: {} as WizardData,
    onUpdate: vi.fn(),
  };

  it("renders the step heading", () => {
    render(<StepProfile {...defaultProps} />);
    expect(screen.getByText("Basic Information")).toBeInTheDocument();
  });

  it("renders name and age inputs", () => {
    render(<StepProfile {...defaultProps} />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/age/i)).toBeInTheDocument();
  });

  it("calls onUpdate when name changes", () => {
    const onUpdate = vi.fn();
    render(<StepProfile data={{}} onUpdate={onUpdate} />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "John" },
    });

    expect(onUpdate).toHaveBeenCalledWith({ name: "John" });
  });

  it("calls onUpdate when age changes", () => {
    const onUpdate = vi.fn();
    render(<StepProfile data={{}} onUpdate={onUpdate} />);

    fireEvent.change(screen.getByLabelText(/age/i), {
      target: { value: "28" },
    });

    expect(onUpdate).toHaveBeenCalledWith({ age: 28 });
  });

  it("shows validation error for invalid age", () => {
    render(<StepProfile data={{ age: 5 }} onUpdate={vi.fn()} />);
    expect(screen.getByText(/age must be between 10 and 100/i)).toBeInTheDocument();
  });

  it("displays existing values", () => {
    render(<StepProfile data={{ name: "Jane", age: 32 }} onUpdate={vi.fn()} />);
    expect(screen.getByLabelText(/name/i)).toHaveValue("Jane");
    expect(screen.getByLabelText(/age/i)).toHaveValue(32);
  });
});
