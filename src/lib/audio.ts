/**
 * Short synthesised cues. No audio files, no hosting, works offline.
 * iOS only allows audio after a gesture, so unlock() runs on the first tap.
 */
let ctx: AudioContext | null = null;

type Ctor = typeof AudioContext;

export function unlock(): void {
  if (ctx) {
    if (ctx.state === "suspended") void ctx.resume();
    return;
  }
  const AC: Ctor | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
}

function tone(freq: number, dur: number, when = 0, gain = 0.14, type: OscillatorType = "sine") {
  if (!ctx) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function logSet(): void {
  if (!ctx) return;
  tone(392, 0.09, 0, 0.1, "triangle");
  tone(587, 0.1, 0.055, 0.06, "triangle");
}

export function restTick(): void {
  if (!ctx) return;
  tone(1046, 0.05, 0, 0.07, "square");
}

export function snap(): void {
  if (!ctx) return;
  tone(720, 0.035, 0, 0.04, "triangle");
}

export function restDone(): void {
  if (!ctx) return;
  tone(523, 0.14, 0, 0.12);
  tone(659, 0.14, 0.13, 0.12);
  tone(784, 0.3, 0.26, 0.13);
}

/** Short double beep, the plainer end-of-rest cue. */
export function restBeep(): void {
  if (!ctx) return;
  tone(880, 0.09, 0, 0.13, "square");
  tone(880, 0.12, 0.16, 0.13, "square");
}

export function softError(): void {
  if (!ctx) return;
  tone(196, 0.16, 0, 0.08, "sawtooth");
}

export function buzz(pattern: number | number[]): void {
  const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  if (typeof nav.vibrate === "function") nav.vibrate(pattern);
}
