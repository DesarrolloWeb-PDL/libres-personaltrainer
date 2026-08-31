"use client";

import { useState, useEffect } from "react";

/**
 * Returns the current Date only after client hydration.
 * During SSR/initial render, returns null — preventing hydration mismatches.
 * Use this instead of `new Date()` in render paths.
 */
export function useClientDate(): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  return now;
}

/**
 * Returns a stable date string for display, avoiding hydration mismatch.
 * During SSR returns a placeholder — client fills it in after hydration.
 */
export function useClientDateString(
  format: "date" | "time" | "datetime" = "date",
): string {
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    const d = new Date();
    switch (format) {
      case "time":
        setFormatted(d.toLocaleTimeString());
        break;
      case "datetime":
        setFormatted(`${d.toLocaleDateString()} at ${d.toLocaleTimeString()}`);
        break;
      default:
        setFormatted(d.toLocaleDateString());
    }
  }, [format]);

  return formatted;
}

/**
 * Format a known timestamp for display, avoiding hydration mismatch.
 * Returns placeholder on first render, real formatted string after hydration.
 */
export function useFormattedDate(
  isoString: string | null | undefined,
  format: "date" | "time" | "datetime" = "date",
): string {
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    if (!isoString) return;
    const d = new Date(isoString);
    switch (format) {
      case "time":
        setFormatted(d.toLocaleTimeString());
        break;
      case "datetime":
        setFormatted(`${d.toLocaleDateString()} at ${d.toLocaleTimeString()}`);
        break;
      default:
        setFormatted(d.toLocaleDateString());
    }
  }, [isoString, format]);

  return formatted;
}
