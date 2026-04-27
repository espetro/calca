import { useEffect, useState } from "react";

interface ViewportSize {
  width: number;
  height: number;
}

const DEFAULT_SIZE: ViewportSize = { height: 0, width: 0 };

export function useViewportSize(): ViewportSize {
  const [size, setSize] = useState<ViewportSize>(DEFAULT_SIZE);

  useEffect(() => {
    if (typeof window === "undefined") {return;}

    const updateSize = () => {
      setSize({
        height: window.innerHeight,
        width: window.innerWidth,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  return size;
}
