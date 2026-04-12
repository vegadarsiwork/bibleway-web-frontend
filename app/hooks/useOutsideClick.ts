import { useEffect, type RefObject } from "react";

/**
 * Hook that detects clicks outside a referenced element and fires a callback.
 *
 * Commonly used for closing dropdown menus, reaction pickers, and modals.
 */
export function useOutsideClick(
  ref: RefObject<HTMLElement | null>,
  callback: () => void,
): void {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ref, callback]);
}
