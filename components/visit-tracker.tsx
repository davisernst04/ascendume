"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/track";

const KEY = "ascendume_visited";

/** Records `visited` once per browser session. */
export function VisitTracker() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY)) return;
      sessionStorage.setItem(KEY, "1");
    } catch {
      // No storage: count the page load anyway.
    }
    track("visited", {});
  }, []);
  return null;
}
