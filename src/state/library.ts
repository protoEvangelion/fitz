import type { Exercise, Muscle } from "./types";

/**
 * Exercise bank. Functional trainer and barbell first, because that is what
 * the program is built around. Free weights, machines and bodyweight are here
 * as swaps, not as the default path.
 */
export const LIBRARY: Exercise[] = [
  // Functional trainer
  { id: "ft-cable-flye", name: "Cable Flye", equip: "ft", pattern: "push", muscle: "chest" },
  { id: "ft-crossover", name: "Cable Crossover", equip: "ft", pattern: "push", muscle: "chest" },
  { id: "ft-fly-low", name: "Low-to-High Cable Fly", equip: "ft", pattern: "push", muscle: "chest" },
  { id: "ft-chest-press", name: "Cable Chest Press", equip: "ft", pattern: "push", muscle: "chest" },
  { id: "ft-triceps-pushdown", name: "Cable Triceps Pushdown", equip: "ft", pattern: "arms", muscle: "triceps" },
  { id: "ft-overhead-ext", name: "Rope Overhead Extension", equip: "ft", pattern: "arms", muscle: "triceps" },
  { id: "ft-triceps-kickback", name: "Cable Triceps Kickback", equip: "ft", pattern: "arms", muscle: "triceps" },
  { id: "ft-cable-curl", name: "Cable Curl", equip: "ft", pattern: "arms", muscle: "biceps" },
  { id: "ft-cable-hammer", name: "Cable Hammer Curl", equip: "ft", pattern: "arms", muscle: "biceps" },
  { id: "ft-pulldown", name: "Cable Lat Pulldown", equip: "ft", pattern: "pull", muscle: "back" },
  { id: "ft-row-seated", name: "Seated Cable Row", equip: "ft", pattern: "pull", muscle: "back" },
  { id: "ft-straight-arm", name: "Straight-Arm Pulldown", equip: "ft", pattern: "pull", muscle: "back" },
  { id: "ft-facepull", name: "Cable Facepull", equip: "ft", pattern: "delts", muscle: "shoulders" },
  { id: "ft-rear-delt", name: "Cable Rear-Delt Fly", equip: "ft", pattern: "delts", muscle: "shoulders" },
  { id: "ft-lateral", name: "Cable Lateral Raise", equip: "ft", pattern: "delts", muscle: "shoulders" },
  { id: "ft-upright", name: "Cable Upright Row", equip: "ft", pattern: "delts", muscle: "shoulders" },
  { id: "ft-pullthrough", name: "Cable Pull-Through", equip: "ft", pattern: "hinge", muscle: "glutes" },
  { id: "ft-glute-kickback", name: "Cable Glute Kickback", equip: "ft", pattern: "hinge", muscle: "glutes" },
  { id: "ft-hip-thrust", name: "Cable Hip Thrust", equip: "ft", pattern: "hinge", muscle: "glutes" },
  { id: "ft-squat", name: "Cable Squat", equip: "ft", pattern: "squat", muscle: "quads" },
  { id: "ft-woodchop", name: "Cable Woodchop", equip: "ft", pattern: "core", muscle: "abs" },
  { id: "ft-crunch", name: "Cable Crunch", equip: "ft", pattern: "core", muscle: "abs" },
  { id: "ft-pallof", name: "Pallof Press", equip: "ft", pattern: "core", muscle: "abs" },
  { id: "ft-shrug", name: "Cable Shrug", equip: "ft", pattern: "traps", muscle: "traps" },
  { id: "ft-calf", name: "Cable Calf Raise", equip: "ft", pattern: "calves", muscle: "calves" },

  // Barbell
  { id: "barbell-incline-med", name: "Incline Medium-Grip Bench Press", equip: "barbell", pattern: "push", muscle: "chest" },
  { id: "barbell-bench-med", name: "Medium-Grip Bench Press", equip: "barbell", pattern: "push", muscle: "chest" },
  { id: "barbell-bench-wide", name: "Wide-Grip Bench Press", equip: "barbell", pattern: "push", muscle: "chest" },
  { id: "barbell-landmine", name: "Landmine Press", equip: "barbell", pattern: "push", muscle: "shoulders" },
  { id: "barbell-trap-bar", name: "Trap-Bar Close-Grip Press", equip: "barbell", pattern: "push", muscle: "triceps" },
  { id: "barbell-close-grip-bench", name: "Close-Grip Bench Press", equip: "barbell", pattern: "push", muscle: "triceps" },
  { id: "barbell-ohp", name: "Standing Barbell Shoulder Press", equip: "barbell", pattern: "delts", muscle: "shoulders" },
  { id: "barbell-facepull", name: "Barbell Facepull", equip: "barbell", pattern: "delts", muscle: "shoulders" },
  { id: "barbell-row-bent", name: "Barbell Bent-Over Row", equip: "barbell", pattern: "pull", muscle: "back" },
  { id: "barbell-row-pendlay", name: "Pendlay Row", equip: "barbell", pattern: "pull", muscle: "back" },
  { id: "barbell-squat-high", name: "High-Bar Squat", equip: "barbell", pattern: "squat", muscle: "quads" },
  { id: "barbell-squat-front", name: "Front Squat", equip: "barbell", pattern: "squat", muscle: "quads" },
  { id: "barbell-zercher", name: "Zercher Squat", equip: "barbell", pattern: "squat", muscle: "quads" },
  { id: "barbell-lunge", name: "Barbell Reverse Lunge", equip: "barbell", pattern: "squat", muscle: "quads" },
  { id: "barbell-deadlift", name: "Conventional Deadlift", equip: "barbell", pattern: "hinge", muscle: "glutes" },
  { id: "barbell-rdl", name: "Romanian Deadlift", equip: "barbell", pattern: "hinge", muscle: "hamstrings" },
  { id: "barbell-goodmorning", name: "Good Morning", equip: "barbell", pattern: "hinge", muscle: "hamstrings" },
  { id: "barbell-hip-thrust", name: "Barbell Hip Thrust", equip: "barbell", pattern: "hinge", muscle: "glutes" },
  { id: "barbell-curl", name: "Barbell Curl", equip: "barbell", pattern: "arms", muscle: "biceps" },
  { id: "barbell-reverse-curl", name: "Reverse EZ-Bar Curl", equip: "barbell", pattern: "arms", muscle: "biceps" },
  { id: "barbell-skullcrusher", name: "EZ-Bar Skullcrusher", equip: "barbell", pattern: "arms", muscle: "triceps" },
  { id: "barbell-shrug", name: "Barbell Shrug", equip: "barbell", pattern: "traps", muscle: "traps" },

  // Free weights, used sparingly
  { id: "free-incline-db", name: "Dumbbell Incline Press", equip: "free", pattern: "push", muscle: "chest" },
  { id: "free-db-row", name: "Dumbbell Row", equip: "free", pattern: "pull", muscle: "back" },
  { id: "free-hammer", name: "Hammer Curls", equip: "free", pattern: "arms", muscle: "biceps" },
  { id: "free-incline-curl", name: "Incline Dumbbell Curl", equip: "free", pattern: "arms", muscle: "biceps" },
  { id: "free-db-lateral", name: "Dumbbell Lateral Raise", equip: "free", pattern: "delts", muscle: "shoulders" },
  { id: "free-db-rdl", name: "Dumbbell RDL", equip: "free", pattern: "hinge", muscle: "hamstrings" },
  { id: "free-goblet", name: "Goblet Squat", equip: "free", pattern: "squat", muscle: "quads" },
  { id: "free-db-shrug", name: "Dumbbell Shrug", equip: "free", pattern: "traps", muscle: "traps" },

  // Machines
  { id: "machine-leg-ext", name: "Leg Extension", equip: "machine", pattern: "squat", muscle: "quads" },
  { id: "machine-leg-curl", name: "Leg Curl", equip: "machine", pattern: "hinge", muscle: "hamstrings" },
  { id: "machine-leg-curl-single", name: "Single-Leg Leg Curl", equip: "machine", pattern: "hinge", muscle: "hamstrings" },
  { id: "machine-smith-calf", name: "Smith Machine Calf Raise", equip: "machine", pattern: "calves", muscle: "calves" },
  { id: "machine-calf", name: "Calf Machine Raise", equip: "machine", pattern: "calves", muscle: "calves" },
  { id: "machine-pec-deck", name: "Pec Deck", equip: "machine", pattern: "push", muscle: "chest" },
  { id: "machine-chest-press", name: "Chest Press Machine", equip: "machine", pattern: "push", muscle: "chest" },
  { id: "machine-shoulder-press", name: "Machine Shoulder Press", equip: "machine", pattern: "delts", muscle: "shoulders" },
  { id: "machine-assisted-pullup", name: "Assisted Pull-Up", equip: "machine", pattern: "pull", muscle: "back" },
  { id: "machine-row", name: "Machine Row", equip: "machine", pattern: "pull", muscle: "back" },

  // Bodyweight
  { id: "bw-hanging-knee", name: "Hanging Knee Raise", equip: "body", pattern: "core", muscle: "abs" },
  { id: "bw-hanging-straight", name: "Hanging Straight-Leg Raise", equip: "body", pattern: "core", muscle: "abs" },
  { id: "bodyweight-pullup", name: "Overhand Pull-Up", equip: "body", pattern: "pull", muscle: "back" },
  { id: "bw-dip", name: "Dip", equip: "body", pattern: "push", muscle: "chest" },
  { id: "bw-pushup", name: "Push-Up", equip: "body", pattern: "push", muscle: "chest" },
];

