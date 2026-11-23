import type { Formula, Slot } from "./types";

export function stepFor(slot: Slot, f: Formula): number {
  return slot.incLb ?? f.stepLb;
}

export function roundTo(n: number, step: number): number {
  if (!step) return n;
  return Math.round(n / step) * step;
}

/**
 * The whole progression, in two lines.
 *
 *   weight(rung) = baseWeight + step * (rung - 1), rounded to 5 lb
 *   sets(rung)   = baseSets + (rung - 1), capped by the slot and the ceiling
 *
 * Base values are rung 1 of the sheet. Nothing else is stored per rung, so
 * editing a base weight moves the whole ladder for that lift.
 */
export function targetWeight(slot: Slot, rung: number, f: Formula): number {
  const raw = slot.baseWeight + stepFor(slot, f) * (rung - 1);
  return Math.max(0, roundTo(raw, f.roundTo));
}

export function targetSets(slot: Slot, rung: number, f: Formula): number {
  return Math.min(slot.baseSets + (rung - 1), slot.capSets, f.setsCap);
}

export function repText(slot: Slot): string {
  return slot.failLast ? `${slot.rir} RIR, last set to failure` : `${slot.rir} RIR`;
}

export function todayKey(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function shortDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

export function clock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
