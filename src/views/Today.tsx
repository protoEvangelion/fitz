import { useEffect, useMemo, useState } from "react";
import { goalText, ladderMath, plannedSets, targetSets, targetWeight, todayKey } from "../state/formula";
import { exercise } from "../state/library";
import { useStore } from "../state/store";
import type { Day, Slot } from "../state/types";
import * as sound from "../lib/audio";
import { useRest } from "../ui/RestProvider";
import { SlotSheet } from "../ui/SlotSheet";
import { SorenessSlider } from "../ui/SorenessSlider";
import { Timeline } from "../ui/Timeline";
import { IconChevron } from "../ui/icons";

function dateLine(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function TodayView() {
  const { state, currentDay, setDay, setRung, nextDay, logFor } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<Slot | null>(null);

  const stats = useMemo(() => {
    let total = 0;
    let done = 0;
    for (const slot of currentDay.slots) {
      const log = logFor(currentDay.id, slot.id, state.rung);
      const target = plannedSets(slot, state.rung, state.formula, log?.rating ?? 1);
      total += target;
      done += Math.min(target, log?.sets.length ?? 0);
    }
    return { total, done };
  }, [currentDay, state.rung, state.formula, logFor]);

  const next = state.days[(state.days.findIndex((d) => d.id === currentDay.id) + 1) % state.days.length];

  return (
    <>
      <main className="page">
        <section className="lede">
          <h1 className="day-title">{currentDay.title}</h1>
          <p className="day-sub">
            {dateLine(todayKey())} · {stats.done} of {stats.total} sets done
          </p>

          <div className="timelines">
            <Timeline
              label="Rung"
              value={state.rung}
              total={state.totalRungs}
              onChange={setRung}
              onSnap={() => {
                sound.unlock();
                if (state.sound) sound.snap();
                if (state.haptics) sound.buzz(8);
              }}
            />
            <Timeline
              label="Day"
              value={currentDay.n}
              total={state.days.length}
              onChange={(n) => setDay(`d${n}`)}
              onSnap={() => {
                sound.unlock();
                if (state.sound) sound.snap();
                if (state.haptics) sound.buzz(8);
              }}
            />
          </div>
        </section>

        <ul className="list">
          {currentDay.slots.map((slot, i) => (
            <ExerciseRow
              key={slot.id}
              day={currentDay}
              slot={slot}
              index={i}
              rung={state.rung}
              open={open === slot.id}
              onToggle={() => {
                sound.unlock();
                setOpen(open === slot.id ? null : slot.id);
              }}
              onEdit={() => setEditing(slot)}
            />
          ))}
        </ul>

        {currentDay.bridge && (
          <div className="between" style={{ borderTop: "1px solid var(--rule-soft)", borderBottom: 0 }}>
            {currentDay.bridge}
          </div>
        )}

        <div className="block" style={{ borderBottom: 0, paddingTop: 18 }}>
          <button className="btn btn-primary btn-block" onClick={nextDay}>
            Next: day {next.n} · {next.title}
          </button>
          <p style={{ marginTop: 10, textAlign: "center", fontSize: 12, color: "var(--muted)" }}>
            Rung {state.rung} of {state.totalRungs} · built from your rung 1 numbers
          </p>
        </div>
      </main>

      {editing && (
        <SlotSheet dayId={currentDay.id} slot={editing} onClose={() => setEditing(null)} />
      )}

    </>
  );
}

function ExerciseRow({
  day,
  slot,
  index,
  rung,
  open,
  onToggle,
  onEdit,
}: {
  day: Day;
  slot: Slot;
  index: number;
  rung: number;
  open: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const { state, logFor, logSet, undoSet, setSoreness } = useStore();
  const rest = useRest();
  const ex = exercise(slot.exerciseId);
  const log = logFor(day.id, slot.id, rung);
  const soreness = log?.rating ?? 1;
  const baseSets = targetSets(slot, rung, state.formula);
  const sets = plannedSets(slot, rung, state.formula, soreness);
  const weight = targetWeight(slot, rung, state.formula);
  const logged = (log?.sets ?? []).slice(0, sets);

  const [w, setW] = useState(weight);
  const [drafts, setDrafts] = useState<Record<number, string>>(() =>
    Object.fromEntries(Array.from({ length: sets }, (_, i) => [i, String(slot.repGoal)])),
  );

  useEffect(() => {
    setW(weight);
  }, [weight]);

  const commit = (i: number) => {
    const parsed = Number.parseInt(drafts[i] ?? "", 10);
    const reps = Number.isFinite(parsed) && parsed > 0 ? parsed : slot.repGoal;
    logSet({ dayId: day.id, slotId: slot.id, rung, weight: w, reps });
    setDrafts((d) => ({ ...d, [i]: "" }));
    sound.unlock();
    if (state.sound) sound.logSet();
    if (state.haptics) sound.buzz(24);
    if (i < sets - 1) rest.start();
  };

  return (
    <li className={open ? "row is-open" : "row"}>
      <button className="row-head" onClick={onToggle} aria-expanded={open}>
        <span className="row-idx">{String(index + 1).padStart(2, "0")}</span>
        <span className="row-main">
          <span className="row-role micro">
            <i className={`dot eq-${ex.equip}`} />
            {slot.role}
          </span>
          <span className="row-name">{ex.name}</span>
        </span>
        <span className="row-target">
          <span className="w">{sets}</span>
          <span>{sets === 1 ? "set" : "sets"}</span>
          <span className="sep">·</span>
          <span className="w">{weight}</span>
          <span>lb</span>
          <span className="sep">·</span>
          <span>{slot.repGoal} reps</span>
        </span>
        <span className="row-right">
          {sets > 1 && (
            <span className="pips" aria-hidden>
              {Array.from({ length: sets }, (_, i) => (
                <i
                  key={i}
                  className={`pip${i < logged.length ? " is-on" : i === logged.length ? " is-now" : ""}`}
                />
              ))}
            </span>
          )}
          <IconChevron className="chev" />
        </span>
      </button>

      {open && (
        <div className="row-body">
          <div className="weightbar">
            <button className="step" onClick={() => setW((v) => Math.max(0, v - state.formula.roundTo))} aria-label="Lower weight">
              -
            </button>
            <span className="weight">
              <b className="num">{w}</b>
              <span className="unit">lb</span>
            </span>
            <button className="step" onClick={() => setW((v) => v + state.formula.roundTo)} aria-label="Raise weight">
              +
            </button>
          </div>
          <p className="formula-note">{ladderMath(slot, rung, state.formula)}</p>

          <div className="sets">
            {Array.from({ length: sets }, (_, i) => {
              const done = logged[i];
              const isNext = !done && i === logged.length;
              return (
                <div key={i} className={done ? "setrow is-done" : "setrow"}>
                  <span className="set-n">S{i + 1}</span>
                  {done ? (
                    <span className="reps">
                      <span className="num" style={{ fontSize: 17, color: "var(--ink)" }}>
                        {done.reps}
                      </span>
                      <span>reps · {done.weight} lb</span>
                    </span>
                  ) : (
                    <label className="reps">
                      <input
                        id={`reps-${day.id}-${slot.id}-${i}`}
                        name={`reps-${slot.id}-${i}`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={99}
                        value={drafts[i] ?? ""}
                        placeholder={String(slot.repGoal)}
                        onChange={(e) => setDrafts((d) => ({ ...d, [i]: e.target.value }))}
                        aria-label={`Reps for set ${i + 1}`}
                        disabled={!isNext}
                      />
                      <span>reps</span>
                    </label>
                  )}
                  <button
                    className={done ? "tick is-on" : "tick"}
                    onClick={() => {
                      if (done) {
                        if (i === logged.length - 1) undoSet(day.id, slot.id, rung);
                        return;
                      }
                      if (isNext) commit(i);
                    }}
                    disabled={done ? i !== logged.length - 1 : !isNext}
                    aria-label={done ? `Undo set ${i + 1}` : `Log set ${i + 1}`}
                  >
                    {done ? "done" : "log"}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="sets-foot">
            <span className="micro">{goalText(rung, state.formula)}</span>
            <button className="linkish" onClick={onEdit}>
              Edit lift
            </button>
          </div>

          <SorenessSlider
            value={soreness}
            baseSets={baseSets}
            planned={sets}
            onChange={(v) => setSoreness(day.id, slot.id, rung, v)}
          />
        </div>
      )}
    </li>
  );
}
