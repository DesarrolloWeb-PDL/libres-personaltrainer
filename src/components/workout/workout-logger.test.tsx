import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WorkoutLogger } from "./workout-logger";

const { mockUseQuery, mockUseMutation } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockUseMutation: vi.fn(),
}));

vi.mock("@/lib/api/trpc-client", () => ({
  api: {
    session: {
      getSuggestions: {
        useQuery: (...args: unknown[]) => mockUseQuery(...args),
      },
      applySubstitution: {
        useMutation: (options?: { onSuccess?: () => void }) =>
          mockUseMutation(options),
      },
    },
  },
}));

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
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({
      data: { suggestions: [] },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it("renders exercise name and set rows", () => {
    render(
      <WorkoutLogger exercises={mockExercises} onLogSet={vi.fn()} onCompleteWorkout={vi.fn()} />,
    );

    expect(screen.getByText("Barbell Bench Press")).toBeDefined();
    expect(screen.getByText("Chest")).toBeDefined();
    expect(screen.getByText("0/3")).toBeDefined();
  });

  it("displays set numbers for each set", () => {
    render(
      <WorkoutLogger exercises={mockExercises} onLogSet={vi.fn()} onCompleteWorkout={vi.fn()} />,
    );

    const setNumbers = screen.getAllByText(/^[123]$/);
    expect(setNumbers.length).toBeGreaterThanOrEqual(3);
  });

  it("renders RPE selector with options 1-10", () => {
    render(
      <WorkoutLogger exercises={mockExercises} onLogSet={vi.fn()} onCompleteWorkout={vi.fn()} />,
    );

    const rpeSelects = screen.getAllByDisplayValue("RPE");
    expect(rpeSelects.length).toBe(3);
  });

  it("calls onLogSet with correct data when Complete Set is clicked", async () => {
    const onLogSet = vi.fn().mockResolvedValue(undefined);

    render(
      <WorkoutLogger exercises={mockExercises} onLogSet={onLogSet} onCompleteWorkout={vi.fn()} />,
    );

    // Use +/- buttons to set values
    const increaseRepsButtons = screen.getAllByLabelText("Increase reps");
    const increaseWeightButtons = screen.getAllByLabelText("Increase weight");

    // Click increase buttons to set values
    // Weight: 5 clicks × 2.5 = 12.5
    for (let i = 0; i < 5; i++) {
      fireEvent.click(increaseWeightButtons[0]);
    }
    // Reps: 10 clicks × 1 = 10
    for (let i = 0; i < 10; i++) {
      fireEvent.click(increaseRepsButtons[0]);
    }

    // Set RPE
    const rpeSelects = screen.getAllByDisplayValue("RPE");
    fireEvent.change(rpeSelects[0], { target: { value: "8" } });

    // Click Complete Set
    const completeButtons = screen.getAllByText("Complete Set");
    fireEvent.click(completeButtons[0]);

    await waitFor(() => {
      expect(onLogSet).toHaveBeenCalledWith("ws-1", {
        reps: 10,
        weight: 12.5,
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
      <WorkoutLogger exercises={allCompleted} onLogSet={vi.fn()} onCompleteWorkout={onComplete} />,
    );

    const completeBtn = screen.getByText("Complete Workout");
    expect(completeBtn).toBeDefined();

    fireEvent.click(completeBtn);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("does not show Complete Workout button when sets are incomplete", () => {
    render(
      <WorkoutLogger exercises={mockExercises} onLogSet={vi.fn()} onCompleteWorkout={vi.fn()} />,
    );

    expect(screen.queryByText("Complete Workout")).toBeNull();
  });

  it("shows Cambiar button when userId is provided", () => {
    render(
      <WorkoutLogger
        exercises={mockExercises}
        userId="user-1"
        onLogSet={vi.fn()}
        onCompleteWorkout={vi.fn()}
        onSubstitutionApplied={vi.fn()}
      />,
    );

    expect(screen.getByText("Cambiar")).toBeInTheDocument();
  });

  it("does not show Cambiar button when userId is missing", () => {
    render(
      <WorkoutLogger
        exercises={mockExercises}
        onLogSet={vi.fn()}
        onCompleteWorkout={vi.fn()}
      />,
    );

    expect(screen.queryByText("Cambiar")).toBeNull();
  });

  it("opens substitution sheet when Cambiar is clicked", () => {
    render(
      <WorkoutLogger
        exercises={mockExercises}
        userId="user-1"
        onLogSet={vi.fn()}
        onCompleteWorkout={vi.fn()}
        onSubstitutionApplied={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Cambiar"));

    expect(
      screen.getByText("No hay alternativas disponibles"),
    ).toBeInTheDocument();
  });

  it("shows Cambiar button when userId is provided", () => {
    render(
      <WorkoutLogger
        exercises={mockExercises}
        userId="user-1"
        onLogSet={vi.fn()}
        onCompleteWorkout={vi.fn()}
        onSubstitutionApplied={vi.fn()}
      />,
    );

    expect(screen.getByText("Cambiar")).toBeInTheDocument();
  });

  it("does not show Cambiar button when userId is missing", () => {
    render(
      <WorkoutLogger
        exercises={mockExercises}
        onLogSet={vi.fn()}
        onCompleteWorkout={vi.fn()}
      />,
    );

    expect(screen.queryByText("Cambiar")).toBeNull();
  });

  it("opens substitution sheet when Cambiar is clicked", () => {
    render(
      <WorkoutLogger
        exercises={mockExercises}
        userId="user-1"
        onLogSet={vi.fn()}
        onCompleteWorkout={vi.fn()}
        onSubstitutionApplied={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Cambiar"));

    expect(
      screen.getByText("No hay alternativas disponibles"),
    ).toBeInTheDocument();
  });

  it("shows Cambiar button when userId is provided", () => {
    render(
      <WorkoutLogger
        exercises={mockExercises}
        userId="user-1"
        onLogSet={vi.fn()}
        onCompleteWorkout={vi.fn()}
        onSubstitutionApplied={vi.fn()}
      />,
    );

    expect(screen.getByText("Cambiar")).toBeInTheDocument();
  });

  it("does not show Cambiar button when userId is missing", () => {
    render(
      <WorkoutLogger
        exercises={mockExercises}
        onLogSet={vi.fn()}
        onCompleteWorkout={vi.fn()}
      />,
    );

    expect(screen.queryByText("Cambiar")).toBeNull();
  });

  it("opens substitution sheet when Cambiar is clicked", () => {
    render(
      <WorkoutLogger
        exercises={mockExercises}
        userId="user-1"
        onLogSet={vi.fn()}
        onCompleteWorkout={vi.fn()}
        onSubstitutionApplied={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Cambiar"));

    expect(
      screen.getByText("No hay alternativas disponibles"),
    ).toBeInTheDocument();
  });
});
