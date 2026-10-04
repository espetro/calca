/**
 * Ordered index keys: a base-62 "fraction" string between two implicit
 * endpoints "" (the very start) and a top sentinel. Lexicographic string
 * comparison defines record order, so keys may only be compared as strings.
 *
 * Invariant: a key never ends in the smallest digit ("0") — otherwise
 * `"a"` and `"a0"` would be numerically equal but compare differently.
 */
const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export const isValidIndex = (key: string): boolean =>
  key.length > 0 && !key.endsWith(DIGITS[0]) && [...key].every((c) => DIGITS.includes(c));

/** Smallest index strictly between `a` and `b` ("" = unbounded side). */
const midpoint = (a: string, b: string): string => {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const digA = i < a.length ? DIGITS.indexOf(a[i]!) : 0;
  const digB = i < b.length ? DIGITS.indexOf(b[i]!) : DIGITS.length;
  if (digB - digA > 1) {
    return a.slice(0, i) + DIGITS[Math.floor((digA + digB) / 2)];
  }
  // Adjacent digits: extend on whichever side keeps us inside (a, b).
  // Taking a[i] leaves the tail unbounded above; an exhausted `a` means an
  // implied smallest-digit, so we descend into b's tail.
  const takeFromA = i < a.length;
  const headChar = takeFromA ? a[i] : DIGITS[0];
  const aTail = takeFromA ? a.slice(i + 1) : "";
  const bTail = takeFromA ? "" : b.slice(i + 1);
  return a.slice(0, i) + headChar + midpoint(aTail, bTail);
};

/** Key strictly between `a` and `b`; either may be `null` (list edge). */
export const generateKeyBetween = (a: string | null, b: string | null): string => {
  if (a !== null && !isValidIndex(a)) throw new Error(`invalid index key: ${a}`);
  if (b !== null && !isValidIndex(b)) throw new Error(`invalid index key: ${b}`);
  if (a !== null && b !== null && a >= b) throw new Error("generateKeyBetween: a must be < b");
  return midpoint(a ?? "", b ?? "");
};

export const generateNKeysBetween = (a: string | null, b: string | null, n: number): string[] => {
  if (n === 0) return [];
  const mid = generateKeyBetween(a, b);
  const lo = generateNKeysBetween(a, mid, Math.floor(n / 2));
  const hi = generateNKeysBetween(mid, b, n - Math.floor(n / 2) - 1);
  return [...lo, mid, ...hi];
};
