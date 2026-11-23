interface Props {
  label: string;
  value: number;
  total: number;
  /** Called on every snap as the thumb moves. */
  onChange: (n: number) => void;
  onSnap?: () => void;
}

/**
 * A timeline scrubber: drag to move through the six rungs or the six days.
 * Native range input under the paint, so it keeps keyboard support, momentum on
 * iOS, and vertical page scrolling while the finger is on it (touch-action: pan-y).
 */
export function Timeline({ label, value, total, onChange, onSnap }: Props) {
  const pct = total > 1 ? ((value - 1) / (total - 1)) * 100 : 0;
  return (
    <div className="timeline">
      <div className="timeline-head">
        <span className="micro">{label}</span>
        <span className="timeline-now num">
          <b>{value}</b>
          <span>/{total}</span>
        </span>
      </div>
      <div className="timeline-wrap" style={{ ["--pct" as string]: `${pct}%` }}>
        <input
          type="range"
          min={1}
          max={total}
          step={1}
          value={value}
          onChange={(e) => {
            const next = Number(e.target.value);
            if (next === value) return;
            onChange(next);
            onSnap?.();
          }}
          aria-label={label}
          aria-valuetext={`${label} ${value} of ${total}`}
        />
      </div>
      <div className="timeline-scale" aria-hidden>
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
          <span key={n} className={n === value ? "is-on" : undefined}>
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}
