import { test, expect, vi } from "vitest";
import { redirect } from "next/navigation";
import Home from "@/app/page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

test("redirects to dashboard", () => {
  Home();
  expect(redirect).toHaveBeenCalledWith("/dashboard");
});
