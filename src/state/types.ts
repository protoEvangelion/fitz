export type Equip = "ft" | "barbell" | "free" | "machine" | "body";

export type Muscle =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "abs"
  | "traps";

export type Pattern =
  | "push"
  | "pull"
  | "squat"
  | "hinge"
  | "arms"
  | "delts"
  | "core"
  | "calves"
  | "traps";

export interface Exercise {
  id: string;
  name: string;
  equip: Equip;
  pattern: Pattern;
  /** Primary body part. The swap list is scoped to the slot's targets. */
  muscle: Muscle;
  hint?: string;
}

export interface Slot {
  id: string;
  role: string;
  /** Body parts this slot is for. Empty = no scoping. */
  targets: Muscle[];
  exerciseId: string;
  /** Estimated 10-rep max. Used to suggest a starting weight. */
  rm10: number;
  /** Weight used on rung 1. This is the seed value from the sheet. */
  baseWeight: number;
  /** Sets on rung 1. */
  baseSets: number;
  /** Hard ceiling for sets as rungs climb. */
  capSets: number;
  /** Step in lb per rung. null = use the global default. */
  incLb: number | null;
  /** Rep target per set. The sheet asks for 15. */
  repGoal: number;
  /** Reps left in the tank on every set but the last. The sheet says 3. */
  rir: number;
  failLast: boolean;
}

export interface Day {
  id: string;
  n: number;
  title: string;
  focus: string;
  bridge?: string;
  slots: Slot[];
}

export interface SetRec {
  weight: number;
  reps: number;
  at: number;
}

export interface SlotLog {
  id: string;
  date: string;
  dayId: string;
  slotId: string;
  rung: number;
  sets: SetRec[];
  /** 0..4 into RATINGS. undefined = not rated. */
  rating?: number;
}

export interface Formula {
  /**
   * percent: weight(rung) = MROUND(base x (1 + pct x (rung - 1)), roundTo)
   *          base is 85% of the 10RM, so rung 6 sits at +10% of the base.
   * step:    weight(rung) = MROUND(base + stepLb x (rung - 1), roundTo)
   */
  mode: "percent" | "step";
  pct: number;
  stepLb: number;
  roundTo: number;
  setsCap: number;
}

export interface AppState {
  version: 1;
  rung: number;
  totalRungs: number;
  dayId: string;
  restSec: number;
  sound: boolean;
  haptics: boolean;
  formula: Formula;
  days: Day[];
  logs: SlotLog[];
  createdAt: number;
}

export const RATINGS = [
  { key: "2-", label: "2-", short: "Too easy", long: "No soreness, no pump at all." },
  { key: "2-1", label: "2-1", short: "Easy", long: "No soreness, but I felt a pump." },
  { key: "1-0", label: "1-0", short: "Right", long: "Just healed, good pump, plenty of work." },
  { key: "1-1", label: "1-1", short: "Hard", long: "Still notably sore, a lot of work." },
  { key: "1-2", label: "1-2", short: "Too hard", long: "Very sore, everything it took." },
] as const;

export const EQUIP_LABEL: Record<Equip, string> = {
  ft: "Functional trainer",
  barbell: "Barbell",
  free: "Free weights",
  machine: "Machine",
  body: "Bodyweight",
};

export const EQUIP_SHORT: Record<Equip, string> = {
  ft: "FT",
  barbell: "BB",
  free: "DB",
  machine: "MC",
  body: "BW",
};
