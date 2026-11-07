"use client";

import { useEffect, useRef } from "react";
import { useSidebar } from "@/components/ui/sidebar";

/** From the phone layout (below 768 px, where the sidebar is a sheet) up to where the reader has room beside it. */
export const TABLET = "(min-width: 768px) and (max-width: 1023.98px)";

/**
 * Gives the reader the whole width on tablets: collapses the sidebar while the reader is shown and opens it again
 * when the reader goes away, if it was open. Kept-alive pages run this again when they are shown.
 */
export function CollapseSidebarOnTablet() {
  const { open, setOpen } = useSidebar();
  const current = useRef({ open, setOpen });

  useEffect(() => {
    current.current = { open, setOpen };
  });

  useEffect(() => {
    if (!current.current.open || !window.matchMedia(TABLET).matches) {
      return;
    }
    current.current.setOpen(false);
    return () => current.current.setOpen(true);
  }, []);

  return null;
}
