"use client";

import { track as vercelTrack } from "@vercel/analytics";
import type { AnalyticsEvent } from "@/lib/analytics/events";

const ID_KEY = "ascendume_aid";

/** A random id kept in this browser, so returning visits can be counted without cookies. */
export function anonymousId(): string {
  try {
    let id = localStorage.getItem(ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ID_KEY, id);
    }
    return id;
  } catch {
    return "storage-unavailable";
  }
}

/** Records one of the allowed analytics events (DB count + Vercel Analytics). Never throws. */
export function track<E extends AnalyticsEvent>(name: E["name"], props: E["props"]): void {
  try {
    vercelTrack(name, props);
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, props, anonymousId: anonymousId() }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Analytics must never break the app.
  }
}
