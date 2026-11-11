import { EmptyState, PageTitle } from "../components/ui";
import { skillsOf } from "../lib/screener";
import { useStore } from "../lib/store";
import type { Nav } from "../lib/nav";

export function Analytics({ go }: Nav) {
  const { candidates, runs } = useStore();
  const completed = runs.filter((r) => r.status === "completed");
  const latest = completed[0];

  if (!completed.length)
    return (
      <div className="page page-enter">
        <PageTitle eyebrow="Talent intelligence" title="Analytics" description="Measure screening quality and pipeline health across your workspace." />
        <div className="data-surface">
          <EmptyState icon="chart" title="No analytics yet" text="Analytics are calculated from your screening runs. Create a run to get started." action="Create screening run" onAction={() => go("Screening Runs")} />
        </div>
      </div>
    );

  const all = latest.results;
  const avg = (f: (r: (typeof all)[number]) => number) => (all.length ? all.reduce((a, r) => a + f(r), 0) / all.length : 0);
  const avgScore = avg((r) => r.score);
  const bins = Array.from({ length: 10 }, (_, i) => all.filter((r) => (i === 9 ? r.score >= 90 : r.score >= i * 10 && r.score < i * 10 + 10)).length);
  const maxBin = Math.max(1, ...bins);
  const screenedIds = new Set(completed.flatMap((r) => r.results.map((x) => x.id)));
  const screened = [...screenedIds].filter((id) => candidates.some((c) => c.id === id)).length;
  const strong = all.filter((r) => r.score >= 75).length;
  const shortlisted = candidates.filter((c) => c.decision === "shortlisted").length;
  const funnel: [string, number][] = [
    ["Added", candidates.length],
    ["Screened", screened],
    ["Strong fit (latest run)", strong],
    ["Shortlisted", shortlisted],
  ];
  const freq: Record<string, number> = {};
  candidates.forEach((c) => skillsOf(c.text).forEach((s) => (freq[s] = (freq[s] || 0) + 1)));
  const topSkills = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const avgMs = completed.reduce((a, r) => a + r.durationMs, 0) / completed.length;

  return (
    <div className="page page-enter">
      <PageTitle eyebrow="Talent intelligence" title="Analytics" description={`Calculated from your saved screening runs. Latest run: ${latest.title}.`} />
      <div className="analytics-kpis">
        <div><span>Screening runs</span><strong>{completed.length}</strong><small>{runs.length - completed.length ? `${runs.length - completed.length} failed` : "All completed"}</small></div>
        <div><span>Average score (latest run)</span><strong>{avgScore.toFixed(1)}</strong><small>Out of 100</small></div>
        <div><span>Shortlist rate</span><strong>{candidates.length ? ((shortlisted / candidates.length) * 100).toFixed(1) : "0.0"}<small>%</small></strong><small>{shortlisted} of {candidates.length} candidates</small></div>
        <div><span>Avg. processing time</span><strong>{Math.round(avgMs)} ms</strong><small>Per screening run</small></div>
      </div>
      <div className="analytics-grid">
        <section className="panel analytics-main">
          <div className="section-head"><div><h2>Score distribution</h2><p>Latest run · resumes per 10-point score band</p></div></div>
          <div className="bar-chart">
            {bins.map((n, i) => (
              <div key={i}>
                <i style={{ height: `${n ? Math.max(6, (n / maxBin) * 100) : 0}%` }} title={`${n} resume${n === 1 ? "" : "s"}`} />
                <span>{i * 10}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="panel funnel">
          <div className="section-head"><div><h2>Candidate funnel</h2><p>From added to shortlisted</p></div></div>
          {funnel.map(([l, n], i) => (
            <div className="funnel-row" key={l}>
              <span><b>{l}</b><small>{n}</small></span>
              <div><i style={{ width: `${funnel[0][1] ? (n / funnel[0][1]) * 100 : 0}%` }} /></div>
              {i > 0 && <em>{funnel[0][1] ? Math.round((n / funnel[0][1]) * 100) : 0}%</em>}
            </div>
          ))}
        </section>
        <section className="panel skills-chart">
          <div className="section-head"><div><h2>Most common skills</h2><p>Share of candidates mentioning each skill</p></div></div>
          {topSkills.map(([s, n]) => (
            <div key={s}>
              <span>{s}</span>
              <div><i style={{ width: `${(n / candidates.length) * 100}%` }} /></div>
              <b>{Math.round((n / candidates.length) * 100)}%</b>
            </div>
          ))}
          {!topSkills.length && <p className="muted-note">No known skills detected in your resumes.</p>}
        </section>
        <section className="panel quality">
          <div className="section-head"><div><h2>Latest run signals</h2><p>Average component scores</p></div></div>
          <div className="quality-score">
            <div className="big-ring"><strong>{Math.round(avg((r) => r.sk))}</strong><small>% skills</small></div>
            <div><b>Average skill match</b><p>Share of the job's required skills found in each resume, averaged over the run.</p></div>
          </div>
          <div className="quality-lines">
            <span><b>Text similarity</b><small>{avg((r) => r.sim).toFixed(0)}%</small></span>
            <span><b>Experience score</b><small>{avg((r) => r.expScore).toFixed(0)}%</small></span>
            <span><b>Education score</b><small>{avg((r) => r.eduScore).toFixed(0)}%</small></span>
          </div>
        </section>
      </div>
    </div>
  );
}
