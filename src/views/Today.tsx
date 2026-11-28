import { useEffect, useMemo, useState } from "react";
import { goalFor, plannedSets, targetWeight, todayKey } from "../state/formula";
import { exercise } from "../state/library";
import { useStore } from "../state/store";
import { sorenessEntry, type Day, type Slot } from "../state/types";
import * as sound from "../lib/audio";
import { useRest } from "../ui/RestProvider";
import { SlotSheet } from "../ui/SlotSheet";

function dateLine(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

const SCROLL_KEY = "fitz:scroll";

export function TodayView() {
  const { state, currentDay, nextDay, logFor } = useStore();
  // The iPad can suspend the web app and reload it on return; the scroll
  // position is restored so the session looks untouched.
  const [editing, setEditing] = useState<Slot | null>(null);

  useEffect(() => {
    const saved = Number(sessionStorage.getItem(SCROLL_KEY) ?? "0");
    if (!saved) return;
    let cancelled = false;
    const apply = () => {
      if (!cancelled) window.scrollTo(0, saved);
    };
    const raf = requestAnimationFrame(apply);
    // iOS restores the page before fonts settle; re-apply once it has.
    const timer = window.setTimeout(apply, 140);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    let timer = 0;
    const save = () => sessionStorage.setItem(SCROLL_KEY, String(Math.round(window.scrollY)));
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(save, 120);
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") save();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

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

        </section>

        <ul className="cards">
          {currentDay.slots.map((slot) => (
            <ExerciseCard
              key={slot.id}
              day={currentDay}
              slot={slot}
              rung={state.rung}
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
            Week {state.rung} of {state.totalRungs} · built from your week 1 numbers
          </p>
        </div>
      </main>

      {editing && (
        <SlotSheet dayId={currentDay.id} slot={editing} onClose={() => setEditing(null)} />
      )}

    </>
  );
}

function ExerciseCard({
  day,
  slot,
  rung,
  onEdit,
}: {
  day: Day;
  slot: Slot;
  rung: number;
  onEdit: () => void;
}) {
  const { state, logFor, logSet, undoSet, setSoreness } = useStore();
  const rest = useRest();
  const ex = exercise(slot.exerciseId);
  const log = logFor(day.id, slot.id, rung);
  const soreness = log?.rating ?? 1;
  const sets = plannedSets(slot, rung, state.formula, soreness);
  const weight = targetWeight(slot, rung, state.formula);
  const goal = goalFor(rung, state.formula);
  const logged = (log?.sets ?? []).slice(0, sets);
  const left = Math.max(0, sets - logged.length);

  const [w, setW] = useState(weight);
  const lastReps = logged.length ? logged[logged.length - 1].reps : null;
  const [rep, setRep] = useState(lastReps ?? slot.repGoal);
  const entry = sorenessEntry(soreness);

  useEffect(() => {
    setW(weight);
  }, [weight]);

  // The next set inherits what you just did; a new week starts from the script.
  useEffect(() => {
    const last = log?.sets[log.sets.length - 1];
    setRep(last?.reps ?? slot.repGoal);
  }, [rung, slot.repGoal]);

  const commit = () => {
    if (left === 0) return;
    const reps = Math.min(30, Math.max(1, rep));
    logSet({ dayId: day.id, slotId: slot.id, rung, weight: w, reps });
    setRep(reps);
    sound.unlock();
    if (state.sound !== "off") sound.logSet();
    if (state.haptics) sound.buzz(24);
    if (left > 1) rest.start();
  };

  return (
    <li className="card">
      <div className="card-main">
      <p className="card-role micro">
        <i className={`dot eq-${ex.equip}`} />
        {slot.role} · {slot.repGoal} reps · {goal.rir} RIR
      </p>

      <div className="card-row">
        <button className="card-name" onClick={onEdit}>
          {ex.name}
        </button>
        <div className="card-weight">
          <button
            className="step-xs"
            onClick={() => setW((v) => Math.max(0, v - state.formula.roundTo))}
            aria-label="Lower weight"
          >
            -
          </button>
          <span className="num card-weight-value">{w}</span>
          <span className="card-weight-unit">lb</span>
          <button
            className="step-xs"
            onClick={() => setW((v) => v + state.formula.roundTo)}
            aria-label="Raise weight"
          >
            +
          </button>
        </div>
      </div>
      </div>

      <div className="card-controls">
      <div className="card-pills">
        <div className="pills">
          {Array.from({ length: sets }, (_, i) => {
            const done = logged[i];
            const next = !done && i === logged.length;
            return (
              <button
                key={i}
                className={`pill${done ? " is-logged" : next ? " is-next" : ""}`}
                onClick={() => {
                  if (done && i === logged.length - 1) undoSet(day.id, slot.id, rung);
                }}
                disabled={!done || i !== logged.length - 1}
                aria-label={
                  done ? `Set ${i + 1}, ${done.reps} reps, tap to undo` : `Set ${i + 1}, not logged`
                }
                title={done && i === logged.length - 1 ? "Undo last set" : undefined}
              >
                {done ? done.reps : ""}
              </button>
            );
          })}
        </div>
        <span className={left ? "card-left" : "card-left is-done"}>
          {left ? `${left} left` : "done"}
        </span>
      </div>

      {left > 0 ? (
        <div className="card-log">
          <div className="rep-slider" style={{ ["--rep" as string]: `${((rep - 1) / 29) * 100}%` }}>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={rep}
              onChange={(e) => setRep(Number(e.target.value))}
              aria-label="Reps for this set"
            />
          </div>
          <span className="num rep-value">{rep}</span>
          <span className="rep-unit">reps</span>
          <button className="log-btn" onClick={commit}>
            Log
          </button>
        </div>
      ) : (
        <div className="card-log is-done">
          <span className="card-complete">All {sets} sets logged</span>
        </div>
      )}

      <div className="card-sore">
        <span className="micro">Soreness</span>
        <span className="num card-sore-value">{soreness > 0 ? `+${soreness}` : soreness}</span>
        <div className="card-sore-track" style={{ ["--pct" as string]: `${((2 - soreness) / 4) * 100}%` }}>
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={2 - soreness}
            onChange={(e) => setSoreness(day.id, slot.id, rung, 2 - Number(e.target.value))}
            aria-label="Soreness"
            aria-valuetext={`${soreness}, ${entry.short}`}
          />
        </div>
        <span className="card-sore-brief" title={entry.long}>
          {entry.brief}
        </span>
      </div>
      </div>
    </li>
  );
}
