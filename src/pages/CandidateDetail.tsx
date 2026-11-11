import { useMemo, useState, type ReactNode } from "react";
import { Button, EmptyState, Icon, Modal, StatusBadge } from "../components/ui";
import { EDN, fit, highlight, skillsOf, WEIGHT_LABELS, yearsOf, eduOf, type ScreenResult } from "../lib/screener";
import { emailOf, initials, timeAgo, useStore } from "../lib/store";
import type { Nav } from "../lib/nav";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="profile-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

const Bar = ({ label, value }: { label: string; value: number }) => (
  <div className="score-bar">
    <span><b>{label}</b><small>{Math.round(value)}%</small></span>
    <div><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
  </div>
);

export function CandidateDetail({ id, back, go, toast }: { id: string; back: () => void } & Pick<Nav, "go" | "toast">) {
  const { candidates, latestResult, setDecision } = useStore();
  const [explain, setExplain] = useState(false);
  const c = candidates.find((x) => x.id === id);
  const found = c ? latestResult(c.id) : undefined;
  const res: ScreenResult | undefined = found?.result;
  const run = found?.run;
  const skills = useMemo(() => (c ? [...skillsOf(c.text)] : []), [c]);
  const segments = useMemo(() => (c ? highlight(c.text, new Set(res?.matched ?? [])) : []), [c, res]);

  if (!c)
    return (
      <div className="page page-enter">
        <button className="back-link" onClick={back}>← Back to candidates</button>
        <EmptyState icon="users" title="Candidate not found" text="This candidate may have been removed." action="Back to candidates" onAction={back} />
      </div>
    );

  const years = yearsOf(c.text);
  const edu = eduOf(c.text);
  const email = emailOf(c.text);
  const f = res ? fit(res.score) : undefined;
  const decide = (d: "shortlisted" | "rejected") => {
    const next = c.decision === d ? undefined : d;
    setDecision(c.id, next);
    toast(next ? `${c.name} ${next}` : "Decision cleared");
  };
  const weights = run?.weights;
  const totalW = weights ? Object.values(weights).reduce((a, b) => a + b, 0) || 1 : 1;
  const contrib = res && weights
    ? ([
        ["skills", res.sk / 100],
        ["text", Math.min(res.sim / 100 * 2, 1)],
        ["exp", res.expScore / 100],
        ["edu", res.eduScore / 100],
      ] as const).map(([k, v]) => ({ k, label: WEIGHT_LABELS[k], weight: weights[k], points: (weights[k] * v) / totalW * 100 }))
    : [];

  return (
    <div className="page page-enter">
      <button className="back-link" onClick={back}>← Back to candidates</button>
      <div className="profile-header">
        <div className="profile-identity">
          <span className="avatar profile-avatar">{initials(c.name)}</span>
          <div>
            <div className="profile-title">
              <h1>{c.name}</h1>
              {c.decision ? (
                <StatusBadge tone={c.decision === "shortlisted" ? "success" : "danger"}>{c.decision === "shortlisted" ? "Shortlisted" : "Rejected"}</StatusBadge>
              ) : f ? (
                <StatusBadge tone={f.tone === "success" ? "success" : f.tone === "danger" ? "danger" : "info"}>{f.label}</StatusBadge>
              ) : (
                <StatusBadge tone="neutral">Not screened</StatusBadge>
              )}
            </div>
            <p>{c.fileName ? `Uploaded from ${c.fileName}` : "Added by pasting resume text"} · {timeAgo(c.addedAt)}</p>
            {email && (
              <div className="contact-row"><span><Icon name="mail" size={14} /> {email}</span></div>
            )}
          </div>
        </div>
        <div className="profile-actions">
          <Button variant="danger" onClick={() => decide("rejected")}>{c.decision === "rejected" ? "Undo reject" : "Reject"}</Button>
          <Button icon="check" onClick={() => decide("shortlisted")}>{c.decision === "shortlisted" ? "Shortlisted" : "Shortlist candidate"}</Button>
        </div>
      </div>

      <div className="profile-layout">
        <main className="profile-main">
          <Section title="Detected skills">
            <div className="skill-cloud">
              {skills.map((s) => {
                const hit = res?.matched.includes(s);
                return <span className={hit ? "matched" : ""} key={s}>{hit && <Icon name="check" size={12} />} {s}</span>;
              })}
              {!skills.length && <p className="summary-text">No skills from the screener's skill list were found in this resume.</p>}
            </div>
            {res && <p className="muted-note">Highlighted skills match the job description of “{run?.title}”.</p>}
          </Section>
          <Section title="Experience & education">
            <div className="fact-grid">
              <div><span>Experience stated</span><b>{years ? `${years} years` : "Not stated"}</b></div>
              <div><span>Highest education detected</span><b>{EDN[edu]}</b></div>
            </div>
          </Section>
          <Section title="Resume text">
            <pre className="resume-text">
              {segments.map((s, i) =>
                s.kind === "plain" ? <span key={i}>{s.text}</span> : <mark key={i} className={s.kind === "matched" ? "hl-match" : "hl-other"}>{s.text}</mark>,
              )}
            </pre>
          </Section>
        </main>

        <aside className="intelligence-panel">
          <div className="ai-label"><Icon name="spark" size={15} /> Screening result</div>
          {res && run && f ? (
            <>
              <div className="overall-score">
                <div><strong>{Math.round(res.score)}</strong><span>/100</span></div>
                <p><b>{f.label}</b><small>{run.title} · {timeAgo(run.createdAt)}</small></p>
              </div>
              <div className="score-breakdown">
                <Bar label="Skills match" value={res.sk} />
                <Bar label="Text similarity" value={Math.min(res.sim * 2, 100)} />
                <Bar label="Experience" value={res.expScore} />
                <Bar label="Education" value={res.eduScore} />
              </div>
              <div className="explain">
                <h3>Matched requirements</h3>
                {res.matched.map((x) => <p key={x}><span className="positive"><Icon name="check" size={12} /></span>{x}</p>)}
                {!res.matched.length && <p><span>–</span>No required skills found</p>}
                <p><span className="positive"><Icon name="check" size={12} /></span>{res.y} year{res.y === 1 ? "" : "s"} of experience detected · {EDN[res.e]}</p>
              </div>
              <div className="explain gaps">
                <h3>Missing skills</h3>
                {res.missing.map((x) => <p key={x}><span>–</span>{x}</p>)}
                {!res.missing.length && <p><span>–</span>None — all job skills found</p>}
              </div>
              <div className="trust-note">
                <Icon name="shield" size={18} />
                <div>
                  <b>Transparent scoring</b>
                  <p>The score uses only skills, text similarity, stated experience and education found in the resume text, weighted as configured for the run.</p>
                </div>
              </div>
              <Button variant="secondary" icon="eye" onClick={() => setExplain(true)}>Review score breakdown</Button>
            </>
          ) : (
            <div className="not-screened">
              <h3>Not screened yet</h3>
              <p>Include this candidate in a screening run to see a score, matched skills and gaps.</p>
              <Button icon="scan" onClick={() => go("Screening Runs")}>New screening run</Button>
            </div>
          )}
        </aside>
      </div>

      {explain && res && run && (
        <Modal
          eyebrow="Score breakdown"
          title="How this score was calculated"
          onClose={() => setExplain(false)}
          footer={<Button onClick={() => setExplain(false)}>Done</Button>}
        >
          <div className="explanation-overall">
            <div className="big-ring"><strong>{Math.round(res.score)}</strong><small>overall</small></div>
            <div>
              <h3>{c.name} · {fit(res.score).label}</h3>
              <p>Each component is scaled 0–100%, multiplied by its weight in “{run.title}”, and normalised by the total weight.</p>
            </div>
          </div>
          <div className="explanation-breakdown">
            {contrib.map((x) => (
              <div className="score-bar" key={x.k}>
                <span><b>{x.label} · weight {x.weight}</b><small>{x.points.toFixed(1)} pts</small></span>
                <div><i style={{ width: `${totalW ? (x.weight / totalW) * 100 : 0}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="evidence-grid">
            <section>
              <h3><span className="positive"><Icon name="check" size={12} /></span>Matched skills ({res.matched.length}/{res.jdSkillCount})</h3>
              <ul>{res.matched.map((x) => <li key={x}>{x}</li>)}{!res.matched.length && <li>None</li>}</ul>
            </section>
            <section>
              <h3><span className="gap-mark">–</span>Missing skills</h3>
              <ul>{res.missing.map((x) => <li key={x}>{x}</li>)}{!res.missing.length && <li>None</li>}</ul>
            </section>
          </div>
        </Modal>
      )}
    </div>
  );
}
