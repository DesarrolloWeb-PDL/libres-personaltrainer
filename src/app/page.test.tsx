import { test, expect } from "vitest";
import { render, screen } from "@/__tests__/test-utils";
import Home from "@/app/page";

test("renders home page", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { name: /libres personal trainer/i })).toBeInTheDocument();
});
