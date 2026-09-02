import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SubstitutionSheet } from "./substitution-sheet";

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

describe("SubstitutionSheet", () => {
  const baseProps = {
    isOpen: true,
    onClose: vi.fn(),
    userId: "user-1",
    workoutExerciseId: "we-1",
    exerciseId: "ex-1",
    exerciseName: "Barbell Bench Press",
    onApplied: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when closed", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    });
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(<SubstitutionSheet {...baseProps} isOpen={false} />);

    expect(screen.queryByTestId("substitution-sheet")).toBeNull();
  });

  it("shows a loading state while suggestions load", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(<SubstitutionSheet {...baseProps} />);

    expect(screen.getByText("Buscando alternativas...")).toBeInTheDocument();
  });

  it("shows an explicit empty state when no alternatives exist", () => {
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

    render(<SubstitutionSheet {...baseProps} />);

    expect(
      screen.getByText("No hay alternativas disponibles"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("no-alternatives")).toBeInTheDocument();
  });

  it("renders up to 3 suggestions", () => {
    mockUseQuery.mockReturnValue({
      data: {
        suggestions: [
          {
            id: "ex-2",
            name: "Dumbbell Bench Press",
            nameEs: "Press con mancuernas",
            muscleGroupName: "Chest",
            equipmentName: "Dumbbell",
            isCompound: true,
            matchesProfile: true,
          },
          {
            id: "ex-3",
            name: "Push-up",
            nameEs: "Flexión",
            muscleGroupName: "Chest",
            equipmentName: "Bodyweight",
            isCompound: true,
            matchesProfile: true,
          },
          {
            id: "ex-4",
            name: "Cable Fly",
            nameEs: "Aperturas en polea",
            muscleGroupName: "Chest",
            equipmentName: "Cable",
            isCompound: false,
            matchesProfile: false,
          },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(<SubstitutionSheet {...baseProps} />);

    expect(screen.getByText("Press con mancuernas")).toBeInTheDocument();
    expect(screen.getByText("Flexión")).toBeInTheDocument();
    expect(screen.getByText("Aperturas en polea")).toBeInTheDocument();
  });

  it("calls apply substitution and onApplied when a suggestion is tapped", async () => {
    const mutate = vi.fn();
    const onApplied = vi.fn();
    const onClose = vi.fn();

    mockUseQuery.mockReturnValue({
      data: {
        suggestions: [
          {
            id: "ex-2",
            name: "Dumbbell Bench Press",
            nameEs: "Press con mancuernas",
            muscleGroupName: "Chest",
            equipmentName: "Dumbbell",
            isCompound: true,
            matchesProfile: true,
          },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    let onSuccessCallback: (() => void) | undefined;
    mockUseMutation.mockImplementation((options?: { onSuccess?: () => void }) => {
      onSuccessCallback = options?.onSuccess;
      return {
        mutate,
        isPending: false,
      };
    });

    render(
      <SubstitutionSheet
        {...baseProps}
        onApplied={onApplied}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByText("Press con mancuernas"));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        workoutExerciseId: "we-1",
        newExerciseId: "ex-2",
      });
    });

    // Simulate mutation success
    onSuccessCallback?.();

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
      expect(onApplied).toHaveBeenCalled();
    });
  });

  it("closes on backdrop click", () => {
    const onClose = vi.fn();

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

    render(<SubstitutionSheet {...baseProps} onClose={onClose} />);

    fireEvent.click(screen.getByTestId("substitution-sheet").firstChild!);
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on X button click", () => {
    const onClose = vi.fn();

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

    render(<SubstitutionSheet {...baseProps} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText("Close substitution sheet"));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows error state when suggestion query fails", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Network error"),
    });
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(<SubstitutionSheet {...baseProps} />);

    expect(
      screen.getByText("No se pudieron cargar las alternativas."),
    ).toBeInTheDocument();
  });

  it("only enables suggestions query while open", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    });
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(<SubstitutionSheet {...baseProps} isOpen={false} />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      { userId: "user-1", exerciseId: "ex-1" },
      { enabled: false },
    );
  });
});
