# Fitz

A pocket training card, built from a spreadsheet. Six days, five lifts each, six rungs.
Installable on iPhone, works offline, stores everything in the browser's local database.

## What is in here

- **Today** - the current day at the current rung. Weights come from the formula, not from a table.
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

Rung 1 holds the numbers from the sheet verbatim. Everything above it is computed:

```
weight(rung) = base + step * (rung - 1)     rounded to 5 lb
sets(rung)   = base sets + (rung - 1)       capped by the lift and the set ceiling
```

`base` and `base sets` are editable per lift. `step` defaults to 5 lb and can be overridden per
lift (2.5 / 5 / 10 / global default). Set ceilings are per lift because isolation work stops
climbing at 3 sets while the big barbell lifts go to 4-5.

The 10RM column is used as a starting suggestion: `85% of 10RM`, rounded to 5 lb, is the sheet's
rule for a rung 1 weight. Tap `85%` in the lift editor to apply it.

## Words

The sheet's weeks are called **rungs** here on purpose: a rung is one pass through the same six
days, so there is one loop instead of a calendar. Nothing in the UI talks about phases, blocks or
cycles.

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

## Install on iPhone

Must be Safari: Chrome and Firefox on iOS cannot install a web app.

1. Open https://fitz-xi.vercel.app in Safari.
2. Tap the Share button (square with the up arrow) in the toolbar.
3. Scroll the share sheet and tap Add to Home Screen.
4. Name it Fitz, tap Add, then open it from the home screen.

It launches full screen with a dark launch image, respects the safe areas, and works with no signal
after the first load. Chrome or Edge on a computer can install the same way from the address bar.

Deleting the icon can clear this app's website data, so export a backup from Setup before you remove
it.
