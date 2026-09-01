import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CoachFab } from "./coach-fab";

describe("CoachFab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a floating action button", () => {
    render(<CoachFab onClick={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /open coach/i }),
    ).toBeInTheDocument();
  });

  it("calls onClick when activated", () => {
    const onClick = vi.fn();
    render(<CoachFab onClick={onClick} />);

    fireEvent.click(screen.getByRole("button", { name: /open coach/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is fixed and positioned above the bottom navigation", () => {
    const { container } = render(<CoachFab onClick={vi.fn()} />);
    const button = container.firstChild as HTMLElement;

    expect(button.className).toContain("fixed");
    expect(button.className).toContain("bottom-24");
    expect(button.className).toContain("right-4");
    expect(button.className).toContain("z-40");
  });
});
