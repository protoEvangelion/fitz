import { SORENESS, SORENESS_SET_DELTA, sorenessEntry } from "../state/types";

interface Props {
  value: number;
  /** Sets from the formula, before the check-in is applied. */
  baseSets: number;
  /** Sets after the check-in is applied. */
  planned: number;
  onChange: (value: number) => void;
}

/**
 * Soreness check-in, 2 (no pump) to -2 (very sore), default 1. Higher means more
 * recovered, so the slider adds a set on 2 and removes one or two on -1 / -2.
 */
export function SorenessSlider({ value, baseSets, planned, onChange }: Props) {
  const index = 2 - value; // 0 at 2, 4 at -2, so the healthy end is on the left
  const pct = (index / 4) * 100;
  const entry = sorenessEntry(value);
  const delta = SORENESS_SET_DELTA[value] ?? 0;

  return (
    <div className="soreness">
      <div className="soreness-head">
        <span className="micro">Soreness</span>
        <span className="soreness-now num">{value > 0 ? `+${value}` : value}</span>
      </div>
      <div className="timeline-wrap" style={{ ["--pct" as string]: `${pct}%` }}>
        <input
          type="range"
          min={0}
          max={4}
          step={1}
          value={index}
          onChange={(e) => onChange(2 - Number(e.target.value))}
          aria-label="Soreness"
          aria-valuetext={`${value}. ${entry.short}. ${entry.long}`}
        />
      </div>
      <div className="timeline-scale" aria-hidden>
        {SORENESS.map((s) => (
          <span key={s.value} className={s.value === value ? "is-on" : undefined}>
            {s.value}
          </span>
        ))}
      </div>
      <p className="soreness-note">
        {entry.short}
        {delta !== 0 && planned !== baseSets && ` · sets ${baseSets} > ${planned}`}
      </p>
    </div>
  );
}
