import { useStore } from "../state/store";
import { Sheet } from "./Sheet";

export function RungSheet({ onClose }: { onClose: () => void }) {
  const { state, setRung } = useStore();
  const step = state.formula.stepLb;

  return (
    <Sheet title="Rungs" onClose={onClose} action={<span className="micro">six passes</span>}>
      <p className="note" style={{ marginTop: 0 }}>
        A rung is one pass through the six days. Rung 1 is the numbers you wrote down. Every rung
        after adds one set per lift and {step} lb, until that lift hits its set ceiling.
      </p>

      <div style={{ marginTop: 6 }}>
        {Array.from({ length: state.totalRungs }, (_, i) => i + 1).map((r) => {
          const on = r === state.rung;
          return (
            <button
              key={r}
              className="pick"
              onClick={() => {
                setRung(r);
                onClose();
              }}
              aria-current={on}
            >
              <span
                className="num"
                style={{
                  width: 34,
                  fontSize: 15,
                  color: on ? "var(--lime)" : "var(--muted)",
                }}
              >
                R{r}
              </span>
              <span className="pick-name" style={{ color: on ? "var(--lime)" : "var(--ink)" }}>
                {r === 1 ? "The sheet, unchanged" : `+${r - 1} set${r > 2 ? "s" : ""}, +${step * (r - 1)} lb`}
              </span>
              {on ? (
                <span className="micro" style={{ color: "var(--lime)" }}>
                  now
                </span>
              ) : (
                <span className="pick-eq">rung {r}</span>
              )}
            </button>
          );
        })}
      </div>

      <p className="footnote" style={{ padding: "14px 0 0" }}>
        Set ceilings are per lift: isolation work usually stops at 3, the big barbell lifts climb
        higher. Change any single lift in Plan.
      </p>
    </Sheet>
  );
}
