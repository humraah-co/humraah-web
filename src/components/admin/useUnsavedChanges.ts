"use client";

import { useEffect } from "react";

const MESSAGE = "You have changes that aren’t saved. Leave this page without saving them?";

/**
 * While `dirty`, asks before the person leaves: the browser's own prompt for
 * closing the tab, reloading or going to another site, and a confirm box for
 * links inside the workspace (Next navigates those without unloading the page).
 */
export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Older browsers need returnValue set to show the prompt.
      event.returnValue = "";
    };

    // Capture phase, so it runs before Next's <Link> handles the click.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download"))
        return;
      const url = new URL(link.href, window.location.href);
      // Other sites unload the page, so beforeunload asks instead.
      if (url.origin !== window.location.origin) return;
      // Links within the page, like the error summary's.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (!window.confirm(MESSAGE)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);
}
