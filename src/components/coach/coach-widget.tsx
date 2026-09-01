"use client";

import { useState } from "react";
import { api } from "@/lib/api/trpc-client";
import { CoachFab } from "./coach-fab";
import { CoachDrawer } from "./coach-drawer";

/**
 * Coach widget that gates the floating action button by server availability.
 *
 * - Fetches coach.getAvailability to decide whether to render the FAB.
 * - Owns the open/close state of the chat drawer.
 * - Mounted once in the dashboard layout so it appears on every dashboard page.
 */
export function CoachWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const availability = api.coach.getAvailability.useQuery();

  if (!availability.data?.enabled) {
    return null;
  }

  return (
    <>
      <CoachFab onClick={() => setIsOpen(true)} />
      <CoachDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
