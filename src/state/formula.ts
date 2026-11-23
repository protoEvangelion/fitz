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
 *   base        = MROUND(10RM x 0.85, 5)      (rung 1)
 *   weight(r)   = MROUND(weight(r-1) x rate, 5)   rate defaults to 1.1
 *   sets(rung)  = baseSets + (rung - 1), capped by the slot and the ceiling
 *
 * The sheet's own chain is MROUND(J13*1.1,5), so each rung compounds off the
 * previous rung rather than adding a flat number of pounds. The flat "step"
 * mode stays available for lifts where 10% is too much.
 */
export function targetWeight(slot: Slot, rung: number, f: Formula): number {
  if (f.mode === "compound") {
    let w = slot.baseWeight;
    for (let r = 1; r < rung; r++) w = roundTo(w * f.rate, f.roundTo);
    return Math.max(0, roundTo(w, f.roundTo));
  }
  const raw = slot.baseWeight + stepFor(slot, f) * (rung - 1);
  return Math.max(0, roundTo(raw, f.roundTo));
}

/** How this lift moves from rung 1, in words, for the editor. */
export function ladderText(slot: Slot, f: Formula): string {
  if (f.mode === "compound") return `x${f.rate.toFixed(2).replace(/\.?0+$/, "")} per rung`;
  return `+${stepFor(slot, f)} lb per rung`;
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

/** "105 x 1.1 x 1.1 = 127" or "105 + 5 x 2 = 115", for the row under the weight. */
export function ladderMath(slot: Slot, rung: number, f: Formula): string {
  if (f.mode === "compound") {
    const chain = [slot.baseWeight];
    for (let r = 1; r < rung; r++) chain.push(roundTo(chain[r - 1] * f.rate, f.roundTo));
    return rung === 1 ? `${slot.baseWeight} lb, rung 1` : `${chain.join(" > ")} lb`;
  }
  const step = stepFor(slot, f);
  return rung === 1
    ? `${slot.baseWeight} lb, rung 1`
    : `${slot.baseWeight} + ${step} x ${rung - 1} = ${targetWeight(slot, rung, f)} lb`;
}

/** "+2 sets, x1.21 weight" or "+2 sets, +10 lb". */
export function rungDelta(rung: number, f: Formula): string {
  const sets = `+${rung - 1} set${rung > 2 ? "s" : ""}`;
  if (f.mode === "compound") {
    const mult = Math.pow(f.rate, rung - 1);
    return `${sets}, x${mult.toFixed(2).replace(/\.?0+$/, "")} weight`;
  }
  return `${sets}, +${f.stepLb * (rung - 1)} lb`;
}
