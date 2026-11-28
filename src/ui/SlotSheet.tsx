import { useState } from "react";
import { exercise } from "../state/library";
import { goalText, ladderMath, rungDelta, targetSets, targetWeight } from "../state/formula";
import { useStore } from "../state/store";
import type { Slot } from "../state/types";
import { ExercisePicker } from "./Picker";
import { Sheet } from "./Sheet";
import { IconSwap } from "./icons";

interface Props {
  dayId: string;
  slot: Slot;
  onClose: () => void;
}

function NumField({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  max = 2000,
  step = 5,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  const id = `f-${label.replace(/\W+/g, "-")}`;
  return (
    <div className="field">
      <div className="row2">
        <label htmlFor={id}>{label}</label>
        <span className="numfield">
          <input
            id={id}
            className="input"
            name={id}
            type="number"
            inputMode="decimal"
            value={Number.isFinite(value) ? value : 0}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
            }}
          />
          {suffix && <span className="suffix">{suffix}</span>}
        </span>
      </div>
    </div>
  );
}

function Stepper({
  label,
  value,
  onChange,
  min = 1,
  max = 8,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="field">
      <div className="row2">
        <label>{label}</label>
        <div className="segmented">
          <button onClick={() => onChange(Math.max(min, value - 1))} aria-label={`Fewer ${label}`}>
            -
          </button>
          <span className="stepper-value num">{value}</span>
          <button onClick={() => onChange(Math.min(max, value + 1))} aria-label={`More ${label}`}>
            +
          </button>
        </div>
      </div>
    </div>
  );
}

export function SlotSheet({ dayId, slot: initial, onClose }: Props) {
  const { state, patchSlot, swapExercise } = useStore();
  const [picking, setPicking] = useState(false);
  // Read the live slot: swapping a lift must not leave the editor on a stale copy.
  const slot = state.days.find((d) => d.id === dayId)?.slots.find((s) => s.id === initial.id) ?? initial;
  const ex = exercise(slot.exerciseId);
  const rung = state.rung;
  const sets = targetSets(slot, rung, state.formula);
  const weight = targetWeight(slot, rung, state.formula);

  if (picking) {
    return (
      <ExercisePicker
        currentId={slot.exerciseId}
        targets={slot.targets ?? []}
        onClose={() => setPicking(false)}
        onPick={(id) => {
          swapExercise(dayId, slot.id, id, slot.rm10);
          setPicking(false);
        }}
      />
    );
  }

  return (
    <Sheet title={slot.role} onClose={onClose}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <p className="micro" style={{ marginBottom: 6 }}>
            {ex.equip === "ft" ? "Functional trainer" : ex.equip === "barbell" ? "Barbell" : ex.equip === "free" ? "Free weight" : ex.equip === "machine" ? "Machine" : "Bodyweight"}{" "}
            · {ex.muscle}
            {(slot.targets ?? []).length > 0 && !slot.targets.includes(ex.muscle) && (
              <span style={{ color: "var(--amber)" }}> · outside {slot.targets.join("/")}</span>
            )}
          </p>
          <p style={{ margin: 0, fontSize: 19, fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.25 }}>
            {ex.name}
          </p>
        </div>
        <button className="icon-btn" onClick={() => setPicking(true)} aria-label="Swap exercise">
          <IconSwap width={18} height={18} />
        </button>
      </div>

      <div className="note" style={{ display: "grid", gap: 4 }}>
        <span className="micro" style={{ color: "var(--muted)" }}>On week {rung}</span>
        <span className="num" style={{ fontSize: 16, color: "var(--ink)" }}>
          {sets} x {weight} lb · {slot.repGoal} reps
        </span>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          {ladderMath(slot, rung, state.formula)}
        </span>
      </div>

      <div className="field">
        <div className="row2">
          <label htmlFor="f-10rm">10RM</label>
          <span className="numfield">
            <button
              className="mini"
              onClick={() =>
                patchSlot(dayId, slot.id, {
                  baseWeight:
                    Math.round((slot.rm10 * 0.85) / state.formula.roundTo) * state.formula.roundTo,
                })
              }
              title="Set the week 1 weight to 85% of this 10RM"
            >
              85%
            </button>
            <input
              id="f-10rm"
              name="rm10"
              className="input"
              type="number"
              inputMode="decimal"
              value={slot.rm10}
              min={0}
              max={600}
              step={5}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n)) patchSlot(dayId, slot.id, { rm10: Math.max(0, n) });
              }}
            />
            <span className="suffix">lb</span>
          </span>
        </div>
      </div>

      <NumField
        label="Week 1 weight"
        value={slot.baseWeight}
        suffix="lb"
        step={5}
        min={0}
        max={800}
        onChange={(baseWeight) => patchSlot(dayId, slot.id, { baseWeight })}
      />

      <div className="field">
        <div className="row2">
          <label>Progression</label>
          <span className="numfield" style={{ gap: 10 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-2)" }}>
              {rungDelta(2, state.formula)}
            </span>
          </span>
        </div>
      </div>

      <Stepper
        label="Sets on week 1"
        value={slot.baseSets}
        min={1}
        max={8}
        onChange={(baseSets) => patchSlot(dayId, slot.id, { baseSets })}
      />
      <Stepper
        label="Set ceiling"
        value={slot.capSets}
        min={1}
        max={8}
        onChange={(capSets) => patchSlot(dayId, slot.id, { capSets })}
      />

      <NumField
        label="Reps per set"
        value={slot.repGoal}
        suffix="reps"
        step={1}
        min={1}
        max={50}
        onChange={(repGoal) => patchSlot(dayId, slot.id, { repGoal })}
      />
      <div className="field">
        <div className="row2">
          <label>Rep goal on week {rung}</label>
          <span className="numfield">
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-2)" }}>
              {goalText(rung, state.formula)}
            </span>
          </span>
        </div>
      </div>

      <p className="footnote" style={{ padding: "16px 0 0" }}>
        Swapping keeps this slot's 10RM. Tap 85% to set the week 1 weight to the sheet's rule.
      </p>
    </Sheet>
  );
}
