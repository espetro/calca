interface MarkProps {
  /** Render the "calca" wordmark next to the mark. */
  withWordmark?: boolean;
  /** Pixel size of the square mark. */
  size?: number;
  className?: string;
}

/**
 * Calca logotype: a canvas frame (outline, with its dot grid) and a
 * generated frame in the accent colour sliding over it.
 */
export function Mark({ withWordmark = false, size = 28, className = "" }: MarkProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        {/* canvas frame */}
        <rect
          x="2.6"
          y="2.6"
          width="21.4"
          height="21.4"
          rx="5.6"
          stroke="currentColor"
          strokeWidth="2.4"
        />
        {/* canvas dots */}
        <circle cx="8" cy="8" r="1.2" fill="currentColor" opacity="0.8" />
        <circle cx="13" cy="8" r="1.2" fill="currentColor" opacity="0.8" />
        <circle cx="8" cy="13" r="1.2" fill="currentColor" opacity="0.8" />
        {/* generated frame */}
        <rect x="13.4" y="13.4" width="16.2" height="16.2" rx="4.8" className="fill-primary" />
      </svg>
      {withWordmark ? (
        <span className="font-brand text-[1.35rem] font-bold leading-none tracking-[-0.03em]">
          calca
        </span>
      ) : null}
    </span>
  );
}
