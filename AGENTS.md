# Fitz - working notes for agents

Read this before touching UI. Each rule below is a bug we already paid for.

## Shape of the product

- Installable PWA. Phone first, iPad second, desktop browser third.
- No backend. State lives in IndexedDB (`fitz/state`) with a `localStorage` mirror.
- Six days, six weeks. The UI says "week", matching the sheet; the code still calls it `rung`.

## Never reintroduce these

1. **No blur or translucency on pinned chrome.** `backdrop-filter` on the header, tab bar or any
   element at a viewport edge turns into a mush behind macOS Safari/Chrome's floating glass toolbar.
   The header and nav stay opaque (`background: var(--bg)`).
2. **No pinned header in a desktop browser.** In `display-mode: browser` above 700px the page
   reserves 56px of top clearance and `.topbar` is `position: static`. Sticky is for standalone
   app mode only. Above 980px the Day/Week switchers live in the rail, directly under the FITZ
   mark, so they sit at the same depth as the wordmark and never in the browser chrome zone.
3. **No reactive `visualViewport` listeners that scroll.** Scrolling fires viewport events, the
   handler scrolls again, and the page oscillates. If the keyboard must be accommodated, use
   one-shot checks after focus.
4. **No number inputs for reps on iOS.** They cause scroll jumps. The active set uses a slider;
   logged sets show a disabled field; future sets render nothing.
5. **Do not collapse other lifts when one opens.** It moves content above the tap and jerks the
   page. Several lifts may stay open; open ids and scroll position live in `sessionStorage`.
6. **Do not hardcode training numbers.** Weights are `base = MROUND(10RM x 0.85, 5)` then
   `MROUND(base x (1 + 0.02 x (week - 1)), 5)` applying the multiplier to the base, never to the
   previous week. RIR comes from `formula.goals` per week (3/3/2/2/2/1, failure through week 5).
7. **Do not cap sets early.** Sets climb one per week to the ceiling (default 6). Soreness adjusts
   on top and floors at 1.

## Before shipping

```bash
npm run build
for w in 390x844 1024x768 1440x900; do for t in today plan log setup; do
  npx impeccable detect --quiet --viewport $w "http://127.0.0.1:5175/#/$t"; done; done
```

- Screenshot 1440x900 in a browser at scroll 0 **and** mid-scroll: the Day/Week pills must be
  visible and not under the browser toolbar.
- Log a set with the slider: rest starts, the row flips to a disabled value, the next row becomes
  the slider.
- Vercel: keep the 2 newest deployments; `vercel rm <url> --confirm-name <url>` deletes older ones.
