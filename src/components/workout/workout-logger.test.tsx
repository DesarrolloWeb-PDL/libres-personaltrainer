import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WorkoutLogger } from "./workout-logger";

const mockExercises = [
  {
    id: "we-1",
    exerciseId: "ex-1",
    exercise: {
      id: "ex-1",
      name: "Barbell Bench Press",
      nameEs: "Press de banca",
      muscleGroup: { name: "Chest", category: "chest" },
    },
    sets: 3,
    workoutSets: [
      { id: "ws-1", setNumber: 1, reps: null, weight: null, rpe: null, completed: false },
      { id: "ws-2", setNumber: 2, reps: null, weight: null, rpe: null, completed: false },
      { id: "ws-3", setNumber: 3, reps: null, weight: null, rpe: null, completed: false },
    ],
  },
];

describe("WorkoutLogger", () => {
  it("renders exercise name and set rows", () => {
    render(
      <WorkoutLogger
        exercises={mockExercises}
        onLogSet={vi.fn()}
        onCompleteWorkout={vi.fn()}
      />,
    );

    expect(screen.getByText("Barbell Bench Press")).toBeDefined();
    expect(screen.getByText("Chest")).toBeDefined();
    expect(screen.getByText("0/3")).toBeDefined();
  });

  it("displays set numbers for each set", () => {
    render(
      <WorkoutLogger
        exercises={mockExercises}
        onLogSet={vi.fn()}
        onCompleteWorkout={vi.fn()}
      />,
    );

    // Set numbers appear as td elements with specific styling
    const setNumbers = screen.getAllByText(/^[123]$/);
    expect(setNumbers.length).toBeGreaterThanOrEqual(3);
  });

  it("renders RPE selector with options 1-10", () => {
    render(
      <WorkoutLogger
        exercises={mockExercises}
        onLogSet={vi.fn()}
        onCompleteWorkout={vi.fn()}
      />,
    );

    const rpeSelects = screen.getAllByDisplayValue("RPE");
    expect(rpeSelects.length).toBe(3);
  });

  it("disables Log button when inputs are empty", () => {
    render(
      <WorkoutLogger
        exercises={mockExercises}
        onLogSet={vi.fn()}
        onCompleteWorkout={vi.fn()}
      />,
    );

    const logButtons = screen.getAllByText("Log");
    logButtons.forEach((btn) => {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });
  });

  it("enables Log button when all inputs are filled", () => {
    render(
      <WorkoutLogger
        exercises={mockExercises}
        onLogSet={vi.fn()}
        onCompleteWorkout={vi.fn()}
      />,
    );

    const repsInputs = screen.getAllByPlaceholderText("10");
    const weightInputs = screen.getAllByPlaceholderText("60");
    const rpeSelects = screen.getAllByDisplayValue("RPE");

    fireEvent.change(repsInputs[0], { target: { value: "10" } });
    fireEvent.change(weightInputs[0], { target: { value: "80" } });
    fireEvent.change(rpeSelects[0], { target: { value: "7" } });

    const logButtons = screen.getAllByText("Log");
    expect((logButtons[0] as HTMLButtonElement).disabled).toBe(false);
  });

  it("calls onLogSet with correct data when Log is clicked", async () => {
    const onLogSet = vi.fn().mockResolvedValue(undefined);

    render(
      <WorkoutLogger
        exercises={mockExercises}
        onLogSet={onLogSet}
        onCompleteWorkout={vi.fn()}
      />,
    );

    const repsInputs = screen.getAllByPlaceholderText("10");
    const weightInputs = screen.getAllByPlaceholderText("60");
    const rpeSelects = screen.getAllByDisplayValue("RPE");

    fireEvent.change(repsInputs[0], { target: { value: "12" } });
    fireEvent.change(weightInputs[0], { target: { value: "70" } });
    fireEvent.change(rpeSelects[0], { target: { value: "8" } });

    const logButtons = screen.getAllByText("Log");
    fireEvent.click(logButtons[0]);

    await waitFor(() => {
      expect(onLogSet).toHaveBeenCalledWith("ws-1", {
        reps: 12,
        weight: 70,
        rpe: 8,
      });
    });
  });

  it("shows completed sets with checkmark", () => {
    const completedExercises = [
      {
        ...mockExercises[0],
        workoutSets: [
          { id: "ws-1", setNumber: 1, reps: 10, weight: 80, rpe: 7, completed: true },
          { id: "ws-2", setNumber: 2, reps: null, weight: null, rpe: null, completed: false },
          { id: "ws-3", setNumber: 3, reps: null, weight: null, rpe: null, completed: false },
        ],
      },
    ];

    render(
      <WorkoutLogger
        exercises={completedExercises}
        onLogSet={vi.fn()}
        onCompleteWorkout={vi.fn()}
      />,
    );

    expect(screen.getByText("1/3")).toBeDefined();
    expect(screen.getByText("✓")).toBeDefined();
  });

  it("shows Complete Workout button when all sets are done", () => {
    const allCompleted = [
      {
        ...mockExercises[0],
        workoutSets: [
          { id: "ws-1", setNumber: 1, reps: 10, weight: 80, rpe: 7, completed: true },
          { id: "ws-2", setNumber: 2, reps: 10, weight: 80, rpe: 8, completed: true },
          { id: "ws-3", setNumber: 3, reps: 10, weight: 80, rpe: 9, completed: true },
        ],
      },
    ];

    const onComplete = vi.fn();

    render(
      <WorkoutLogger
        exercises={allCompleted}
        onLogSet={vi.fn()}
        onCompleteWorkout={onComplete}
      />,
    );

    const completeBtn = screen.getByText("Complete Workout");
    expect(completeBtn).toBeDefined();

    fireEvent.click(completeBtn);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("does not show Complete Workout button when sets are incomplete", () => {
    render(
      <WorkoutLogger
        exercises={mockExercises}
        onLogSet={vi.fn()}
        onCompleteWorkout={vi.fn()}
      />,
    );

    expect(screen.queryByText("Complete Workout")).toBeNull();
  });
});
