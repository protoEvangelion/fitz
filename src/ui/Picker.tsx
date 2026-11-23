import { useMemo, useState } from "react";
import { LIBRARY, exercise, muscleLabel } from "../state/library";
import { EQUIP_LABEL, EQUIP_SHORT, type Equip, type Muscle } from "../state/types";
import { IconCheck, IconSearch } from "./pickicons";
import { Sheet } from "./Sheet";

const ORDER: Equip[] = ["ft", "barbell", "free", "machine", "body"];

interface Props {
  currentId: string;
  /** Body parts this slot is for. Empty list means no scoping. */
  targets: Muscle[];
  onPick: (id: string) => void;
  onClose: () => void;
}

export function ExercisePicker({ currentId, targets, onPick, onClose }: Props) {
  const scoped = targets.length > 0;
  const [showAll, setShowAll] = useState(!scoped);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Equip | "all">("all");

  const pool = useMemo(
    () => (showAll || !scoped ? LIBRARY : LIBRARY.filter((e) => targets.includes(e.muscle))),
    [showAll, scoped, targets],
  );

  const equips = useMemo(() => ORDER.filter((eq) => pool.some((e) => e.equip === eq)), [pool]);

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return ORDER.map((eq) => ({
      eq,
      items: pool.filter(
        (e) =>
          e.equip === eq &&
          (filter === "all" || filter === eq) &&
          (!needle ||
            e.name.toLowerCase().includes(needle) ||
            e.muscle.includes(needle) ||
            e.pattern.includes(needle) ||
            EQUIP_LABEL[e.equip].toLowerCase().includes(needle)),
      ),
    })).filter((g) => g.items.length);
  }, [pool, q, filter]);

  const scopeLabel = scoped ? targets.map(muscleLabel).join(" & ").toLowerCase() : "all lifts";
  const count = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <Sheet
      title="Swap exercise"
      onClose={onClose}
      flush
      action={<span className="micro">{count} shown</span>}
    >
      <div style={{ padding: "0 18px 12px" }}>
        <div className="search">
          <IconSearch />
          <label className="sr-only" htmlFor="lift-search">
            Search exercises
          </label>
          <input
            id="lift-search"
            name="lift-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search lifts"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <p className="footnote" style={{ padding: "10px 0 0" }}>
          {showAll
            ? `Showing all ${LIBRARY.length} lifts.`
            : `${scopeLabel.charAt(0).toUpperCase() + scopeLabel.slice(1)} only, from the ${LIBRARY.length}-lift bank.`}
        </p>
      </div>

      <div className="filters">
        <button className={filter === "all" ? "chip is-on" : "chip"} onClick={() => setFilter("all")}>
          All
        </button>
        {equips.map((eq) => (
          <button
            key={eq}
            className={filter === eq ? "chip is-on" : "chip"}
            onClick={() => setFilter(eq)}
          >
            {eq === "ft" ? "Trainer" : eq === "barbell" ? "Barbell" : eq === "free" ? "Free" : eq === "machine" ? "Machine" : "Body"}
          </button>
        ))}
      </div>

      {groups.length === 0 && (
        <div style={{ padding: "24px 18px 18px" }}>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
            Nothing in {scopeLabel} matches "{q}".
          </p>
          {scoped && !showAll && (
            <button
              className="btn btn-block"
              style={{ marginTop: 14 }}
              onClick={() => {
                setShowAll(true);
                setFilter("all");
              }}
            >
              Search all {LIBRARY.length} lifts
            </button>
          )}
        </div>
      )}

      {groups.map((g) => (
        <section className="pickgroup" key={g.eq}>
          <h3>{EQUIP_LABEL[g.eq]}</h3>
          {g.items.map((e) => {
            const on = e.id === currentId;
            return (
              <button key={e.id} className={on ? "pick is-on" : "pick"} onClick={() => onPick(e.id)}>
                <span className={`badge eq-${e.equip}`}>{EQUIP_SHORT[e.equip]}</span>
                <span className="pick-name">{e.name}</span>
                {on ? (
                  <IconCheck />
                ) : showAll ? (
                  <span className="pick-eq">{exercise(e.id).muscle}</span>
                ) : null}
              </button>
            );
          })}
        </section>
      ))}

      {scoped && groups.length > 0 && (
        <div style={{ padding: "14px 18px 4px" }}>
          <button
            className="btn btn-block btn-ghost"
            onClick={() => {
              setShowAll(!showAll);
              setFilter("all");
            }}
          >
            {showAll ? `Back to ${scopeLabel} only` : `Show all ${LIBRARY.length} lifts`}
          </button>
        </div>
      )}
    </Sheet>
  );
}
