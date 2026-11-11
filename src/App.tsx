import { useEffect, useMemo, useState } from "react";
import { Banner, Icon, Logo, type IconName } from "./components/ui";
import { skillsOf } from "./lib/screener";
import type { Nav, Page } from "./lib/nav";
import { StoreProvider, initials, timeAgo, useStore } from "./lib/store";
import { ActivityPage } from "./pages/Activity";
import { Analytics } from "./pages/Analytics";
import { CandidateDetail } from "./pages/CandidateDetail";
import { Candidates } from "./pages/Candidates";
import { Matches } from "./pages/Matches";
import { Overview } from "./pages/Overview";
import { Resumes, type IntakeEntry } from "./pages/Resumes";
import { ScreeningRuns } from "./pages/ScreeningRuns";
import { SettingsPage } from "./pages/Settings";

const nav: { label: Page; icon: IconName }[] = [
  { label: "Overview", icon: "grid" },
  { label: "Candidates", icon: "users" },
  { label: "Resumes", icon: "file" },
  { label: "Screening Runs", icon: "scan" },
  { label: "Matches", icon: "spark" },
  { label: "Analytics", icon: "chart" },
  { label: "Activity", icon: "activity" },
  { label: "Settings", icon: "settings" },
];

function Shell() {
  const { candidates, runs, activity, loadError, saveError } = useStore();
  const [page, setPage] = useState<Page>("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("nexora-theme") || "dark"; } catch { return "dark"; }
  });
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | undefined>();
  const [toast, setToast] = useState("");
  const [notifications, setNotifications] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [intake, setIntake] = useState<IntakeEntry[]>([]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("nexora-theme", theme); } catch { /* storage blocked */ }
  }, [theme]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen(true); }
      if (e.key === "Escape") { setSearchOpen(false); setNotifications(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (p: Page) => {
    setPage(p);
    setCandidateId(null);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const api: Nav = {
    go,
    openCandidate: (id) => { setCandidateId(id); window.scrollTo({ top: 0 }); },
    openRun: (id) => { setRunId(id); go("Matches"); },
    toast: setToast,
  };

  const latestRun = runs.find((r) => r.status === "completed");
  const strongCount = latestRun ? latestRun.results.filter((r) => r.score >= 75).length : 0;

  const content = (() => {
    if (candidateId) return <CandidateDetail id={candidateId} back={() => setCandidateId(null)} go={go} toast={setToast} />;
    switch (page) {
      case "Overview": return <Overview {...api} />;
      case "Candidates": return <Candidates {...api} />;
      case "Resumes": return <Resumes {...api} log={intake} setLog={setIntake} />;
      case "Screening Runs": return <ScreeningRuns {...api} />;
      case "Matches": return <Matches {...api} runId={runId} setRun={setRunId} />;
      case "Analytics": return <Analytics {...api} />;
      case "Activity": return <ActivityPage {...api} />;
      default: return <SettingsPage theme={theme} setTheme={setTheme} toast={setToast} />;
    }
  })();

  const hits = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return candidates
      .filter((c) => `${c.name} ${[...skillsOf(c.text)].join(" ")}`.toLowerCase().includes(s))
      .slice(0, 6);
  }, [q, candidates]);

  return (
    <div className="app-shell">
      <button className={`mobile-overlay ${mobileOpen ? "show" : ""}`} aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <Logo />
          <button className="sidebar-close" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><Icon name="close" /></button>
        </div>
        <nav className="main-nav">
          {nav.map((n) => (
            <button key={n.label} className={page === n.label && !candidateId ? "active" : ""} onClick={() => go(n.label)}>
              <Icon name={n.icon} />
              <span>{n.label}</span>
              {n.label === "Matches" && strongCount > 0 && <i className="nav-count">{strongCount}</i>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-card static">
            <span className="workspace-icon">NS</span>
            <span><small>Workspace</small><b>Local · this browser</b></span>
          </div>
          <div className="user-card">
            <span className="avatar">{initials("Recruiter")}</span>
            <span><b>Recruiter</b><small>{candidates.length} candidate{candidates.length === 1 ? "" : "s"}</small></span>
            <button className="theme-switch" aria-label="Switch theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              <Icon name={theme === "dark" ? "moon" : "sun"} size={15} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Icon name="menu" /></button>
          <button className="top-search" onClick={() => setSearchOpen(true)}>
            <Icon name="search" size={17} />
            <span>Search candidates or skills</span>
            <kbd>⌘ K</kbd>
          </button>
          <div className="top-actions">
            <div className="notification-wrap">
              <button className="icon-button" aria-label="Notifications" onClick={() => setNotifications(!notifications)}>
                <Icon name="bell" />
                {activity.length > 0 && <i className="notification-dot" />}
              </button>
              {notifications && (
                <div className="notification-popover">
                  <div><h3>Recent activity</h3><button onClick={() => { setNotifications(false); go("Activity"); }}>View all</button></div>
                  {activity.slice(0, 3).map((a) => (
                    <p key={a.id}>
                      <span><Icon name="spark" size={14} /></span>
                      <b>{a.title}</b><small>{a.text}</small><time>{timeAgo(a.at)}</time>
                    </p>
                  ))}
                  {!activity.length && <p><small>No activity yet.</small></p>}
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="content">
          {loadError && <Banner tone="warning" title="Workspace data was reset">{loadError}</Banner>}
          {saveError && <Banner tone="warning" title="Changes not saved">{saveError}</Banner>}
          {content}
        </main>
      </div>
      {searchOpen && (
        <div className="modal-backdrop" onMouseDown={() => setSearchOpen(false)}>
          <div className="search-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-search">
              <Icon name="search" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search candidates or skills…" />
              <button onClick={() => setSearchOpen(false)}>ESC</button>
            </div>
            <div className="quick-results">
              <span>{q.trim() ? "CANDIDATES" : "QUICK LINKS"}</span>
              {q.trim()
                ? hits.map((c) => (
                    <button key={c.id} onClick={() => { setSearchOpen(false); setQ(""); api.openCandidate(c.id); }}>
                      <Icon name="users" /><b>{c.name}</b><Icon name="chevron" size={13} />
                    </button>
                  ))
                : nav.slice(0, 5).map((n) => (
                    <button key={n.label} onClick={() => { go(n.label); setSearchOpen(false); }}>
                      <Icon name={n.icon} /><b>{n.label}</b><Icon name="chevron" size={13} />
                    </button>
                  ))}
              {q.trim() && !hits.length && <p className="muted-note">No matching candidates.</p>}
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <span><Icon name="check" size={15} /></span>
          <div><b>Done</b><p>{toast}</p></div>
          <button aria-label="Dismiss" onClick={() => setToast("")}><Icon name="close" size={14} /></button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
