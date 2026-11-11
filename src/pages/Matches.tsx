import { useMemo, useState } from "react";
import { Button, EmptyState, PageTitle, StatusBadge } from "../components/ui";
import { fit, toCsv } from "../lib/screener";
import { initials, useStore } from "../lib/store";
import type { Nav } from "../lib/nav";

type Seg = "All" | "Strong" | "Good" | "Partial" | "Low";
const SEGS: Seg[] = ["All", "Strong", "Good", "Partial", "Low"];
const segOf = (s: number): Seg => (s >= 75 ? "Strong" : s >= 55 ? "Good" : s >= 35 ? "Partial" : "Low");

export function Matches({ runId, setRun, go, openCandidate, toast }: Nav & { runId?: string; setRun: (id: string) => void }) {
  const { runs, candidates } = useStore();
  const completed = runs.filter((r) => r.status === "completed");
  const run = completed.find((r) => r.id === runId) ?? completed[0];
  const [seg, setSeg] = useState<Seg>("All");
  const [sort, setSort] = useState<"score" | "skills" | "exp">("score");
  const [min, setMin] = useState(0);

  const rows = useMemo(() => {
    if (!run) return [];
    return run.results
      .filter((r) => r.score >= min && (seg === "All" || segOf(r.score) === seg))
      .sort((a, b) => (sort === "score" ? b.score - a.score : sort === "skills" ? b.sk - a.sk : b.y - a.y));
  }, [run, seg, sort, min]);

  if (!run)
    return (
      <div className="page page-enter">
        <PageTitle eyebrow="Screening results" title="Matches" description="Ranked candidates from your screening runs appear here." />
        <div className="data-surface">
          <EmptyState icon="spark" title="No screening results yet" text="Run a screening to see ranked candidates and their scores." action="Create screening run" onAction={() => go("Screening Runs")} />
        </div>
      </div>
    );

  const count = (s: Seg) => run.results.filter((r) => segOf(r.score) === s).length;
  const exists = (id: string) => candidates.some((c) => c.id === id);
  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([toCsv(run.results)], { type: "text/csv" }));
    a.download = "shortlist.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Shortlist exported as CSV");
  };

  return (
    <div className="page page-enter">
      <PageTitle
        eyebrow="Screening results"
        title={run.title}
        description={`Completed ${new Date(run.createdAt).toLocaleString()} · ${run.results.length} resume${run.results.length === 1 ? "" : "s"} evaluated`}
        actions={
          <>
            {completed.length > 1 && (
              <select className="date-select" aria-label="Screening run" value={run.id} onChange={(e) => setRun(e.target.value)}>
                {completed.map((r) => <option key={r.id} value={r.id}>{r.title} · {new Date(r.createdAt).toLocaleDateString()}</option>)}
              </select>
            )}
            <Button variant="secondary" icon="download" onClick={download}>Export CSV</Button>
          </>
        }
      />
      <div className="results-hero">
        <div><span>Resumes screened</span><strong>{run.results.length}</strong><small>100% complete</small></div>
        <div><span>Strong fits</span><strong>{count("Strong")}</strong><small className="positive-text">Score 75+</small></div>
        <div><span>Good / partial</span><strong>{count("Good") + count("Partial")}</strong><small>Human decision needed</small></div>
        <div><span>Low fits</span><strong>{count("Low")}</strong><small>Below 35</small></div>
      </div>
      <div className="results-toolbar">
        <div className="segments">
          {SEGS.map((x) => <button className={seg === x ? "active" : ""} onClick={() => setSeg(x)} key={x}>{x}</button>)}
        </div>
        <label className="min-score">Min score <b>{min}+</b><input type="range" min={0} max={100} value={min} onChange={(e) => setMin(+e.target.value)} /></label>
        <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="score">Sort: overall score</option>
          <option value="skills">Sort: skill match</option>
          <option value="exp">Sort: experience</option>
        </select>
      </div>
      <div className="rankings">
        <div className="ranking-head">
          <span>Rank & candidate</span><span>Score</span><span>Skill match</span><span>Experience</span><span>Matched skills</span><span>Missing skills</span><span>Fit</span>
        </div>
        {rows.map((r, i) => {
          const f = fit(r.score);
          return (
            <button className="ranking-row" key={r.id} disabled={!exists(r.id)} onClick={() => openCandidate(r.id)}>
              <span className="rank-person">
                <i>#{i + 1}</i>
                <span className={`avatar a${i % 6}`}>{initials(r.name)}</span>
                <span><b>{r.name}</b><small>{exists(r.id) ? `Text similarity ${r.sim.toFixed(0)}%` : "Removed from workspace"}</small></span>
              </span>
              <span className="large-score">{r.score.toFixed(1)}</span>
              <span><b>{r.sk.toFixed(0)}%</b><small>{r.matched.length}/{r.jdSkillCount} skills</small></span>
              <span><b>{r.y ? `${r.y} yrs` : "—"}</b><small>{r.e ? ["", "Diploma", "Bachelor's", "Master's", "PhD"][r.e] : "Education n/a"}</small></span>
              <span className="strengths">{r.matched.slice(0, 2).map((x) => <i key={x}>{x}</i>)}{!r.matched.length && <small className="muted">None</small>}</span>
              <span className="gap-text">{r.missing.slice(0, 2).join(", ") || "None"}</span>
              <span><StatusBadge tone={f.tone === "success" ? "success" : f.tone === "danger" ? "danger" : "info"}>{f.label}</StatusBadge></span>
            </button>
          );
        })}
        {!rows.length && <EmptyState icon="users" title="No candidates in this view" text="Lower the minimum score or choose another segment." action="Reset filters" onAction={() => { setSeg("All"); setMin(0); }} />}
      </div>
      <p className="muted-note">A decision-support aid, not a final verdict. Always review shortlisted candidates yourself.</p>
    </div>
  );
}
