import { SORENESS_SET_DELTA, type Formula, type Slot } from "./types";

export function stepFor(slot: Slot, f: Formula): number {
  return slot.incLb ?? f.stepLb;
}

export function roundTo(n: number, step: number): number {
  if (!step) return n;
  return Math.round(n / step) * step;
}

/**
 * The sheet's progression, in three lines.
 *
 *   base       = MROUND(10RM x 0.85, 5)                    rung 1
 *   weight(r)  = MROUND(base x (1 + 0.02 x (r - 1)), 5)     +2% of base per rung
 *   sets(rung) = baseSets + (rung - 1), capped
 *
 * The multiplier is applied to the base every time, not to the previous rung,
 * so the ladder is 1.02 / 1.04 / 1.06 / 1.08 / 1.10 of rung 1 - not compounding.
 * A flat +lb per rung stays available for lifts where percentages misbehave.
 */
export function targetWeight(slot: Slot, rung: number, f: Formula): number {
  if (f.mode === "percent") {
    const raw = slot.baseWeight * (1 + f.pct * (rung - 1));
    return Math.max(0, roundTo(raw, f.roundTo));
  }
  const raw = slot.baseWeight + stepFor(slot, f) * (rung - 1);
  return Math.max(0, roundTo(raw, f.roundTo));
}

/** How this lift moves from rung 1, in words, for the editor. */
export function ladderText(slot: Slot, f: Formula): string {
  if (f.mode === "percent") return `+${Math.round(f.pct * 100)}% of base per rung`;
  return `+${stepFor(slot, f)} lb per rung`;
}

export function targetSets(slot: Slot, rung: number, f: Formula): number {
  return Math.min(slot.baseSets + (rung - 1), slot.capSets, f.setsCap);
}

/**
 * The sets you actually do: the formula's target plus whatever today's soreness
 * check-in asks for. The check-in is per session (default 1), never below one set.
 */
export function plannedSets(slot: Slot, rung: number, f: Formula, soreness = 1): number {
  const delta = SORENESS_SET_DELTA[soreness] ?? 0;
  return Math.max(1, targetSets(slot, rung, f) + delta);
}

export function goalFor(rung: number, f: Formula) {
  return f.goals[Math.min(Math.max(0, rung - 1), f.goals.length - 1)] ?? { rir: 3, fail: true };
}

export function goalText(rung: number, f: Formula): string {
  const g = goalFor(rung, f);
  return g.fail ? `${g.rir} RIR, last set to failure` : `${g.rir} RIR throughout`;
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
  if (f.mode === "percent") {
    const chain = Array.from({ length: rung }, (_, i) =>
      roundTo(slot.baseWeight * (1 + f.pct * i), f.roundTo),
    );
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
  if (f.mode === "percent") {
    const pct = Math.round(f.pct * (rung - 1) * 100);
    return `${sets}, +${pct}% of base`;
  }
  return `${sets}, +${f.stepLb * (rung - 1)} lb`;
}
