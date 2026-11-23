import { useRef, useState } from "react";
import { targetSets, targetWeight, todayKey } from "../state/formula";
import { useStore } from "../state/store";
import { RATINGS } from "../state/types";
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
  const compound = state.formula.mode === "compound";

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
          Rung 1 is 85% of your 10RM, the rule on your sheet. Every rung above compounds 10% and adds
          a set, so changing one 10RM moves the whole ladder.
        </p>
      </section>

      <section className="block">
        <h2>The formula</h2>
        <p>Three lines, no hidden cells. A rung is one pass through the same six days.</p>
        <div className="note">
          <code>base = MROUND(10RM x 0.85, 5)</code>
          {compound ? (
            <code>weight = MROUND(previous x {state.formula.rate}, 5)</code>
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
                className={compound && state.formula.rate === 1.1 ? "is-on" : ""}
                onClick={() => setFormula({ mode: "compound", rate: 1.1 })}
              >
                x1.1
              </button>
              <button
                className={compound && state.formula.rate === 1.05 ? "is-on" : ""}
                onClick={() => setFormula({ mode: "compound", rate: 1.05 })}
              >
                x1.05
              </button>
              <button className={!compound ? "is-on" : ""} onClick={() => setFormula({ mode: "step" })}>
                + lb
              </button>
            </div>
          </div>
        </div>

        {!compound && (
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
              {[3, 4, 5].map((v) => (
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

        <p className="footnote" style={{ padding: "14px 0 0" }}>
          With your numbers: {example.rm10} 10RM gives {example.baseWeight} lb on rung 1,{" "}
          {nextWeight} on rung 2 ({nextSets} sets), {thirdWeight} on rung 3. The set ceiling stops it
          climbing past {example.capSets}.
        </p>
      </section>

      <section className="block">
        <h2>Rest and cues</h2>
        <p>Starts when you log a set, chimes when it runs out.</p>
        <div className="field">
          <div className="row2">
            <label>Default rest</label>
            <div className="segmented">
              {[60, 90, 120, 180].map((v) => (
                <button
                  key={v}
                  className={state.restSec === v ? "is-on" : ""}
                  onClick={() => setPref({ restSec: v })}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="field">
          <div className="row2">
            <label>Audio cues</label>
            <Toggle
              on={state.sound}
              label="Audio cues"
              onChange={(v) => {
                sound.unlock();
                if (v) sound.restTick();
                setPref({ sound: v });
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
        <h2>The check-in scale</h2>
        <p>Five taps, taken from column 5 of your sheet.</p>
        <div style={{ marginTop: 10 }}>
          {RATINGS.map((r) => (
            <div
              key={r.key}
              style={{
                display: "grid",
                gridTemplateColumns: "44px 1fr",
                gap: 10,
                padding: "9px 0",
                borderTop: "1px solid var(--rule-soft)",
                alignItems: "baseline",
              }}
            >
              <span className="num" style={{ color: "var(--lime)", fontSize: 13 }}>
                {r.label}
              </span>
              <span style={{ color: "var(--muted)", fontSize: 12.5 }}>{r.long}</span>
            </div>
          ))}
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
