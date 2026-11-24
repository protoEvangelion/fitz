import { useRef, useState } from "react";
import { clock, targetSets, targetWeight, todayKey } from "../state/formula";
import { useStore } from "../state/store";
import { SORENESS, SORENESS_SET_DELTA } from "../state/types";
import * as sound from "../lib/audio";

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      className={on ? "chip is-on" : "chip"}
      onClick={() => onChange(!on)}
      aria-pressed={on}
      aria-label={label}
    >
      {on ? "On" : "Off"}
    </button>
  );
}

export function SetupView() {
  const { state, setFormula, setPref, resetAll, exportState, importState } = useStore();
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const example = state.days[0].slots[2];
  const nextSets = targetSets(example, 2, state.formula);
  const nextWeight = targetWeight(example, 2, state.formula);
  const thirdWeight = targetWeight(example, 3, state.formula);
  const percent = state.formula.mode === "percent";

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  const flash = (text: string) => {
    setMsg(text);
    window.setTimeout(() => setMsg(null), 2600);
  };

  const download = () => {
    const blob = new Blob([exportState()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fitz-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash("Backup saved to this phone.");
  };

  return (
    <main className="page">
      <section className="lede" style={{ paddingBottom: 14 }}>
        <h1 className="day-title">How the numbers move</h1>
        <p className="day-sub">
          Rung 1 is 85% of your 10RM. Every rung above adds a set and 2% of that base weight, so
          rung 6 lands at 1.10x - changing one 10RM moves the whole ladder.
        </p>
      </section>

      <section className="block">
        <h2>The formula</h2>
        <p>Three lines, no hidden cells. A rung is one pass through the same six days.</p>
        <div className="note">
          <code>base = MROUND(10RM x 0.85, 5)</code>
          {percent ? (
            <>
              <code>k = 1, 1.02, 1.04 ... 1.10 (by rung)</code>
              <code>weight = MROUND(base x k, 5)</code>
            </>
          ) : (
            <code>weight = base + {state.formula.stepLb} x (rung - 1)</code>
          )}
          <code>sets = base sets + (rung - 1)</code>
          <span style={{ display: "block", marginTop: 8, color: "var(--dim)", fontSize: 12 }}>
            rounded to {state.formula.roundTo} lb, capped by the lift
          </span>
        </div>

        <div className="field">
          <div className="row2">
            <label>Progression</label>
            <div className="segmented">
              <button
                className={percent && state.formula.pct === 0.02 ? "is-on" : ""}
                onClick={() => setFormula({ mode: "percent", pct: 0.02 })}
              >
                +2%
              </button>
              <button
                className={percent && state.formula.pct === 0.05 ? "is-on" : ""}
                onClick={() => setFormula({ mode: "percent", pct: 0.05 })}
              >
                +5%
              </button>
              <button className={!percent ? "is-on" : ""} onClick={() => setFormula({ mode: "step" })}>
                + lb
              </button>
            </div>
          </div>
        </div>

        {!percent && (
          <div className="field">
            <div className="row2">
              <label>Pounds per rung</label>
              <div className="segmented">
                {[2.5, 5, 10].map((v) => (
                  <button
                    key={v}
                    className={state.formula.stepLb === v ? "is-on" : ""}
                    onClick={() => setFormula({ stepLb: v })}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="field">
          <div className="row2">
            <label>Round weights to</label>
            <div className="segmented">
              {[1, 5, 10].map((v) => (
                <button
                  key={v}
                  className={state.formula.roundTo === v ? "is-on" : ""}
                  onClick={() => setFormula({ roundTo: v })}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="field">
          <div className="row2">
            <label>Set ceiling</label>
            <div className="segmented">
              {[4, 5, 6].map((v) => (
                <button
                  key={v}
                  className={state.formula.setsCap === v ? "is-on" : ""}
                  onClick={() => setFormula({ setsCap: v })}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="goals">
          <p className="micro" style={{ margin: "18px 0 2px" }}>
            Rep goal by rung
          </p>
          {state.formula.goals.map((g, i) => (
            <div className="goalrow" key={i}>
              <span className="num" style={{ color: "var(--dim)", fontSize: 11 }}>
                R{i + 1}
              </span>
              <div className="segmented">
                <button
                  onClick={() =>
                    setFormula({
                      goals: state.formula.goals.map((x, j) =>
                        j === i ? { ...x, rir: Math.max(0, x.rir - 1) } : x,
                      ),
                    })
                  }
                  aria-label={`Fewer RIR on rung ${i + 1}`}
                >
                  -
                </button>
                <span className="stepper-value num">{g.rir}</span>
                <button
                  onClick={() =>
                    setFormula({
                      goals: state.formula.goals.map((x, j) =>
                        j === i ? { ...x, rir: Math.min(10, x.rir + 1) } : x,
                      ),
                    })
                  }
                  aria-label={`More RIR on rung ${i + 1}`}
                >
                  +
                </button>
              </div>
              <button
                className={g.fail ? "chip is-on" : "chip"}
                onClick={() =>
                  setFormula({
                    goals: state.formula.goals.map((x, j) => (j === i ? { ...x, fail: !x.fail } : x)),
                  })
                }
                aria-pressed={g.fail}
                aria-label={`Last set to failure on rung ${i + 1}`}
              >
                {g.fail ? "to failure" : "no failure"}
              </button>
            </div>
          ))}
        </div>

        <p className="footnote" style={{ padding: "14px 0 0" }}>
          With your numbers: {example.rm10} 10RM gives {example.baseWeight} lb on rung 1,{" "}
          {nextWeight} on rung 2 ({nextSets} sets), {thirdWeight} on rung 3. The set ceiling stops it
          climbing past {example.capSets}.
        </p>
      </section>

      <section className="block">
        <h2>Rest and cues</h2>
        <p>Starts when you log a set. The end cue is yours to pick.</p>

        <div className="field">
          <div className="row2">
            <label>Default rest</label>
            <div className="segmented">
              <button
                onClick={() => setPref({ restSec: Math.max(15, state.restSec - 15) })}
                aria-label="15 seconds less rest"
              >
                -
              </button>
              <span className="stepper-value num" style={{ minWidth: 58 }}>
                {clock(state.restSec)}
              </span>
              <button
                onClick={() => setPref({ restSec: Math.min(900, state.restSec + 15) })}
                aria-label="15 seconds more rest"
              >
                +
              </button>
            </div>
          </div>
        </div>
        <div className="presets">
          {[60, 120, 180, 240].map((v) => (
            <button
              key={v}
              className={state.restSec === v ? "chip is-on" : "chip"}
              onClick={() => setPref({ restSec: v })}
            >
              {clock(v)}
            </button>
          ))}
        </div>

        <div className="field">
          <div className="row2">
            <label>End of rest</label>
            <div className="segmented">
              {(["off", "beep", "chime"] as const).map((v) => (
                <button
                  key={v}
                  className={state.sound === v ? "is-on" : ""}
                  onClick={() => {
                    sound.unlock();
                    if (v === "beep") sound.restBeep();
                    if (v === "chime") sound.restDone();
                    setPref({ sound: v });
                  }}
                >
                  {v === "off" ? "Off" : v === "beep" ? "Beep" : "Chime"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="field">
          <div className="row2">
            <label>3-2-1 ticks</label>
            <Toggle
              on={state.ticks}
              label="Countdown ticks"
              onChange={(v) => {
                sound.unlock();
                if (v) sound.restTick();
                setPref({ ticks: v });
              }}
            />
          </div>
        </div>

        <div className="field">
          <div className="row2">
            <label>Vibration</label>
            <Toggle on={state.haptics} label="Vibration" onChange={(v) => setPref({ haptics: v })} />
          </div>
        </div>
      </section>

      <section className="block">
        <h2>The soreness check-in</h2>
        <p>
          One slider per lift, default 1. It trims or adds sets on that lift today; the weight
          ladder never changes.
        </p>
        <div style={{ marginTop: 10 }}>
          {SORENESS.map((s) => {
            const delta = SORENESS_SET_DELTA[s.value] ?? 0;
            return (
              <div
                key={s.value}
                style={{
                  display: "grid",
                  gridTemplateColumns: "44px 1fr auto",
                  gap: 10,
                  padding: "9px 0",
                  borderTop: "1px solid var(--rule-soft)",
                  alignItems: "baseline",
                }}
              >
                <span className="num" style={{ color: "var(--lime)", fontSize: 13 }}>
                  {s.value}
                </span>
                <span style={{ color: "var(--muted)", fontSize: 12.5 }}>{s.long}</span>
                <span className="num" style={{ color: "var(--dim)", fontSize: 11.5 }}>
                  {delta === 0
                    ? "same"
                    : `${delta > 0 ? "+" : ""}${delta} ${Math.abs(delta) === 1 ? "set" : "sets"}`}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="block">
        <h2>On this device</h2>
        <p>
          {standalone
            ? "Running from the home screen. Everything works offline."
            : isIOS
              ? "Add it to the home screen: tap Share, then Add to Home Screen. It opens full screen and works with no signal."
              : "Install it from the browser menu: Install app or Add to Home screen."}
        </p>
        <p className="footnote" style={{ padding: "10px 0 0" }}>
          Storage is local: IndexedDB with a localStorage mirror. No account, no sync, no requests.
        </p>
      </section>

      <section className="block">
        <h2>Data</h2>
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          <button className="btn btn-block" onClick={download}>
            Export backup (.json)
          </button>
          <button className="btn btn-block" onClick={() => fileRef.current?.click()}>
            Import backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              const res = importState(text);
              flash(res.ok ? "Backup restored." : (res.error ?? "Could not import."));
              e.target.value = "";
            }}
          />
          <button
            className="btn btn-block btn-danger"
            onClick={() => {
              if (window.confirm("Reset every lift, rung and logged set back to your rung 1 numbers?")) {
                resetAll();
                flash("Back to rung 1.");
              }
            }}
          >
            Reset to rung 1 defaults
          </button>
        </div>
      </section>

      <p className="footnote" style={{ paddingBottom: 30 }}>
        Fitz · {state.logs.reduce((n, l) => n + l.sets.length, 0)}{" "}
        {state.logs.reduce((n, l) => n + l.sets.length, 0) === 1 ? "set" : "sets"} stored locally ·
        v1.0
      </p>

      {msg && (
        <div className="toast" role="status">
          {msg}
        </div>
      )}
    </main>
  );
}
