"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 5000;

/**
 * Refreshes the page every few seconds while a maintenance job is running, so its badge and latest run update on their
 * own.
 */
export function RefreshWhileRunning({ running }: { running: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!running) {
      return;
    }
    const timer = setInterval(() => router.refresh(), POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [running, router]);

  return null;
}
