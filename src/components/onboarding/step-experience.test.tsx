import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StepExperience } from "./step-experience";
import type { WizardData } from "@/hooks/use-wizard-state";

describe("StepExperience", () => {
  const defaultProps = {
    data: {} as WizardData,
    onUpdate: vi.fn(),
  };

  it("renders the step heading", () => {
    render(<StepExperience {...defaultProps} />);
    expect(screen.getByText("Experience Level")).toBeInTheDocument();
  });

  it("renders all three experience levels", () => {
    render(<StepExperience {...defaultProps} />);
    expect(screen.getByText("Beginner")).toBeInTheDocument();
    expect(screen.getByText("Intermediate")).toBeInTheDocument();
    expect(screen.getByText("Advanced")).toBeInTheDocument();
  });

  it("calls onUpdate when a level is selected", () => {
    const onUpdate = vi.fn();
    render(<StepExperience data={{}} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByText("Intermediate"));

    expect(onUpdate).toHaveBeenCalledWith({
      experienceLevel: "intermediate",
    });
  });

  it("shows selected level as checked", () => {
    render(<StepExperience data={{ experienceLevel: "advanced" }} onUpdate={vi.fn()} />);

    const radio = screen.getByDisplayValue("advanced");
    expect(radio).toBeChecked();
  });

  it("renders descriptions for each level", () => {
    render(<StepExperience {...defaultProps} />);
    expect(screen.getByText(/New to weight training/)).toBeInTheDocument();
    expect(screen.getByText(/6–18 months of consistent training/)).toBeInTheDocument();
    expect(screen.getByText(/2\+ years of serious training/)).toBeInTheDocument();
  });
});
