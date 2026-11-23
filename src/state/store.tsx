import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { loadState, saveState, wipeState } from "../lib/db";
import { exercise, targetsForRole } from "./library";
import { seedState } from "./seed";
import { todayKey } from "./formula";
import type { AppState, Formula, Slot, SlotLog } from "./types";

interface SetInput {
  dayId: string;
  slotId: string;
  rung: number;
  weight: number;
  reps: number;
}

interface Store {
  state: AppState;
  ready: boolean;
  currentDay: AppState["days"][number];
  logFor: (dayId: string, slotId: string, rung: number, date?: string) => SlotLog | undefined;
  logSet: (input: SetInput) => void;
  undoSet: (dayId: string, slotId: string, rung: number) => void;
  clearSlot: (dayId: string, slotId: string, rung: number) => void;
  rate: (dayId: string, slotId: string, rung: number, rating: number) => void;
  setRung: (rung: number) => void;
  setDay: (dayId: string) => void;
  nextDay: () => void;
  patchSlot: (dayId: string, slotId: string, patch: Partial<Slot>) => void;
  swapExercise: (dayId: string, slotId: string, exerciseId: string, rm10: number) => void;
  setFormula: (patch: Partial<Formula>) => void;
  setPref: (patch: Partial<Pick<AppState, "restSec" | "sound" | "haptics" | "totalRungs">>) => void;
  resetAll: () => void;
  importState: (raw: string) => { ok: boolean; error?: string };
  exportState: () => string;
}

const StoreCtx = createContext<Store | null>(null);

function hydrate(raw: unknown): AppState {
  const seed = seedState();
  if (!raw || typeof raw !== "object") return seed;
  const s = raw as Partial<AppState>;
  if (!Array.isArray(s.days) || s.days.length !== 6) return seed;
  return {
    ...seed,
    ...s,
    formula: { ...seed.formula, ...(s.formula ?? {}) },
    days: s.days.map((d) => ({
      ...d,
      slots: d.slots.map((slot) => ({
        ...slot,
        targets: slot.targets ?? targetsForRole(slot.role),
      })),
    })),
    logs: Array.isArray(s.logs) ? s.logs : [],
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => seedState());
  const [ready, setReady] = useState(false);
  const savedAt = useRef(0);

  useEffect(() => {
    let alive = true;
    loadState<AppState>().then((raw) => {
      if (!alive) return;
      setState(hydrate(raw));
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => {
      savedAt.current = Date.now();
      void saveState(state);
    }, 180);
    return () => window.clearTimeout(t);
  }, [state, ready]);

  const logFor = useCallback(
    (dayId: string, slotId: string, rung: number, date = todayKey()) =>
      state.logs.find(
        (l) => l.date === date && l.dayId === dayId && l.slotId === slotId && l.rung === rung,
      ),
    [state.logs],
  );

  const upsert = useCallback(
    (dayId: string, slotId: string, rung: number, fn: (log: SlotLog) => SlotLog) => {
      const date = todayKey();
      setState((prev) => {
        const id = `${date}:${dayId}:${slotId}:r${rung}`;
        const idx = prev.logs.findIndex(
          (l) => l.date === date && l.dayId === dayId && l.slotId === slotId && l.rung === rung,
        );
        if (idx === -1) {
          const log: SlotLog = { id, date, dayId, slotId, rung, sets: [] };
          return { ...prev, logs: [...prev.logs, fn(log)] };
        }
        const logs = [...prev.logs];
        logs[idx] = fn(logs[idx]);
        return { ...prev, logs };
      });
    },
    [],
  );

  const value = useMemo<Store>(() => {
    const currentDay = state.days.find((d) => d.id === state.dayId) ?? state.days[0];
    return {
      state,
      ready,
      currentDay,
      logFor,
      logSet: ({ dayId, slotId, rung, weight, reps }) => {
        upsert(dayId, slotId, rung, (log) => ({
          ...log,
          sets: [...log.sets, { weight, reps, at: Date.now() }],
        }));
      },
      undoSet: (dayId, slotId, rung) => {
        upsert(dayId, slotId, rung, (log) => ({ ...log, sets: log.sets.slice(0, -1) }));
      },
      clearSlot: (dayId, slotId, rung) => {
        setState((prev) => ({
          ...prev,
          logs: prev.logs.filter(
            (l) =>
              !(
                l.date === todayKey() &&
                l.dayId === dayId &&
                l.slotId === slotId &&
                l.rung === rung
              ),
          ),
        }));
      },
      rate: (dayId, slotId, rung, rating) => {
        upsert(dayId, slotId, rung, (log) => ({ ...log, rating }));
      },
      setRung: (rung) =>
        setState((p) => ({ ...p, rung: Math.min(Math.max(1, rung), p.totalRungs) })),
      setDay: (dayId) => setState((p) => ({ ...p, dayId })),
      nextDay: () =>
        setState((p) => {
          const idx = p.days.findIndex((d) => d.id === p.dayId);
          const next = (idx + 1) % p.days.length;
          return { ...p, dayId: p.days[next].id };
        }),
      patchSlot: (dayId, slotId, patch) =>
        setState((p) => ({
          ...p,
          days: p.days.map((d) =>
            d.id !== dayId
              ? d
              : { ...d, slots: d.slots.map((s) => (s.id === slotId ? { ...s, ...patch } : s)) },
          ),
        })),
      swapExercise: (dayId, slotId, exerciseId, rm10) =>
        setState((p) => ({
          ...p,
          days: p.days.map((d) =>
            d.id !== dayId
              ? d
              : {
                  ...d,
                  slots: d.slots.map((s) =>
                    s.id === slotId
                      ? {
                          ...s,
                          exerciseId,
                          rm10,
                          // A new pick starts fresh from 85% of its 10RM.
                          baseWeight: rm10 > 0 ? Math.round((rm10 * 0.85) / 5) * 5 : s.baseWeight,
                          incLb: exercise(exerciseId).equip === "barbell" ? 5 : s.incLb,
                        }
                      : s,
                  ),
                },
          ),
        })),
      setFormula: (patch) => setState((p) => ({ ...p, formula: { ...p.formula, ...patch } })),
      setPref: (patch) => setState((p) => ({ ...p, ...patch })),
      resetAll: () => {
        void wipeState();
        setState(seedState());
      },
      importState: (raw) => {
        try {
          const parsed = JSON.parse(raw) as Partial<AppState>;
          if (!Array.isArray(parsed.days) || parsed.days.length !== 6) {
            return { ok: false, error: "Not a Fitz backup file." };
          }
          setState(hydrate(parsed));
          return { ok: true };
        } catch {
          return { ok: false, error: "Could not read that file." };
        }
      },
      exportState: () => JSON.stringify(state, null, 2),
    };
  }, [state, ready, logFor, upsert]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore outside provider");
  return ctx;
}
