import type { Exercise } from "./types";

/**
 * Exercise bank. Functional trainer and barbell first, because that is what
 * the program is built around. Free weights, machines and bodyweight are here
 * as swaps, not as the default path.
 */
export const LIBRARY: Exercise[] = [
  // Functional trainer
  { id: "ft-cable-flye", name: "Cable Flye", equip: "ft", pattern: "push" },
  { id: "ft-crossover", name: "Cable Crossover", equip: "ft", pattern: "push" },
  { id: "ft-fly-low", name: "Low-to-High Cable Fly", equip: "ft", pattern: "push" },
  { id: "ft-chest-press", name: "Cable Chest Press", equip: "ft", pattern: "push" },
  { id: "ft-triceps-pushdown", name: "Cable Triceps Pushdown", equip: "ft", pattern: "arms" },
  { id: "ft-overhead-ext", name: "Rope Overhead Extension", equip: "ft", pattern: "arms" },
  { id: "ft-cable-curl", name: "Cable Curl", equip: "ft", pattern: "arms" },
  { id: "ft-cable-hammer", name: "Cable Hammer Curl", equip: "ft", pattern: "arms" },
  { id: "ft-pulldown", name: "Cable Lat Pulldown", equip: "ft", pattern: "pull" },
  { id: "ft-row-seated", name: "Seated Cable Row", equip: "ft", pattern: "pull" },
  { id: "ft-straight-arm", name: "Straight-Arm Pulldown", equip: "ft", pattern: "pull" },
  { id: "ft-facepull", name: "Cable Facepull", equip: "ft", pattern: "delts" },
  { id: "ft-rear-delt", name: "Cable Rear-Delt Fly", equip: "ft", pattern: "delts" },
  { id: "ft-lateral", name: "Cable Lateral Raise", equip: "ft", pattern: "delts" },
  { id: "ft-upright", name: "Cable Upright Row", equip: "ft", pattern: "delts" },
  { id: "ft-pullthrough", name: "Cable Pull-Through", equip: "ft", pattern: "hinge" },
  { id: "ft-glute-kickback", name: "Cable Glute Kickback", equip: "ft", pattern: "hinge" },
  { id: "ft-hip-thrust", name: "Cable Hip Thrust", equip: "ft", pattern: "hinge" },
  { id: "ft-squat", name: "Cable Squat", equip: "ft", pattern: "squat" },
  { id: "ft-woodchop", name: "Cable Woodchop", equip: "ft", pattern: "core" },
  { id: "ft-crunch", name: "Cable Crunch", equip: "ft", pattern: "core" },
  { id: "ft-pallof", name: "Pallof Press", equip: "ft", pattern: "core" },
  { id: "ft-shrug", name: "Cable Shrug", equip: "ft", pattern: "traps" },
  { id: "ft-calf", name: "Cable Calf Raise", equip: "ft", pattern: "calves" },

  // Barbell
  { id: "barbell-incline-med", name: "Incline Medium-Grip Bench Press", equip: "barbell", pattern: "push" },
  { id: "barbell-bench-med", name: "Medium-Grip Bench Press", equip: "barbell", pattern: "push" },
  { id: "barbell-bench-wide", name: "Wide-Grip Bench Press", equip: "barbell", pattern: "push" },
  { id: "barbell-landmine", name: "Landmine Press", equip: "barbell", pattern: "push" },
  { id: "barbell-trap-bar", name: "Trap-Bar Close-Grip Press", equip: "barbell", pattern: "push" },
  { id: "barbell-ohp", name: "Standing Barbell Shoulder Press", equip: "barbell", pattern: "delts" },
  { id: "barbell-facepull", name: "Barbell Facepull", equip: "barbell", pattern: "delts" },
  { id: "barbell-row-bent", name: "Barbell Bent-Over Row", equip: "barbell", pattern: "pull" },
  { id: "barbell-row-pendlay", name: "Pendlay Row", equip: "barbell", pattern: "pull" },
  { id: "barbell-squat-high", name: "High-Bar Squat", equip: "barbell", pattern: "squat" },
  { id: "barbell-squat-front", name: "Front Squat", equip: "barbell", pattern: "squat" },
  { id: "barbell-zercher", name: "Zercher Squat", equip: "barbell", pattern: "squat" },
  { id: "barbell-lunge", name: "Barbell Reverse Lunge", equip: "barbell", pattern: "squat" },
  { id: "barbell-deadlift", name: "Conventional Deadlift", equip: "barbell", pattern: "hinge" },
  { id: "barbell-rdl", name: "Romanian Deadlift", equip: "barbell", pattern: "hinge" },
  { id: "barbell-goodmorning", name: "Good Morning", equip: "barbell", pattern: "hinge" },
  { id: "barbell-hip-thrust", name: "Barbell Hip Thrust", equip: "barbell", pattern: "hinge" },
  { id: "barbell-curl", name: "Barbell Curl", equip: "barbell", pattern: "arms" },
  { id: "barbell-skullcrusher", name: "EZ-Bar Skullcrusher", equip: "barbell", pattern: "arms" },
  { id: "barbell-shrug", name: "Barbell Shrug", equip: "barbell", pattern: "traps" },

  // Free weights, used sparingly
  { id: "free-incline-db", name: "Dumbbell Incline Press", equip: "free", pattern: "push" },
  { id: "free-db-row", name: "Dumbbell Row", equip: "free", pattern: "pull" },
  { id: "free-hammer", name: "Hammer Curls", equip: "free", pattern: "arms" },
  { id: "free-db-lateral", name: "Dumbbell Lateral Raise", equip: "free", pattern: "delts" },
  { id: "free-db-rdl", name: "Dumbbell RDL", equip: "free", pattern: "hinge" },
  { id: "free-goblet", name: "Goblet Squat", equip: "free", pattern: "squat" },
  { id: "free-db-shrug", name: "Dumbbell Shrug", equip: "free", pattern: "traps" },

  // Machines
  { id: "machine-leg-ext", name: "Leg Extension", equip: "machine", pattern: "squat" },
  { id: "machine-leg-curl", name: "Leg Curl", equip: "machine", pattern: "hinge" },
  { id: "machine-leg-curl-single", name: "Single-Leg Leg Curl", equip: "machine", pattern: "hinge" },
  { id: "machine-smith-calf", name: "Smith Machine Calf Raise", equip: "machine", pattern: "calves" },
  { id: "machine-calf", name: "Calf Machine Raise", equip: "machine", pattern: "calves" },
  { id: "machine-pec-deck", name: "Pec Deck", equip: "machine", pattern: "push" },
  { id: "machine-chest-press", name: "Chest Press Machine", equip: "machine", pattern: "push" },
  { id: "machine-shoulder-press", name: "Machine Shoulder Press", equip: "machine", pattern: "delts" },
  { id: "machine-assisted-pullup", name: "Assisted Pull-Up", equip: "machine", pattern: "pull" },

  // Bodyweight
  { id: "bw-hanging-knee", name: "Hanging Knee Raise", equip: "body", pattern: "core" },
  { id: "bw-hanging-straight", name: "Hanging Straight-Leg Raise", equip: "body", pattern: "core" },
  { id: "bodyweight-pullup", name: "Overhand Pull-Up", equip: "body", pattern: "pull" },
  { id: "bw-dip", name: "Dip", equip: "body", pattern: "push" },
  { id: "bw-pushup", name: "Push-Up", equip: "body", pattern: "push" },
];

const BY_ID = new Map(LIBRARY.map((e) => [e.id, e]));

export function exercise(id: string): Exercise {
  return BY_ID.get(id) ?? { id, name: id, equip: "barbell", pattern: "push" };
}

/** 85% of a 10-rep max, rounded to the nearest 5 lb. The sheet's starting weight rule. */
export function startingWeight(rm10: number, roundTo = 5): number {
  if (!rm10) return 0;
  return Math.round((rm10 * 0.85) / roundTo) * roundTo;
}