const BY_ID = new Map(LIBRARY.map((e) => [e.id, e]));

export function exercise(id: string): Exercise {
  return BY_ID.get(id) ?? { id, name: id, equip: "barbell", pattern: "push", muscle: "chest" };
}

/** 85% of a 10-rep max, rounded to the nearest 5 lb. The sheet's starting weight rule. */
export function startingWeight(rm10: number, roundTo = 5): number {
  if (!rm10) return 0;
  return Math.round((rm10 * 0.85) / roundTo) * roundTo;
}

/**
 * Each slot is a body-part job ("Chest Isolation", "Triceps"). The swap list is
 * scoped to those parts so a chest row never offers a curl. Roles not listed
 * here stay unscoped.
 */
const ROLE_TARGETS: Record<string, Muscle[]> = {
  "Incline Push": ["chest"],
  "Chest Isolation": ["chest"],
  "Horizontal Push": ["chest"],
  "Back Focused Upper": ["back"],
  "Horizontal Pull": ["back"],
  "Vertical Pull": ["back"],
  "Rear or Side Delts": ["shoulders"],
  "Front Delts": ["shoulders"],
  Triceps: ["triceps"],
  Biceps: ["biceps"],
  "Quad Focused": ["quads", "glutes"],
  Quad: ["quads"],
  "Hamstring Isolation": ["hamstrings"],
  "Hamstring Hinge": ["hamstrings", "glutes"],
  "Glute Focused": ["glutes", "hamstrings"],
  Glute: ["glutes", "hamstrings"],
  Calves: ["calves"],
  Abs: ["abs"],
  Traps: ["traps"],
};

export function targetsForRole(role: string): Muscle[] {
  return ROLE_TARGETS[role] ?? [];
}

export function muscleLabel(m: Muscle): string {
  return m.charAt(0).toUpperCase() + m.slice(1);
}
