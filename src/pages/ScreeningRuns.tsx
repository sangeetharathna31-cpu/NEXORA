import { useMemo, useState, type ReactNode } from "react";
import { Banner, Button, EmptyState, Icon, PageTitle, StatusBadge } from "../components/ui";
import { EDN, requirementsOf, SAMPLE, WEIGHT_LABELS, type Weights } from "../lib/screener";
import { timeAgo, useStore } from "../lib/store";
import type { Nav } from "../lib/nav";

const STEPS = ["Job Details", "Requirements", "Candidate Pool", "Scoring", "Review"];

function FormStep({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="form-step">
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <div className="form-content">{children}</div>
    </div>
  );
}

export function ScreeningRuns({ go, openRun, toast }: Nav) {
  const { candidates, runs, defaultWeights, runScreening, deleteRun, addCandidates } = useStore();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [jd, setJd] = useState("");
  const [weights, setWeights] = useState<Weights>(defaultWeights);
  const [picked, setPicked] = useState<Set<string> | null>(null); // null = all candidates
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const pool = picked ?? new Set(candidates.map((c) => c.id));
  const poolIds = candidates.filter((c) => pool.has(c.id)).map((c) => c.id);
  const req = useMemo(() => requirementsOf(jd), [jd]);

  const validate = (target: number): string => {
    if (target >= 2 && !jd.trim()) return "Enter a job description to continue.";
    if (target >= 4 && !poolIds.length) return "Select at least one resume to screen.";
    return "";
  };
  const goTo = (n: number) => {
    const msg = validate(n);
    setError(msg);
    if (!msg) setStep(n);
  };

  const start = () => {
    const msg = validate(5);
    if (msg) return setError(msg);
    setRunning(true);
    setError("");
    // yield a frame so the running state paints before the (synchronous) scoring work
    setTimeout(() => {
      const run = runScreening({ title: title.trim() || "Untitled role", jd: jd.trim(), weights, candidateIds: poolIds });
      setRunning(false);
      if (run.status === "completed") {
        toast(`Screening complete · ${run.results.length} resume${run.results.length === 1 ? "" : "s"} ranked`);
        openRun(run.id);
      } else setError(`Screening failed: ${run.error ?? "unknown error"}`);
    }, 30);
  };

  const useSample = () => {
    setTitle(SAMPLE.title);
    setJd(SAMPLE.jd);
    if (!candidates.length) {
      const created = addCandidates(SAMPLE.candidates, "add");
      setPicked(new Set(created.map((c) => c.id)));
    }
    setError("");
  };

  return (
    <div className="page page-enter">
      <PageTitle
        eyebrow="Guided setup"
        title="Create screening run"
        description="Score and rank the resumes in your workspace against a job description."
        actions={<Button variant="secondary" onClick={useSample}>Use sample data</Button>}
      />
      <div className="workflow">
        <div className="stepper">
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => (i + 1 <= step ? setStep(i + 1) : goTo(i + 1))} className={`${step === i + 1 ? "active" : ""} ${step > i + 1 ? "complete" : ""}`}>
              <span>{step > i + 1 ? <Icon name="check" size={13} /> : i + 1}</span>
              <div><b>{s}</b><small>Step {i + 1}</small></div>
            </button>
          ))}
        </div>
        <div className="workflow-body">
          {error && <Banner title={error} />}
          {step === 1 && (
            <FormStep title="Tell us about the role" subtitle="Paste the job description. Skills, years of experience and education are detected from it automatically.">
              <label className="field"><span>Role title</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Python Developer" /></label>
              <label className="field"><span>Job description</span><textarea value={jd} onChange={(e) => { setJd(e.target.value); setError(""); }} placeholder="Paste the job description here…" rows={8} /></label>
            </FormStep>
          )}
          {step === 2 && (
            <FormStep title="Detected requirements" subtitle="These are read from the job description and used for scoring. Edit the job description to change them.">
              <div className="req-block">
                <span className="req-label">Skills ({req.skills.length})</span>
                <div className="skill-cloud">
                  {req.skills.map((s) => <span className="matched" key={s}><Icon name="check" size={12} /> {s}</span>)}
                  {!req.skills.length && <p className="summary-text">No skills from the screener's skill list were found in the job description. Scoring will rely on text similarity, experience and education.</p>}
                </div>
                <span className="req-label">Experience & education</span>
                <div className="fact-grid">
                  <div><span>Minimum experience</span><b>{req.years ? `${req.years}+ years` : "Not specified"}</b></div>
                  <div><span>Education</span><b>{EDN[req.edu]}</b></div>
                </div>
              </div>
            </FormStep>
          )}
          {step === 3 && (
            <FormStep title="Choose your candidate pool" subtitle="Select which resumes in your workspace to include in this run.">
              {candidates.length ? (
                <>
                  <div className="pool-bar">
                    <span><b>{poolIds.length}</b> of {candidates.length} selected</span>
                    <button className="text-button" onClick={() => setPicked(new Set(candidates.map((c) => c.id)))}>Select all</button>
                    <button className="text-button" onClick={() => setPicked(new Set())}>Clear</button>
                  </div>
                  <div className="pool-list">
                    {candidates.map((c) => (
                      <label key={c.id} className="pool-item">
                        <input type="checkbox" checked={pool.has(c.id)} onChange={(e) => { const n = new Set(pool); e.target.checked ? n.add(c.id) : n.delete(c.id); setPicked(n); setError(""); }} />
                        <span><b>{c.name}</b><small>{c.fileName ?? "Pasted text"}</small></span>
                      </label>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState icon="users" title="No resumes to screen" text="Add resumes first, or use the sample data." action="Add resumes" onAction={() => go("Resumes")} />
              )}
            </FormStep>
          )}
          {step === 4 && (
            <FormStep title="Scoring weights" subtitle="Adjust what matters for this role. Weights are normalised, so they don't need to sum to 100.">
              <div className="weight-list">
                {(Object.keys(weights) as (keyof Weights)[]).map((k) => (
                  <div key={k}>
                    <span><b>{WEIGHT_LABELS[k]}</b><strong>{weights[k]}%</strong></span>
                    <input type="range" min={0} max={100} value={weights[k]} aria-label={WEIGHT_LABELS[k]} onChange={(e) => setWeights({ ...weights, [k]: +e.target.value })} />
                  </div>
                ))}
              </div>
              <div className="trust-note">
                <Icon name="shield" />
                <div><b>Consistent scoring</b><p>Every resume is scored with the same rules: skill match, text similarity, stated experience and education.</p></div>
              </div>
            </FormStep>
          )}
          {step === 5 && (
            <FormStep title="Review screening configuration" subtitle="Confirm the criteria before running.">
              <div className="review-block">
                <div><span>Role</span><b>{title.trim() || "Untitled role"}</b><button onClick={() => setStep(1)}>Edit</button></div>
                <div><span>Required skills</span><b>{req.skills.join(", ") || "None detected"}</b><button onClick={() => setStep(2)}>Edit</button></div>
                <div><span>Candidate pool</span><b>{poolIds.length} resume{poolIds.length === 1 ? "" : "s"}</b><button onClick={() => setStep(3)}>Edit</button></div>
                <div><span>Weights</span><b>{(Object.keys(weights) as (keyof Weights)[]).map((k) => `${WEIGHT_LABELS[k]} ${weights[k]}`).join(" · ")}</b><button onClick={() => setStep(4)}>Edit</button></div>
              </div>
            </FormStep>
          )}
          <div className="workflow-actions">
            <Button variant="ghost" onClick={() => setStep(Math.max(1, step - 1))}>{step === 1 ? "" : "Back"}</Button>
            {step < 5 ? (
              <Button onClick={() => goTo(step + 1)}>Continue <Icon name="arrow" size={15} /></Button>
            ) : (
              <Button icon="spark" onClick={start}>{running ? "Screening…" : "Start screening"}</Button>
            )}
          </div>
        </div>
      </div>

      <div className="processing-header"><div><h2>Run history</h2><p>{runs.length} run{runs.length === 1 ? "" : "s"} saved in this browser</p></div></div>
      <div className="file-queue">
        {runs.map((r) => (
          <div className="file-item" key={r.id}>
            <span className="file-type">{r.status === "completed" ? "✓" : "!"}</span>
            <div className="file-info">
              <div><b>{r.title}</b><small>{r.candidateIds.length} resumes · {timeAgo(r.createdAt)} · {r.durationMs} ms</small></div>
              {r.error && <p className="error-copy">{r.error}</p>}
            </div>
            <div className="file-state">
              <StatusBadge tone={r.status === "completed" ? "success" : "danger"}>{r.status === "completed" ? "Completed" : "Failed"}</StatusBadge>
              {r.status === "completed" && <Button variant="secondary" onClick={() => openRun(r.id)}>Results</Button>}
              <button className="icon-button" aria-label="Delete run" onClick={() => { deleteRun(r.id); toast("Run deleted"); }}><Icon name="close" size={15} /></button>
            </div>
          </div>
        ))}
        {!runs.length && <p className="muted-note">No screening runs yet. Create your first screening run above.</p>}
      </div>
    </div>
  );
}
