import { useState } from "react";
import { useStore } from "../state/store";
import { Sheet } from "./Sheet";

/**
 * Start anywhere: pick a day and a rung independently of where the app thinks
 * you are. Logged sets are keyed by date, day and rung, so jumping never moves
 * or deletes anything.
 */
export function JumpSheet({ onClose }: { onClose: () => void }) {
  const { state, setDay, setRung } = useStore();
  const [rung, pickRung] = useState(state.rung);
  const [dayId, pickDay] = useState(state.dayId);
  const day = state.days.find((d) => d.id === dayId) ?? state.days[0];
  const unchanged = rung === state.rung && dayId === state.dayId;

  return (
    <Sheet
      title="Start anywhere"
      onClose={onClose}
      action={<span className="micro">day + rung</span>}
      footer={
        <>
          <button
            className="btn btn-primary btn-block"
            onClick={() => {
              setRung(rung);
              setDay(dayId);
              onClose();
            }}
          >
            {unchanged ? `Stay on day ${day.n}, rung ${rung}` : `Start day ${day.n} on rung ${rung}`}
          </button>
          <button className="btn btn-block btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </>
      }
    >
      <p className="note" style={{ marginTop: 0 }}>
        Pick the day and the rung you are on. Nothing you have already logged moves.
      </p>

      <p className="micro" style={{ margin: "18px 0 8px" }}>
        Rung
      </p>
      <div className="rungchips" role="group" aria-label="Rung">
        {Array.from({ length: state.totalRungs }, (_, i) => i + 1).map((r) => (
          <button
            key={r}
            className={r === rung ? "rungchip is-on" : "rungchip"}
            onClick={() => pickRung(r)}
            aria-pressed={r === rung}
            aria-label={`Rung ${r}`}
          >
            {r}
          </button>
        ))}
      </div>
      <p className="footnote" style={{ padding: "8px 0 0" }}>
        {rung === 1
          ? "Rung 1: the numbers you wrote down."
          : `Rung ${rung}: +${rung - 1} set${rung > 2 ? "s" : ""} per lift, +${state.formula.stepLb * (rung - 1)} lb.`}
      </p>

      <p className="micro" style={{ margin: "18px 0 4px" }}>
        Day
      </p>
      {state.days.map((d) => {
        const on = d.id === dayId;
        return (
          <button
            key={d.id}
            className={on ? "jumpday is-on" : "jumpday"}
            onClick={() => pickDay(d.id)}
            aria-pressed={on}
          >
            <span className="d">D{d.n}</span>
            <span className="n">{d.title}</span>
            <span className="c">{d.slots.length} lifts</span>
          </button>
        );
      })}

    </Sheet>
  );
}
