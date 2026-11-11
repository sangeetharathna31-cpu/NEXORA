import { useMemo, useRef, useState } from "react";
import { AddCandidateModal } from "../components/AddCandidateModal";
import { Button, EmptyState, Icon, MatchScore, PageTitle, StatusBadge } from "../components/ui";
import { fit, SAMPLE, skillsOf } from "../lib/screener";
import { readResumeFile } from "../lib/intake";
import { emailOf, initials, timeAgo, useStore } from "../lib/store";
import type { Nav } from "../lib/nav";

type Sort = "score" | "recent" | "exp";

export function Candidates({ openCandidate, go, toast }: Nav) {
  const { candidates, addCandidates, removeCandidate, latestResult } = useStore();
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [status, setStatus] = useState("all");
  const [minScore, setMinScore] = useState(0);
  const [sort, setSort] = useState<Sort>("score");
  const [adding, setAdding] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates
      .map((c) => ({ c, skills: [...skillsOf(c.text)], res: latestResult(c.id)?.result }))
      .filter(({ c, skills, res }) => {
        if (q && !`${c.name} ${c.fileName ?? ""} ${skills.join(" ")}`.toLowerCase().includes(q)) return false;
        if (status === "shortlisted" && c.decision !== "shortlisted") return false;
        if (status === "rejected" && c.decision !== "rejected") return false;
        if (status === "unscreened" && res) return false;
        if (minScore > 0 && (!res || res.score < minScore)) return false;
        return true;
      })
      .sort((a, b) =>
        sort === "recent" ? b.c.addedAt - a.c.addedAt : sort === "exp" ? (b.res?.y ?? -1) - (a.res?.y ?? -1) : (b.res?.score ?? -1) - (a.res?.score ?? -1),
      );
  }, [candidates, query, status, minScore, sort, latestResult]);

  const activeFilters = (status !== "all" ? 1 : 0) + (minScore > 0 ? 1 : 0);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const out = await Promise.all(Array.from(list).map(readResumeFile));
    const good = out.filter((r) => r.ok);
    const bad = out.filter((r) => !r.ok);
    if (good.length) addCandidates(good.map((g) => ({ name: g.ok ? g.name : "", text: g.ok ? g.text : "", fileName: g.fileName })), "upload");
    if (good.length && !bad.length) toast(`${good.length} resume${good.length === 1 ? "" : "s"} added`);
    else if (bad.length) toast(`${good.length} added · ${bad.length} rejected: ${bad[0].ok ? "" : bad[0].error}`);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="page page-enter">
      <PageTitle
        eyebrow="Talent workspace"
        title="Candidates"
        description="Review the resumes in your workspace, their detected skills and latest screening score."
        actions={
          <>
            <Button variant="secondary" icon="upload" onClick={() => fileRef.current?.click()}>Upload resumes</Button>
            <Button icon="plus" onClick={() => setAdding(true)}>Add candidate</Button>
            <input ref={fileRef} type="file" hidden multiple accept=".txt,.md" onChange={(e) => onFiles(e.target.files)} />
          </>
        }
      />
      <div className="toolbar">
        <label className="search-field">
          <Icon name="search" size={17} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or detected skill…" />
        </label>
        <button className={`filter-button ${filterOpen ? "active" : ""}`} onClick={() => setFilterOpen(!filterOpen)}>
          <Icon name="filter" size={16} /> Filters {activeFilters > 0 && <span>{activeFilters}</span>}
        </button>
        <select aria-label="Candidate sorting" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="score">Highest match</option>
          <option value="recent">Recently added</option>
          <option value="exp">Experience</option>
        </select>
      </div>
      {filterOpen && (
        <div className="filter-drawer">
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
              <option value="unscreened">Not screened yet</option>
            </select>
          </label>
          <label>
            Minimum score
            <select value={minScore} onChange={(e) => setMinScore(+e.target.value)}>
              <option value={0}>Any score</option>
              <option value={35}>35 and above</option>
              <option value={55}>55 and above</option>
              <option value={75}>75 and above</option>
            </select>
          </label>
          <button className="text-button" onClick={() => { setStatus("all"); setMinScore(0); }}>Clear all</button>
        </div>
      )}
      <div className="data-surface">
        <div className="table-meta">
          <span><b>{rows.length}</b> of {candidates.length} candidates</span>
          <span>Stored in this browser</span>
        </div>
        {candidates.length > 0 && (
          <div className="candidate-table">
            <div className="candidate-row table-head">
              <span>Candidate</span>
              <span>Source</span>
              <span>Experience</span>
              <span>Detected skills</span>
              <span>Score</span>
              <span>Status</span>
              <span>Added</span>
              <span />
            </div>
            {rows.map(({ c, skills, res }, i) => {
              const f = res ? fit(res.score) : undefined;
              return (
                <div
                  className="candidate-row"
                  role="button"
                  tabIndex={0}
                  key={c.id}
                  onClick={() => openCandidate(c.id)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openCandidate(c.id)}
                >
                  <span className="candidate-cell">
                    <i className={`avatar a${i % 6}`}>{initials(c.name)}</i>
                    <span><b>{c.name}</b><small>{emailOf(c.text) ?? "No email detected"}</small></span>
                  </span>
                  <span><b>{c.fileName ? "File upload" : "Pasted text"}</b><small>{c.fileName ?? "Manual entry"}</small></span>
                  <span>{res ? (res.y ? `${res.y} yrs` : "—") : "—"}</span>
                  <span className="skill-list">
                    {skills.slice(0, 3).map((s) => <i key={s}>{s}</i>)}
                    {skills.length > 3 && <i>+{skills.length - 3}</i>}
                    {!skills.length && <small className="muted">None detected</small>}
                  </span>
                  <span>{res ? <MatchScore score={res.score} compact /> : <small className="muted">—</small>}</span>
                  <span>
                    {c.decision ? (
                      <StatusBadge tone={c.decision === "shortlisted" ? "success" : "danger"}>{c.decision === "shortlisted" ? "Shortlisted" : "Rejected"}</StatusBadge>
                    ) : f ? (
                      <StatusBadge tone={f.tone === "success" ? "success" : f.tone === "danger" ? "danger" : "info"}>{f.label}</StatusBadge>
                    ) : (
                      <StatusBadge tone="neutral">Not screened</StatusBadge>
                    )}
                  </span>
                  <span className="muted">{timeAgo(c.addedAt)}</span>
                  <span>
                    <button
                      className="icon-button"
                      aria-label={`Remove ${c.name}`}
                      onClick={(e) => { e.stopPropagation(); removeCandidate(c.id); toast(`${c.name} removed`); }}
                    >
                      <Icon name="close" size={15} />
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {candidates.length === 0 && (
          <div>
            <EmptyState icon="users" title="No candidates yet" text="Upload .txt resumes, paste resume text, or load the sample data from the original screener." action="Add candidate" onAction={() => setAdding(true)} />
            <div className="empty-extra">
              <Button variant="ghost" onClick={() => { addCandidates(SAMPLE.candidates, "add"); toast("Sample candidates loaded"); }}>Load sample resumes</Button>
            </div>
          </div>
        )}
        {candidates.length > 0 && rows.length === 0 && (
          <EmptyState icon="users" title="No candidates found" text="Try adjusting your search or clearing the active filters." action="Clear search" onAction={() => { setQuery(""); setStatus("all"); setMinScore(0); }} />
        )}
      </div>
      {candidates.length > 0 && <p className="muted-note"><button className="text-button" onClick={() => go("Screening Runs")}>Create a screening run <Icon name="arrow" size={13} /></button> to score these candidates against a job description.</p>}
      {adding && (
        <AddCandidateModal
          onClose={() => setAdding(false)}
          onAdd={(name, text) => { addCandidates([{ name, text }], "add"); setAdding(false); toast(`${name} added`); }}
        />
      )}
    </div>
  );
}
