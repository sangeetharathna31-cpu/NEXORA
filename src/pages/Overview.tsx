import { Button, EmptyState, Icon, MiniBars, StatusBadge, type IconName } from "../components/ui";
import { fit } from "../lib/screener";
import { initials, timeAgo, useStore } from "../lib/store";
import type { Nav } from "../lib/nav";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};
const ACT_ICON: Record<string, IconName> = {
  upload: "upload", add: "plus", run: "spark", failed: "shield", decision: "check", remove: "close", reset: "clock",
};

export function Overview({ go, openCandidate, openRun }: Nav) {
  const { candidates, runs, activity } = useStore();
  const completed = runs.filter((r) => r.status === "completed");
  const failed = runs.length - completed.length;
  const latest = completed[0];
  const screenedIds = new Set(completed.flatMap((r) => r.results.map((x) => x.id)));
  const shortlisted = candidates.filter((c) => c.decision === "shortlisted").length;
  const top = latest ? [...latest.results].sort((a, b) => b.score - a.score).slice(0, 4) : [];
  const bands = latest
    ? (["Strong fit", "Good fit", "Partial fit", "Low fit"] as const).map((l) => ({
        label: l,
        n: latest.results.filter((r) => fit(r.score).label === l).length,
      }))
    : [];
  const avg = latest && latest.results.length ? latest.results.reduce((a, r) => a + r.score, 0) / latest.results.length : 0;
  const strongNow = latest ? latest.results.filter((r) => r.score >= 75).length : 0;
  const runBars = [...completed].slice(0, 8).reverse().map((r) => Math.max(8, r.results.length ? Math.round(r.results.reduce((a, x) => a + x.score, 0) / r.results.length) : 8));

  return (
    <div className="page page-enter">
      <section className="welcome">
        <div>
          <span className="eyebrow"><i /> Recruitment intelligence</span>
          <h1>{greeting()}, Recruiter</h1>
          <p>
            {latest ? (
              <>Your latest run, <b>{latest.title}</b>, found <b>{strongNow} strong {strongNow === 1 ? "fit" : "fits"}</b> among {latest.results.length} screened resume{latest.results.length === 1 ? "" : "s"}.</>
            ) : candidates.length ? (
              <>You have <b>{candidates.length}</b> resume{candidates.length === 1 ? "" : "s"} ready. Start a screening run to rank them against a job description.</>
            ) : (
              <>Add resumes and paste a job description to get a ranked shortlist.</>
            )}
          </p>
        </div>
        <Button icon="plus" onClick={() => go("Screening Runs")}>New Screening Run</Button>
      </section>

      <section className="kpi-strip">
        <div className="kpi primary">
          <span className="kpi-label">Total candidates</span>
          <div className="kpi-main"><strong>{candidates.length}</strong></div>
          <div className="kpi-foot"><span>Resumes in this workspace</span></div>
        </div>
        <div className="kpi">
          <span className="kpi-label">Resumes screened</span>
          <div className="kpi-main"><strong>{screenedIds.size}</strong></div>
          <div className="kpi-foot">
            <span>{candidates.length - [...screenedIds].filter((id) => candidates.some((c) => c.id === id)).length} not yet screened</span>
          </div>
        </div>
        <div className="kpi">
          <span className="kpi-label">Screening runs</span>
          <div className="kpi-main">
            <strong>{runs.length}</strong>
            <StatusBadge tone={failed ? "danger" : "info"}>{completed.length} completed{failed ? ` · ${failed} failed` : ""}</StatusBadge>
          </div>
          {runBars.length > 0 && <MiniBars data={runBars} />}
        </div>
        <div className="kpi highlight">
          <span className="kpi-label">Shortlisted candidates</span>
          <div className="kpi-main"><strong>{shortlisted}</strong></div>
          <p>{candidates.length ? `${Math.round((shortlisted / candidates.length) * 100)}% of candidates` : "No candidates yet"}</p>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel screening-chart">
          <div className="section-head">
            <div>
              <h2>Latest screening outcome</h2>
              <p>{latest ? `${latest.title} · ${timeAgo(latest.createdAt)}` : "Fit distribution of your most recent run"}</p>
            </div>
          </div>
          {latest ? (
            <>
              <div className="funnel">
                {bands.map((b) => (
                  <div className="funnel-row" key={b.label}>
                    <span><b>{b.label}</b><small>{b.n}</small></span>
                    <div><i style={{ width: `${latest.results.length ? (b.n / latest.results.length) * 100 : 0}%` }} /></div>
                    <em>{latest.results.length ? Math.round((b.n / latest.results.length) * 100) : 0}%</em>
                  </div>
                ))}
              </div>
              <div className="chart-summary">
                <span><b>{avg.toFixed(1)}</b> average score</span>
                <span><b>{Math.max(...latest.results.map((r) => r.score)).toFixed(1)}</b> best score</span>
                <span><b>{latest.durationMs} ms</b> processing time</span>
              </div>
            </>
          ) : (
            <EmptyState icon="chart" title="No screening runs yet" text="Create your first screening run to see how candidates rank." action="Create screening run" onAction={() => go("Screening Runs")} />
          )}
        </section>

        <section className="panel top-matches">
          <div className="section-head">
            <div><h2>Top matches</h2><p>Highest scores in the latest run</p></div>
            <button className="text-button" onClick={() => go("Matches")}>View all <Icon name="arrow" size={14} /></button>
          </div>
          <div className="match-list">
            {top.map((r, i) => (
              <button className="match-row" key={r.id} onClick={() => openCandidate(r.id)}>
                <span className="rank">0{i + 1}</span>
                <span className={`avatar a${i}`}>{initials(r.name)}</span>
                <span className="match-person"><b>{r.name}</b><small>{fit(r.score).label}</small></span>
                <span className="skills-mini">{r.matched.slice(0, 2).join(" · ") || "No matched skills"}</span>
                <span className="score-number">{Math.round(r.score)}<small>%</small></span>
              </button>
            ))}
            {!top.length && <p className="muted-note">Matches appear here after your first screening run.</p>}
          </div>
        </section>
      </div>

      <div className="lower-grid">
        <section className="active-runs">
          <div className="section-head">
            <div><h2>Recent screening runs</h2><p>Most recent first</p></div>
            <button className="text-button" onClick={() => go("Screening Runs")}>View all <Icon name="arrow" size={14} /></button>
          </div>
          {runs.slice(0, 3).map((r) => (
            <div className="run-row" key={r.id}>
              <div className="run-icon"><Icon name="briefcase" size={18} /></div>
              <div className="run-name"><b>{r.title}</b><small>{r.jd.slice(0, 48)}{r.jd.length > 48 ? "…" : ""}</small></div>
              <div className="run-candidates">{r.candidateIds.length} resume{r.candidateIds.length === 1 ? "" : "s"}</div>
              <div className="progress-cell">
                <span><b>{r.status === "completed" ? "Completed" : "Failed"}</b><small>{r.status === "completed" ? "100%" : "—"}</small></span>
                <div className="progress"><i style={{ width: r.status === "completed" ? "100%" : "0%" }} /></div>
              </div>
              <small className="run-time">{timeAgo(r.createdAt)}</small>
              <button className="icon-button" aria-label="Open results" onClick={() => openRun(r.id)}><Icon name="chevron" size={16} /></button>
            </div>
          ))}
          {!runs.length && <p className="muted-note">No screening runs yet.</p>}
        </section>

        <section className="activity-feed">
          <div className="section-head">
            <div><h2>Recent activity</h2><p>Latest workspace actions</p></div>
            <button className="icon-button" aria-label="Open activity" onClick={() => go("Activity")}><Icon name="arrow" size={15} /></button>
          </div>
          <div className="timeline">
            {activity.slice(0, 4).map((a) => (
              <div className="timeline-item" key={a.id}>
                <span className="timeline-icon"><Icon name={ACT_ICON[a.type] ?? "check"} size={14} /></span>
                <div><b>{a.title}</b><small>{a.text}</small></div>
                <time>{timeAgo(a.at)}</time>
              </div>
            ))}
            {!activity.length && <p className="muted-note">Activity will appear as you work.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
