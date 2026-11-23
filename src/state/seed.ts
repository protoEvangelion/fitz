import { startingWeight, targetsForRole } from "./library";
import type { AppState, Day, Slot } from "./types";

interface SlotSeed {
  role: string;
  exerciseId: string;
  rm10: number;
  /** Optional literal override. Defaults to MROUND(10RM x 0.85, 5), the sheet's rule. */
  baseWeight?: number;
  baseSets?: number;
  capSets?: number;
  incLb?: number | null;
}

function slot(day: number, i: number, s: SlotSeed): Slot {
  return {
    id: `d${day}s${i + 1}`,
    role: s.role,
    targets: targetsForRole(s.role),
    exerciseId: s.exerciseId,
    rm10: s.rm10,
    baseWeight: s.baseWeight ?? startingWeight(s.rm10),
    baseSets: s.baseSets ?? 1,
    capSets: s.capSets ?? 3,
    incLb: s.incLb ?? null,
    repGoal: 15,
    rir: 3,
    failLast: true,
  };
}

/**
 * Rung 1 of the sheet, verbatim: the weights, set counts and 10RMs that were
 * already on the page. Everything above rung 1 is computed from the formula.
 */
const DAY_SEEDS: Array<{
  title: string;
  focus: string;
  bridge?: string;
  slots: SlotSeed[];
}> = [
  {
    title: "Chest Focused Upper",
    focus: "Incline push, chest isolation, horizontal push, delts, row",
    slots: [
      { role: "Incline Push", exerciseId: "barbell-incline-med", rm10: 125, baseWeight: 105 },
      { role: "Chest Isolation", exerciseId: "ft-cable-flye", rm10: 65, baseWeight: 55 },
      { role: "Horizontal Push", exerciseId: "barbell-bench-med", rm10: 145, baseWeight: 125 },
      { role: "Rear or Side Delts", exerciseId: "barbell-facepull", rm10: 60, baseWeight: 50 },
      { role: "Horizontal Pull", exerciseId: "barbell-row-bent", rm10: 90, baseWeight: 75, capSets: 5 },
    ],
  },
  {
    title: "Quad Focused Lower",
    focus: "Squat, quad isolation, hamstring isolation, calves, abs",
    bridge: "No rest between day 1 and day 2",
    slots: [
      { role: "Quad Focused", exerciseId: "barbell-squat-high", rm10: 110, baseWeight: 95, capSets: 5 },
      { role: "Quad", exerciseId: "machine-leg-ext", rm10: 30, baseWeight: 25 },
      { role: "Hamstring Isolation", exerciseId: "machine-leg-curl-single", rm10: 30, baseWeight: 25 },
      { role: "Calves", exerciseId: "machine-smith-calf", rm10: 135, baseWeight: 115 },
      { role: "Abs", exerciseId: "bw-hanging-knee", rm10: 195, baseWeight: 165 },
    ],
  },
  {
    title: "Arm Focused Upper",
    focus: "Triceps pair, wide bench, biceps, vertical pull",
    bridge: "No rest between day 2 and day 3",
    slots: [
      { role: "Triceps", exerciseId: "ft-triceps-pushdown", rm10: 45, baseWeight: 40 },
      { role: "Triceps", exerciseId: "barbell-trap-bar", rm10: 55, baseWeight: 45 },
      { role: "Horizontal Push", exerciseId: "barbell-bench-wide", rm10: 135, baseWeight: 115 },
      { role: "Biceps", exerciseId: "ft-cable-hammer", rm10: 70, baseWeight: 60 },
      { role: "Vertical Pull", exerciseId: "ft-pulldown", rm10: 105, baseWeight: 90 },
    ],
  },
  {
    title: "Glute Focused Lower",
    focus: "Deadlift, pull-throughs, knee extension, calves, abs",
    bridge: "No rest between day 3 and day 4",
    slots: [
      { role: "Glute", exerciseId: "barbell-deadlift", rm10: 180, baseWeight: 155, capSets: 4 },
      { role: "Glute", exerciseId: "ft-pullthrough", rm10: 90, baseWeight: 75 },
      { role: "Quad", exerciseId: "machine-leg-ext", rm10: 30, baseWeight: 25 },
      { role: "Calves", exerciseId: "machine-calf", rm10: 135, baseWeight: 115 },
      { role: "Abs", exerciseId: "bw-hanging-straight", rm10: 165, baseWeight: 140 },
    ],
  },
  {
    title: "Back Focused Upper",
    focus: "Vertical pulls, row, two biceps",
    bridge: "No rest between day 4 and day 5",
    slots: [
      { role: "Vertical Pull", exerciseId: "bodyweight-pullup", rm10: 165, baseWeight: 140 },
      { role: "Vertical Pull", exerciseId: "ft-pulldown", rm10: 90, baseWeight: 75 },
      { role: "Horizontal Pull", exerciseId: "barbell-row-bent", rm10: 130 },
      { role: "Biceps", exerciseId: "free-hammer", rm10: 65, baseWeight: 55 },
      { role: "Biceps", exerciseId: "barbell-curl", rm10: 55, baseWeight: 45 },
    ],
  },
  {
    title: "Ham Calf Shoulder Focused",
    focus: "Leg curl, calves, overhead press, facepull, shrug",
    bridge: "Rest one day between day 6 and the next rung's day 1",
    slots: [
      { role: "Hamstring Hinge", exerciseId: "machine-leg-curl", rm10: 90, baseWeight: 75, baseSets: 2, capSets: 4 },
      { role: "Calves", exerciseId: "machine-smith-calf", rm10: 135, baseWeight: 115, baseSets: 2, capSets: 4 },
      { role: "Front Delts", exerciseId: "barbell-ohp", rm10: 55, baseWeight: 45, baseSets: 2, capSets: 4 },
      { role: "Rear or Side Delts", exerciseId: "ft-facepull", rm10: 60, baseWeight: 50, baseSets: 3, capSets: 4 },
      { role: "Traps", exerciseId: "barbell-shrug", rm10: 110, baseWeight: 95, baseSets: 2, capSets: 4 },
    ],
  },
];

export function buildDays(): Day[] {
  return DAY_SEEDS.map((d, i) => ({
    id: `d${i + 1}`,
    n: i + 1,
    title: d.title,
    focus: d.focus,
    bridge: d.bridge,
    slots: d.slots.map((s, j) => slot(i + 1, j, s)),
  }));
}

export function seedState(): AppState {
  return {
    version: 1,
    rung: 1,
    totalRungs: 6,
    dayId: "d1",
    restSec: 120,
    sound: true,
    haptics: true,
    formula: { mode: "compound", rate: 1.1, stepLb: 5, roundTo: 5, setsCap: 5 },
    days: buildDays(),
    logs: [],
    createdAt: Date.now(),
  };
}
