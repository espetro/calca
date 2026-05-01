import { useEffect } from "react";

// oxlint-disable-next-line
export function useMountEffect(effect: () => void | (() => void)) {
  useEffect(effect, []);
}
