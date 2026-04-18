import { useEffect } from "react";

export function useWindowEvent<K extends keyof GlobalEventHandlersEventMap>(
  eventName: K,
  handler: (event: GlobalEventHandlersEventMap[K]) => void,
): void;
export function useWindowEvent(
  eventName: string,
  handler: (event: Event) => void,
): void;

export function useWindowEvent(
  eventName: string,
  handler: (event: Event) => void,
): void {
  useEffect(() => {
    if (typeof window === "undefined") return;

    window.addEventListener(eventName, handler);

    return () => {
      window.removeEventListener(eventName, handler);
    };
  }, [eventName, handler]);
}
