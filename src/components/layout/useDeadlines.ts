"use client";

import { useSyncExternalStore } from "react";
import { upcoming, type Deadline } from "@/lib/deadlines";

/**
 * The upcoming deadlines for the bell, read once per page load from
 * /deadlines.json (which the server caches for an hour) and shared by every
 * bell on the page. `null` until the list has arrived. If the request fails
 * the list is empty, so the bell shows its empty state and nothing breaks.
 */
let deadlines: Deadline[] | null = null;
let started = false;
const listeners = new Set<() => void>();

function load() {
  if (started) return;
  started = true;
  fetch("/deadlines.json")
    .then((response) => (response.ok ? response.json() : { deadlines: [] }))
    .then((body: { deadlines?: Deadline[] }) => (Array.isArray(body.deadlines) ? body.deadlines : []))
    .catch(() => [] as Deadline[])
    .then((list) => {
      deadlines = list;
      listeners.forEach((listener) => listener());
    });
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  load();
  return () => {
    listeners.delete(onChange);
  };
}

/** Deadlines that haven't passed, soonest first; `null` while loading. */
export function useDeadlines(): Deadline[] | null {
  const list = useSyncExternalStore(
    subscribe,
    () => deadlines,
    () => null,
  );
  return list ? upcoming(list) : null;
}
