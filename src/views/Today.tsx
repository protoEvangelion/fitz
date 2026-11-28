import { useEffect, useMemo, useState } from "react";
import { goalText, ladderMath, plannedSets, targetSets, targetWeight, todayKey } from "../state/formula";
import { exercise } from "../state/library";
import { useStore } from "../state/store";
import type { Day, Slot } from "../state/types";
import * as sound from "../lib/audio";
import { useRest } from "../ui/RestProvider";
import { SlotSheet } from "../ui/SlotSheet";
import { SorenessSlider } from "../ui/SorenessSlider";
import { IconChevron } from "../ui/icons";

function dateLine(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

const OPEN_KEY = "fitz:open";
const SCROLL_KEY = "fitz:scroll";

export function TodayView() {
  const { state, currentDay, nextDay, logFor } = useStore();
  // The iPad can suspend the web app and reload it on return. Keep the open
  // lift and the scroll position so the session looks untouched.
  const [open, setOpen] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(OPEN_KEY) ?? "[]") as string[];
      return saved.filter((id) => currentDay.slots.some((s) => s.id === id));
    } catch {
      return [];
    }
  });
  const [editing, setEditing] = useState<Slot | null>(null);

  useEffect(() => {
    if (open.length) sessionStorage.setItem(OPEN_KEY, JSON.stringify(open));
    else sessionStorage.removeItem(OPEN_KEY);
  }, [open]);

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

  // Opening one lift never closes another, so nothing above the row you tapped
  // moves and the page cannot jump under your finger.
  const toggleRow = (id: string) => {
    sound.unlock();
    setOpen((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

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

        <ul className="list">
          {currentDay.slots.map((slot, i) => (
            <ExerciseRow
              key={slot.id}
              day={currentDay}
              slot={slot}
              index={i}
              rung={state.rung}
              open={open.includes(slot.id)}
              onToggle={() => toggleRow(slot.id)}
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
  const lastReps = logged.length ? logged[logged.length - 1].reps : null;
  const [rep, setRep] = useState(lastReps ?? slot.repGoal);

  useEffect(() => {
    setW(weight);
  }, [weight]);

  // Next set inherits the reps you just did; a rung change starts over from the
  // prescribed reps. Deliberately not keyed on logged.length: commit() sets the
  // value itself, so this must not race it back to the prescription.
  useEffect(() => {
    const last = log?.sets[log.sets.length - 1];
    setRep(last?.reps ?? slot.repGoal);
  }, [rung, slot.repGoal]);

  const commit = (i: number) => {
    const reps = Math.min(30, Math.max(1, rep));
    logSet({ dayId: day.id, slotId: slot.id, rung, weight: w, reps });
    // carry the same rep count into the next set
    setRep(reps);
    sound.unlock();
    if (state.sound) sound.logSet();
    if (state.haptics) sound.buzz(24);
    if (i < sets - 1) rest.start();
  };

  return (
    <li id={`row-${slot.id}`} className={open ? "row is-open" : "row"}>
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
                <div
                  key={i}
                  className={done ? "setrow is-done" : isNext ? "setrow is-next" : "setrow is-idle"}
                >
                  <span className="set-n">S{i + 1}</span>
                  {done ? (
                    <span className="reps">
                      <input
                        className="rep-logged"
                        value={done.reps}
                        disabled
                        aria-label={`Set ${i + 1} reps`}
                      />
                      <span>reps · {done.weight} lb</span>
                    </span>
                  ) : isNext ? (
                    <div className="rep-slider" style={{ ["--rep" as string]: `${((rep - 1) / 29) * 100}%` }}>
                      <input
                        type="range"
                        min={1}
                        max={30}
                        step={1}
                        value={rep}
                        onChange={(e) => setRep(Number(e.target.value))}
                        aria-label={`Reps for set ${i + 1}`}
                      />
                      <span className="num rep-value">{rep}</span>
                      <span className="rep-unit">reps</span>
                    </div>
                  ) : (
                    <span className="rep-idle" aria-hidden />
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
