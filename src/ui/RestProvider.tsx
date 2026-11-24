import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as sound from "../lib/audio";
import { useStore } from "../state/store";

interface RestApi {
  left: number;
  total: number;
  running: boolean;
  start: (sec?: number) => void;
  add: (n: number) => void;
  stop: () => void;
}

const Ctx = createContext<RestApi | null>(null);

export function RestProvider({ children }: { children: ReactNode }) {
  const { state } = useStore();
  const [total, setTotal] = useState(state.restSec);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [left, setLeft] = useState(0);
  const lastWhole = useRef<number>(-1);
  const finishing = useRef(false);

  const start = useCallback(
    (sec?: number) => {
      const length = sec ?? state.restSec;
      setTotal(length);
      setLeft(length);
      lastWhole.current = Math.ceil(length);
      finishing.current = false;
      setEndAt(Date.now() + length * 1000);
    },
    [state.restSec],
  );

  const stop = useCallback(() => {
    setEndAt(null);
    setLeft(0);
    lastWhole.current = -1;
  }, []);

  const add = useCallback((n: number) => {
    setEndAt((prev) => (prev ? prev + n * 1000 : prev));
  }, []);

  useEffect(() => {
    if (endAt == null) return;
    const id = window.setInterval(() => {
      const remain = Math.max(0, (endAt - Date.now()) / 1000);
      setLeft(remain);
      const whole = Math.ceil(remain);
      if (whole !== lastWhole.current) {
        lastWhole.current = whole;
        if (whole > 0 && whole <= 3 && state.ticks && state.sound !== "off") sound.restTick();
      }
      if (remain <= 0 && !finishing.current) {
        finishing.current = true;
        if (state.sound === "beep") sound.restBeep();
        else if (state.sound === "chime") sound.restDone();
        if (state.haptics) sound.buzz([60, 60, 140]);
        setEndAt(null);
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [endAt, state.sound, state.ticks, state.haptics]);

  return (
    <Ctx.Provider value={{ left, total, running: endAt != null, start, add, stop }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRest(): RestApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRest outside provider");
  return ctx;
}

export function RestBar() {
  const rest = useRest();
  if (!rest.running && rest.left <= 0) return null;
  const pct = rest.total ? Math.max(0, Math.min(1, rest.left / rest.total)) : 0;
  const m = Math.floor(rest.left / 60);
  const s = String(Math.ceil(rest.left % 60)).padStart(2, "0");
  return (
    <div className="restbar" role="status" aria-live="off">
      <div className="rest-progress" style={{ width: `${pct * 100}%` }} />
      <div className="rest-inner">
        <span className="rest-time num">
          {m}:{s}
        </span>
        <span className="rest-label">{rest.left <= 0 ? "Rest done" : "Rest"}</span>
        <button className="rest-btn" onClick={() => rest.add(15)} aria-label="Add 15 seconds">
          +15s
        </button>
        <button className="rest-btn is-primary" onClick={rest.stop}>
          {rest.left <= 0 ? "Clear" : "Skip"}
        </button>
      </div>
    </div>
  );
}
