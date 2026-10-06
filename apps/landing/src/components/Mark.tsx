interface MarkProps {
  /** Render the "calca" wordmark next to the mark. */
  withWordmark?: boolean;
  /** Pixel size of the square mark. */
  size?: number;
  className?: string;
}

/** Calca logotype: the layered-C mark plus the Bricolage wordmark. */
export function Mark({ withWordmark = false, size = 28, className = "" }: MarkProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img src="/logo.png" alt="" width={size} height={size} aria-hidden="true" />
      {withWordmark ? (
        <span className="font-brand text-[1.35rem] font-bold leading-none tracking-[-0.03em]">
          calca
        </span>
      ) : null}
    </span>
  );
}
