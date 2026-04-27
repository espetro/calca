import { useEffect, RefObject } from "react";

export function useClickOutside(
  refs: RefObject<HTMLElement | null>[],
  isActive: boolean,
  onClickOutside: () => void,
) {
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const clickedInside = refs.some(
        (ref) => ref.current && ref.current.contains(e.target as Node),
      );
      if (!clickedInside) {
        onClickOutside();
      }
    };

    if (isActive) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isActive, onClickOutside, refs]);
}
