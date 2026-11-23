import { useState } from "react";
import { exercise } from "../state/library";
import { targetSets, targetWeight } from "../state/formula";
import { useStore } from "../state/store";
import { EQUIP_LABEL, EQUIP_SHORT, type Equip, type Slot } from "../state/types";
import { SlotSheet } from "../ui/SlotSheet";
import { IconChevron } from "../ui/icons";

const EQUIPS: Equip[] = ["ft", "barbell", "free", "machine", "body"];

export function PlanView({ goToday }: { goToday: (dayId: string) => void }) {
  const { state } = useStore();
  const [openDay, setOpenDay] = useState<string>(state.dayId);
  const [editing, setEditing] = useState<{ dayId: string; slot: Slot } | null>(null);

  return (
    <main className="page">
      <section className="lede" style={{ paddingBottom: 12 }}>
        <h1 className="day-title">Six days, one loop</h1>
        <p className="day-sub">
          Tap a lift to swap it or change its 10RM. Trainer and barbell first, with free weights and
          machines for when the rack is busy.
        </p>
        <div className="eqlegend">
          {EQUIPS.map((eq) => (
            <span key={eq}>
              <i className={`dot eq-${eq}`} style={{ display: "inline-block" }} />
              {EQUIP_LABEL[eq]}
            </span>
          ))}
        </div>
      </section>

      {state.days.map((day) => {
        const open = openDay === day.id;
        return (
          <section className="plan-day" key={day.id}>
            <button
              className="plan-head"
              onClick={() => setOpenDay(open ? "" : day.id)}
              aria-expanded={open}
            >
              <span className="plan-n">D{day.n}</span>
              <span className="plan-title">{day.title}</span>
              <span className="plan-count micro">{day.slots.length} lifts</span>
              <IconChevron className="chev" style={{ transform: open ? "rotate(180deg)" : undefined }} />
            </button>
            {open && (
              <>
                <p className="plan-focus">{day.focus}</p>
                {day.slots.map((slot) => {
                  const ex = exercise(slot.exerciseId);
                  return (
                    <div className="slotrow" key={slot.id}>
                      <div>
                        <div className="role">
                          <i className={`dot eq-${ex.equip}`} />
                          {slot.role}
                        </div>
                        <button className="name" onClick={() => setEditing({ dayId: day.id, slot })}>
                          {ex.name}
                        </button>
                        <div className="meta">
                          10RM {slot.rm10} <em>·</em> {targetSets(slot, state.rung, state.formula)} x{" "}
                          {targetWeight(slot, state.rung, state.formula)} lb <em>·</em> {slot.repGoal}{" "}
                          reps
                        </div>
                      </div>
                      <button
                        className="icon-btn"
                        onClick={() => setEditing({ dayId: day.id, slot })}
                        aria-label={`Edit ${ex.name}`}
                      >
                        <span className={`badge eq-${ex.equip}`}>{EQUIP_SHORT[ex.equip]}</span>
                      </button>
                    </div>
                  );
                })}
                <div style={{ padding: "12px 18px 16px", borderTop: "1px solid var(--rule-soft)" }}>
                  <button className="btn btn-block" onClick={() => goToday(day.id)}>
                    Train day {day.n}
                  </button>
                </div>
              </>
            )}
            {day.bridge && <div className="between">{day.bridge}</div>}
          </section>
        );
      })}

      <p className="footnote">
        Figures are for rung {state.rung}. Pick a different rung from the pill at the top.
      </p>

      {editing && <SlotSheet dayId={editing.dayId} slot={editing.slot} onClose={() => setEditing(null)} />}
    </main>
  );
}
