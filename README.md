# Fitz

A pocket training card, built from a spreadsheet. Six days, five lifts each, six rungs.
Installable on iPhone, works offline, stores everything in the browser's local database.

## What is in here

- **Today** - the current day at the current rung. Two sliders scrub the six rungs and the six
  days, so you can start wherever you are in the loop.
- Each lift carries a soreness check-in (2 to -2, default 1) that trims or adds sets for that
  session only; the weight ladder never moves. Weights come from the formula, not from a table.
  Log a set and the rest timer starts, with audio ticks and a chime. Rate the lift on the sheet's
  five-point scale after the first set.
- **Plan** - all six days. Tap a lift to swap it from the exercise bank (functional trainer and
  barbell first, free weights, machines and bodyweight as swaps) or to change its 10RM, rung 1
  weight, step per rung, set counts, reps and RIR. The swap list is scoped to the slot's body part,
  so a chest row only offers chest lifts; "show all" is one tap away when you want to break out.
- **Log** - every set you have logged, grouped by date, day and rung.
- **Setup** - the formula controls, rest and cue preferences, the rating scale legend, backup
  export/import, and a reset back to rung 1.

## The formula

This is the sheet's own chain, reproduced:

```
base        = MROUND(10RM * 0.85, 5)                 rung 1
weight(r)   = MROUND(base * (1 + 0.02 * (r - 1)), 5)  +2% of the base per rung
sets(r)     = base sets + (r - 1)                    capped by the lift and the set ceiling
```

The multiplier is applied to rung 1 every time, never to the previous rung: 1.02, 1.04, 1.06, 1.08,
1.10. So a 145 lb 10RM runs 125 / 130 / 130 / 135 / 135 / 140, which reproduces the sheet's own
week 2 column on 27 of 30 lifts (the other three are hand-entered jumps in the sheet). `+ lb per
rung` is still available in Setup, and `base`/`base sets` stay editable per lift. Set ceilings are
per lift because isolation work stops climbing at 3 sets while the big barbell lifts go to 4-5.

## Words

The sheet's weeks are called **rungs** here on purpose: a rung is one pass through the same six
days, so there is one loop instead of a calendar. Nothing in the UI talks about phases, blocks or
cycles.

## Soreness

| Value | Meaning | Sets |
|---|---|---|
| 2 | Not sore, almost no pump | +1 |
| 1 | Not sore, felt a pump (default) | same |
| 0 | Barely healed, good pump, plenty of work | same |
| -1 | Still notably sore, a lot of work | -1 |
| -2 | Still very sore, overkill | -2 |

The check-in is stored per date, lift and rung, so it resets to 1 on the next session and never
rewrites past entries.

## Data

Everything lives on the device:

- IndexedDB (`fitz` / `state`) is the source of truth.
- `localStorage["fitz:state"]` is a mirror so a cleared-IDB browser still boots.
- No network calls at runtime. The service worker precaches the shell so the app opens with no
  signal after the first load.

Export from Setup writes a versioned JSON file; import accepts the same shape and validates that
it holds six days.

## Development

```bash
npm install
npm run dev      # http://127.0.0.1:5175
npm run build    # dist/ plus the PWA service worker
npm run icons    # regenerate public/icons/*.png from the dumbbell mark
```

Stack: Vite, React, TypeScript, `vite-plugin-pwa`. No UI library, no state library, no backend.

## Install on iPhone or iPad

Must be Safari: Chrome and Firefox on iOS cannot install a web app.

1. Open https://fitz-xi.vercel.app in Safari.
2. Tap the Share button (square with the up arrow) in the toolbar.
3. Scroll the share sheet and tap Add to Home Screen.
4. Name it Fitz, tap Add, then open it from the home screen.

It launches full screen with a dark launch image, respects the safe areas, and works with no signal
after the first load.

On iPad the layout adapts: portrait keeps the bottom tabs with a wider measure, plan lifts sit two
up, and landscape turns the tabs into a left rail. Sheets become centred dialogs above 700px wide. Chrome or Edge on a computer can install the same way from the address bar.

Deleting the icon can clear this app's website data, so export a backup from Setup before you remove
it.
