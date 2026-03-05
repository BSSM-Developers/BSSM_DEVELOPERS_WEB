"use client";

export const ROUTE_TRANSITION_START_EVENT = "bsdev:route-transition-start";

export function startRouteTransitionLoading() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ROUTE_TRANSITION_START_EVENT));
}
