import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExerciseCard } from "@/components/exercise/exercise-card";
import type { ExerciseWithRelations } from "@/lib/ports/exercise-repository";

const mockExercise: ExerciseWithRelations = {
  id: "ex-1",
  name: "Barbell Bench Press",
  nameEs: "Press de banca con barra",
  slug: "barbell-bench-press",
  instructions: "Lie on bench, grip bar wider than shoulder width.",
  gifUrl: "https://example.com/bench.gif",
  bodyPart: "chest",
  category: "strength",
  muscle: "pectorals",
  muscleGroupId: "mg-1",
  muscleGroup: {
    id: "mg-1",
    name: "Chest",
    nameEs: "Pecho",
    category: "chest",
  },
  equipmentId: "eq-1",
  equipment: {
    id: "eq-1",
    name: "Barbell",
    nameEs: "Barra",
  },
  media: [
    {
      id: "m-1",
      type: "gif",
      url: "https://example.com/bench.gif",
      isPrimary: true,
    },
  ],
};

describe("ExerciseCard", () => {
  it("renders exercise name in English", () => {
    render(<ExerciseCard exercise={mockExercise} />);
    expect(screen.getByText("Barbell Bench Press")).toBeInTheDocument();
  });

  it("renders exercise name in Spanish", () => {
    render(<ExerciseCard exercise={mockExercise} />);
    expect(screen.getByText("Press de banca con barra")).toBeInTheDocument();
  });

  it("renders muscle group badge", () => {
    render(<ExerciseCard exercise={mockExercise} />);
    expect(screen.getByText("Pecho")).toBeInTheDocument();
  });

  it("renders equipment badge", () => {
    render(<ExerciseCard exercise={mockExercise} />);
    expect(screen.getByText("Barra")).toBeInTheDocument();
  });

  it("renders body part badge", () => {
    render(<ExerciseCard exercise={mockExercise} />);
    expect(screen.getByText("chest")).toBeInTheDocument();
  });

  it("renders category badge", () => {
    render(<ExerciseCard exercise={mockExercise} />);
    expect(screen.getByText("strength")).toBeInTheDocument();
  });

  it("renders instructions preview", () => {
    render(<ExerciseCard exercise={mockExercise} />);
    expect(
      screen.getByText(/Lie on bench, grip bar/)
    ).toBeInTheDocument();
  });

  it("renders without optional fields", () => {
    const minimal: ExerciseWithRelations = {
      id: "ex-2",
      name: "Plank",
      nameEs: null,
      slug: null,
      instructions: null,
      gifUrl: null,
      bodyPart: null,
      category: null,
      muscle: null,
      muscleGroupId: null,
      muscleGroup: null,
      equipmentId: null,
      equipment: null,
      media: [],
    };

    render(<ExerciseCard exercise={minimal} />);
    expect(screen.getByText("Plank")).toBeInTheDocument();
  });
});
