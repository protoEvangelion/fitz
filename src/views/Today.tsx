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

const OPEN_KEY = "fitz:open";
const SCROLL_KEY = "fitz:scroll";

export function TodayView() {
  const { state, currentDay, setDay, setRung, nextDay, logFor } = useStore();
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

  // The keyboard shrinks the visual viewport. Only when it actually covers the
  // focused reps field do we move the page, and only by what is needed.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const keepVisible = () => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || !el.closest(".setrow")) return;
      const rect = el.getBoundingClientRect();
      const top = vv.offsetTop;
      const bottom = vv.offsetTop + vv.height;
      const pad = 20;
      if (rect.bottom > bottom - pad) window.scrollBy(0, rect.bottom - (bottom - pad));
      else if (rect.top < top + pad) window.scrollBy(0, rect.top - (top + pad));
    };
    vv.addEventListener("resize", keepVisible);
    vv.addEventListener("scroll", keepVisible);
    return () => {
      vv.removeEventListener("resize", keepVisible);
      vv.removeEventListener("scroll", keepVisible);
    };
  }, []);

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
    const reps = Number.isFinite(parsed) && parsed > 0 ? Math.min(999, parsed) : slot.repGoal;
    logSet({ dayId: day.id, slotId: slot.id, rung, weight: w, reps });
    setDrafts((d) => ({ ...d, [i]: "" }));
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
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={3}
                        autoComplete="off"
                        value={drafts[i] ?? ""}
                        placeholder={String(slot.repGoal)}
                        onChange={(e) => setDrafts((d) => ({ ...d, [i]: e.target.value }))}
                        onPointerDown={(e) => {
                          const el = e.currentTarget;
                          // Already editing: let the platform place the caret.
                          if (document.activeElement === el) return;
                          // Take focus without the browser scrolling to it, so iOS
                          // cannot yank the page before we have a say.
                          e.preventDefault();
                          el.focus({ preventScroll: true });
                          el.select();
                        }}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter" || !isNext) return;
                          e.preventDefault();
                          commit(i);
                          // log and move to the next set, so a keyboard can run the whole lift
                          const next = document.getElementById(`reps-${day.id}-${slot.id}-${i + 1}`);
                          if (i + 1 < sets) requestAnimationFrame(() => next?.focus());
                        }}
                        enterKeyHint="done"
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
