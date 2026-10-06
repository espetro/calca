import { useEffect, useState } from "react";

/** Re-render on a fixed interval while `active`. For live elapsed-time displays. */
export const useNow = (intervalMs: number, active = true): number => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) {
      return;
    }
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, active]);

  return now;
};
