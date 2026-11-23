import { useMemo, useState } from "react";
import { LIBRARY, exercise } from "../state/library";
import { EQUIP_LABEL, EQUIP_SHORT, type Equip } from "../state/types";
import { IconCheck, IconSearch } from "./pickicons";
import { Sheet } from "./Sheet";

const ORDER: Equip[] = ["ft", "barbell", "free", "machine", "body"];
const FILTERS: Array<{ id: Equip | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "ft", label: "Trainer" },
  { id: "barbell", label: "Barbell" },
  { id: "free", label: "Free" },
  { id: "machine", label: "Machine" },
  { id: "body", label: "Body" },
];

interface Props {
  currentId: string;
  onPick: (id: string) => void;
  onClose: () => void;
}

export function ExercisePicker({ currentId, onPick, onClose }: Props) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Equip | "all">("all");

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return ORDER.map((eq) => ({
      eq,
      items: LIBRARY.filter(
        (e) =>
          (filter === "all" || e.equip === eq) &&
          e.equip === eq &&
          (!needle ||
            e.name.toLowerCase().includes(needle) ||
            e.pattern.includes(needle) ||
            EQUIP_LABEL[e.equip].toLowerCase().includes(needle)),
      ),
    })).filter((g) => g.items.length);
  }, [q, filter]);

  return (
    <Sheet title="Swap exercise" onClose={onClose} flush action={<span className="micro">{LIBRARY.length} lifts</span>}>
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
      </div>
      <div className="filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={filter === f.id ? "chip is-on" : "chip"}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {groups.length === 0 && (
        <p style={{ padding: "22px 18px", color: "var(--muted)", fontSize: 13 }}>
          Nothing matches "{q}". Try "cable", "row" or "squat".
        </p>
      )}
      {groups.map((g) => (
        <section className="pickgroup" key={g.eq}>
          <h3>{EQUIP_LABEL[g.eq]}</h3>
          {g.items.map((e) => {
            const on = e.id === currentId;
            return (
              <button
                key={e.id}
                className={on ? "pick is-on" : "pick"}
                onClick={() => onPick(e.id)}
              >
                <span className={`badge eq-${e.equip}`}>{EQUIP_SHORT[e.equip]}</span>
                <span className="pick-name">{e.name}</span>
                {on ? <IconCheck /> : <span className="pick-eq">{exercise(e.id).pattern}</span>}
              </button>
            );
          })}
        </section>
      ))}
    </Sheet>
  );
}
