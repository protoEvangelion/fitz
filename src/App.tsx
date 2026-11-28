import { useEffect, useRef, useState } from "react";
import { StoreProvider, useStore } from "./state/store";
import { RestBar, RestProvider } from "./ui/RestProvider";
import { TodayView } from "./views/Today";
import { PlanView } from "./views/Plan";
import { HistoryView } from "./views/History";
import { SetupView } from "./views/Setup";
import * as sound from "./lib/audio";
import { IconChevron, IconLog, IconPlan, IconSetup, IconToday } from "./ui/icons";

type Tab = "today" | "plan" | "log" | "setup";

const TABS: Array<{ id: Tab; label: string; Icon: typeof IconToday }> = [
  { id: "today", label: "Today", Icon: IconToday },
  { id: "plan", label: "Plan", Icon: IconPlan },
  { id: "log", label: "Log", Icon: IconLog },
  { id: "setup", label: "Setup", Icon: IconSetup },
];

const TITLES: Record<Tab, string> = {
  today: "Fitz",
  plan: "Fitz · plan",
  log: "Fitz · log",
  setup: "Fitz · setup",
};

const TABS_IDS: Tab[] = ["today", "plan", "log", "setup"];

function tabFromHash(): Tab {
  const raw = window.location.hash.replace(/^#\/?/, "");
  return TABS_IDS.includes(raw as Tab) ? (raw as Tab) : "today";
}

function Shell() {
  const { state, setDay, setRung } = useStore();
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const firstRender = useRef(true);

  useEffect(() => {
    // A restored session keeps its scroll position; only a tab switch starts at the top.
    if (firstRender.current) firstRender.current = false;
    else window.scrollTo({ top: 0 });
    document.title = TITLES[tab];
    if (window.location.hash !== `#/${tab}`) {
      window.history.replaceState(null, "", `#/${tab}`);
    }
  }, [tab]);

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const switchControls = (
    <>
              <label className="switch">
                <span className="sr-only">Day</span>
                <select
                  value={state.dayId}
                  onChange={(e) => {
                    setDay(e.target.value);
                    sound.unlock();
                    if (state.sound !== "off") sound.snap();
                  }}
                >
                  {state.days.map((d) => (
                    <option key={d.id} value={d.id}>
                      Day {d.n}
                    </option>
                  ))}
                </select>
                <IconChevron width={12} height={12} />
              </label>
              <label className="switch">
                <span className="sr-only">Week</span>
                <select
                  value={state.rung}
                  onChange={(e) => {
                    setRung(Number(e.target.value));
                    sound.unlock();
                    if (state.sound !== "off") sound.snap();
                  }}
                >
                  {Array.from({ length: state.totalRungs }, (_, i) => i + 1).map((r) => (
                    <option key={r} value={r}>
                      Week {r}
                    </option>
                  ))}
                </select>
                <IconChevron width={12} height={12} />
              </label>
    </>
  );

  return (
    <div className="app">
      <aside className="rail">
        <span className="mark rail-mark">Fitz</span>
        {(tab === "today" || tab === "plan") && (
          <div className="switchers rail-switchers">{switchControls}</div>
        )}
        <nav className="rail-nav" aria-label="Sections">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={tab === id ? "railtab is-on" : "railtab"}
              onClick={() => setTab(id)}
              aria-current={tab === id ? "page" : undefined}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <header className="topbar">
        <span className="mark">Fitz</span>
        {(tab === "today" || tab === "plan") && (
          <div className="switchers">{switchControls}</div>
        )}
      </header>

      {tab === "today" && <TodayView />}
      {tab === "plan" && (
        <PlanView
          goToday={(dayId) => {
            setDay(dayId);
            setTab("today");
          }}
        />
      )}
      {tab === "log" && <HistoryView />}
      {tab === "setup" && <SetupView />}

      <RestBar />

      <nav className="tabbar" aria-label="Sections">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={tab === id ? "tab is-on" : "tab"}
            onClick={() => setTab(id)}
            aria-current={tab === id ? "page" : undefined}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export function App() {
  return (
    <StoreProvider>
      <RestProvider>
        <Shell />
      </RestProvider>
    </StoreProvider>
  );
}
