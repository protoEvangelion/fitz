import { useMemo } from "react";
import { exercise } from "../state/library";
import { shortDate } from "../state/formula";
import { useStore } from "../state/store";
import { EQUIP_SHORT, type SlotLog } from "../state/types";

interface Group {
  dayId: string;
  rung: number;
  logs: SlotLog[];
  sets: number;
  volume: number;
}

export function HistoryView() {
  const { state } = useStore();

  const dates = useMemo(() => {
    const byDate = new Map<string, SlotLog[]>();
    for (const log of state.logs) {
      if (!log.sets.length) continue;
      const list = byDate.get(log.date) ?? [];
      list.push(log);
      byDate.set(log.date, list);
    }
    const out: Array<{ date: string; groups: Group[]; sets: number; volume: number }> = [];
    for (const [date, logs] of [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))) {
      const map = new Map<string, Group>();
      for (const log of logs) {
        const key = `${log.dayId}:${log.rung}`;
        const g = map.get(key) ?? { dayId: log.dayId, rung: log.rung, logs: [], sets: 0, volume: 0 };
        g.logs.push(log);
        g.sets += log.sets.length;
        g.volume += log.sets.reduce((n, s) => n + s.weight * s.reps, 0);
        map.set(key, g);
      }
      out.push({
        date,
        groups: [...map.values()],
        sets: logs.reduce((n, l) => n + l.sets.length, 0),
        volume: logs.reduce((n, l) => n + l.sets.reduce((m, s) => m + s.weight * s.reps, 0), 0),
      });
    }
    return out;
  }, [state.logs]);

  if (dates.length === 0) {
    return (
      <main className="page">
        <section className="lede">
          <h1 className="day-title">Nothing logged yet</h1>
          <p className="day-sub">Sets you tick off on the Today screen land here, on this device only.</p>
        </section>
        <div className="empty">
          <div className="mark-line" />
          <h2>Your first entry is one tap away</h2>
          <p>
            Open any exercise, put in your reps, and tap log. The rating you pick is kept with the
            set so you can see what felt heavy two weeks ago.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="lede" style={{ paddingBottom: 10 }}>
        <h1 className="day-title">
          {dates.length} training {dates.length === 1 ? "day" : "days"}
        </h1>
        <p className="day-sub">
          {dates.reduce((n, d) => n + d.sets, 0)} {dates.reduce((n, d) => n + d.sets, 0) === 1 ? "set" : "sets"} ·{" "}
          {Math.round(dates.reduce((n, d) => n + d.volume, 0)).toLocaleString()} lb moved
        </p>
      </section>

      {dates.map((d) => (
        <section className="hist-day" key={d.date}>
          <div className="hist-head">
            <span className="hist-date">{shortDate(d.date)}</span>
            <span className="hist-meta">
              {d.sets} {d.sets === 1 ? "set" : "sets"} · {Math.round(d.volume).toLocaleString()} lb
            </span>
          </div>
          {d.groups.map((g) => {
            const day = state.days.find((x) => x.id === g.dayId);
            return (
              <div key={`${g.dayId}-${g.rung}`} style={{ borderTop: "1px solid var(--rule-soft)" }}>
                <div className="hist-head" style={{ paddingTop: 10, paddingBottom: 2 }}>
                  <span className="micro" style={{ color: "var(--ink-2)" }}>
                    Day {day?.n ?? "?"} · {day?.title ?? g.dayId}
                  </span>
                  <span className="hist-meta">week {g.rung}</span>
                </div>
                {g.logs.map((log) => {
                  const slot = day?.slots.find((s) => s.id === log.slotId);
                  const ex = slot ? exercise(slot.exerciseId) : null;
                  const best = log.sets.reduce(
                    (m, s) => (s.weight * s.reps > m.weight * m.reps ? s : m),
                    log.sets[0],
                  );
                  return (
                    <div className="hist-slot" key={log.id}>
                      <div className="n">
                        {ex?.name ?? "Lift"}
                        {log.rating != null && (
                          <span className="hist-rating">
                            {log.rating > 0 ? `+${log.rating}` : log.rating}
                          </span>
                        )}
                      </div>
                      <div className="s">
                        <span className={`badge eq-${ex?.equip ?? "barbell"}`} style={{ marginRight: 6 }}>
                          {ex ? EQUIP_SHORT[ex.equip] : "--"}
                        </span>
                        {log.sets.length} x <b>{best.weight}</b> lb ·{" "}
                        {log.sets.map((s) => s.reps).join(", ")} reps
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </section>
      ))}
      <p className="footnote">
        Volume counts every logged set as weight x reps. Nothing here leaves the device.
      </p>
    </main>
  );
}
