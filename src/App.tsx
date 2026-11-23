import { useEffect, useState } from "react";
import { StoreProvider, useStore } from "./state/store";
import { RestBar, RestProvider } from "./ui/RestProvider";
import { TodayView } from "./views/Today";
import { PlanView } from "./views/Plan";
import { HistoryView } from "./views/History";
import { SetupView } from "./views/Setup";
import { IconChevron, IconLog, IconPlan, IconSetup, IconToday } from "./ui/icons";
import { JumpSheet } from "./ui/JumpSheet";

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
  const { state, setDay } = useStore();
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [rungs, setRungs] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
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

  const rungControl = (
    <button className="rung-pill" onClick={() => setRungs(true)} title="Change rung">
      <span className="micro">Rung</span>
      <b>{state.rung}</b>
      <span className="of">/{state.totalRungs}</span>
      <IconChevron width={13} height={13} style={{ marginLeft: 2, color: "var(--dim)" }} />
    </button>
  );

  return (
    <div className="app">
      <aside className="rail">
        <span className="mark rail-mark">Fitz</span>
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
        <div className="rail-foot">{rungControl}</div>
      </aside>

      <header className="topbar">
        <span className="mark">Fitz</span>
        {rungControl}
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

      {rungs && <JumpSheet onClose={() => setRungs(false)} />}

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
