import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StepEquipment } from "./step-equipment";
import type { WizardData } from "@/hooks/use-wizard-state";

describe("StepEquipment", () => {
  const defaultProps = {
    data: {} as WizardData,
    onUpdate: vi.fn(),
  };

  it("renders the step heading", () => {
    render(<StepEquipment {...defaultProps} />);
    expect(screen.getByText("Available Equipment")).toBeInTheDocument();
  });

  it("renders all three equipment options", () => {
    render(<StepEquipment {...defaultProps} />);
    expect(screen.getByText("Full Gym")).toBeInTheDocument();
    expect(screen.getByText("Home Gym")).toBeInTheDocument();
    expect(screen.getByText("Bodyweight Only")).toBeInTheDocument();
  });

  it("calls onUpdate when an option is selected", () => {
    const onUpdate = vi.fn();
    render(<StepEquipment data={{}} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByText("Home Gym"));

    expect(onUpdate).toHaveBeenCalledWith({
      equipment: "home_gym",
    });
  });

  it("shows selected equipment as checked", () => {
    render(<StepEquipment data={{ equipment: "full_gym" }} onUpdate={vi.fn()} />);

    const radio = screen.getByDisplayValue("full_gym");
    expect(radio).toBeChecked();
  });

  it("renders descriptions for each option", () => {
    render(<StepEquipment {...defaultProps} />);
    expect(screen.getByText(/Access to barbells, dumbbells/)).toBeInTheDocument();
    expect(screen.getByText(/Dumbbells, an adjustable bench/)).toBeInTheDocument();
    expect(screen.getByText(/No equipment — using bodyweight/)).toBeInTheDocument();
  });
});
