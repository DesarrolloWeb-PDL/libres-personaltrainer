import { describe, it, expect, vi } from "vitest";
import { VolumeLandmarks } from "@/components/progress/volume-landmarks";
import { OverreachingWarning } from "@/components/progress/overreaching-warning";
import { DeloadRecommendation } from "@/components/progress/deload-recommendation";
import { render, screen } from "@testing-library/react";

describe("Volume Landmarks Component", () => {
  const mockStatuses = [
    {
      muscleGroup: "chest" as const,
      status: "optimal" as const,
      sets: 14,
      volumeLoad: 4200,
      landmarks: { muscleGroup: "chest" as const, MEV: 10, MAV: 16, MRV: 20 },
    },
    {
      muscleGroup: "back" as const,
      status: "undertraining" as const,
      sets: 6,
      volumeLoad: 1800,
      landmarks: { muscleGroup: "back" as const, MEV: 8, MAV: 12, MRV: 16 },
    },
  ];

  it("renders empty state when no statuses", () => {
    render(<VolumeLandmarks statuses={[]} />);
    expect(screen.getByText("No volume data yet. Complete workouts to see volume status.")).toBeTruthy();
  });

  it("renders muscle group cards", () => {
    render(<VolumeLandmarks statuses={mockStatuses} />);
    expect(screen.getByText("Chest")).toBeTruthy();
    expect(screen.getByText("Back")).toBeTruthy();
  });

  it("shows status indicators", () => {
    render(<VolumeLandmarks statuses={mockStatuses} />);
    expect(screen.getByText("Optimal")).toBeTruthy();
    expect(screen.getByText("Undertraining")).toBeTruthy();
  });

  it("displays landmark values", () => {
    render(<VolumeLandmarks statuses={mockStatuses} />);
    expect(screen.getByText("MEV: 10")).toBeTruthy();
    expect(screen.getByText("MAV: 16")).toBeTruthy();
    expect(screen.getByText("MRV: 20")).toBeTruthy();
  });
});

describe("Overreaching Warning Component", () => {
  it("renders nothing when no overreaching muscles", () => {
    const { container } = render(
      <OverreachingWarning overreachingMuscles={[]} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("shows warning for overreaching muscles", () => {
    render(
      <OverreachingWarning
        overreachingMuscles={[
          { muscleGroup: "quadriceps", status: "overreaching", sets: 22 },
        ]}
      />
    );
    expect(screen.getByText("Overreaching Detected")).toBeTruthy();
    expect(screen.getByText(/Quadriceps/)).toBeTruthy();
  });

  it("shows multiple overreaching muscles", () => {
    render(
      <OverreachingWarning
        overreachingMuscles={[
          { muscleGroup: "quadriceps", status: "overreaching", sets: 22 },
          { muscleGroup: "chest", status: "overreaching", sets: 24 },
        ]}
      />
    );
    expect(screen.getByText(/Quadriceps, Chest/)).toBeTruthy();
  });

  it("calls onDismiss when dismiss button is clicked", () => {
    const onDismiss = vi.fn();
    render(
      <OverreachingWarning
        overreachingMuscles={[
          { muscleGroup: "chest", status: "overreaching", sets: 24 },
        ]}
        onDismiss={onDismiss}
      />
    );
    // Find and click the dismiss button
    const dismissButton = screen.getByLabelText("Dismiss warning");
    dismissButton.click();
    expect(onDismiss).toHaveBeenCalled();
  });
});

describe("Deload Recommendation Component", () => {
  const baseData = {
    recommendation: "continue" as const,
    reason: "You're in a good training rhythm.",
    weeksSinceDeload: 3,
    lastDeloadWeek: "2026-W31",
    totalDeloads: 2,
  };

  it("renders continue status", () => {
    render(<DeloadRecommendation data={baseData} />);
    expect(screen.getByText("Continue Training")).toBeTruthy();
    expect(screen.getByText("You're in a good training rhythm.")).toBeTruthy();
  });

  it("renders deload now status", () => {
    render(
      <DeloadRecommendation
        data={{ ...baseData, recommendation: "deload_now" }}
      />
    );
    expect(screen.getByText("Deload Now")).toBeTruthy();
  });

  it("shows stats", () => {
    render(<DeloadRecommendation data={baseData} />);
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("2026-W31")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("shows action button when recommendation is not continue", () => {
    render(
      <DeloadRecommendation
        data={{ ...baseData, recommendation: "deload_now" }}
        onActivateDeload={() => {}}
      />
    );
    expect(screen.getByText("Activate Deload Week")).toBeTruthy();
  });

  it("hides action button when recommendation is continue", () => {
    render(
      <DeloadRecommendation data={baseData} onActivateDeload={() => {}} />
    );
    expect(screen.queryByText("Activate Deload Week")).toBeNull();
  });

  it("calls onActivateDeload when button is clicked", () => {
    const onActivate = vi.fn();
    render(
      <DeloadRecommendation
        data={{ ...baseData, recommendation: "deload_now" }}
        onActivateDeload={onActivate}
      />
    );
    screen.getByText("Activate Deload Week").click();
    expect(onActivate).toHaveBeenCalled();
  });
});
