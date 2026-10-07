import { useEffect, useState } from "react";

/**
 * Resolves a CSS custom property to a computed value string, re-reading when
 * the document's theme classes change (e.g. `.dark` toggled on <html>).
 * Needed for consumers that can't use var() — React Flow's <Background>
 * applies `color` as an SVG paint attribute where var() doesn't resolve.
 */
export function useResolvedCssVar(name: string, fallback = ""): string {
  const [value, setValue] = useState(fallback);

  useEffect(() => {
    const read = () => {
      const resolved = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      setValue(resolved || fallback);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributeFilter: ["class", "style"],
      attributes: true,
    });
    return () => observer.disconnect();
  }, [name, fallback]);

  return value;
}
