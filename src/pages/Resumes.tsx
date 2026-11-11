import { useRef, useState } from "react";
import { Button, Icon, PageTitle, StatusBadge } from "../components/ui";
import { fmtSize, readResumeFile, type IntakeResult } from "../lib/intake";
import { useStore } from "../lib/store";
import type { Nav } from "../lib/nav";

export type IntakeEntry = IntakeResult & { key: string };

export function Resumes({ go, toast, log, setLog }: Nav & { log: IntakeEntry[]; setLog: (f: (p: IntakeEntry[]) => IntakeEntry[]) => void }) {
  const { addCandidates, candidates } = useStore();
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const intake = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    const out = await Promise.all(Array.from(list).map(readResumeFile));
    const good = out.filter((r): r is Extract<IntakeResult, { ok: true }> => r.ok);
    if (good.length) addCandidates(good.map((g) => ({ name: g.name, text: g.text, fileName: g.fileName })), "upload");
    setLog((p) => [...out.map((r, i) => ({ ...r, key: `${Date.now()}-${i}` })), ...p]);
    setBusy(false);
    if (good.length) toast(`${good.length} resume${good.length === 1 ? "" : "s"} added to your workspace`);
    if (ref.current) ref.current.value = "";
  };

  return (
    <div className="page page-enter">
      <PageTitle
        eyebrow="Resume intake"
        title="Resume processing"
        description="Add resume files for screening. Files are read in your browser and never uploaded to a server."
        actions={<StatusBadge tone="success">{candidates.length} in workspace</StatusBadge>}
      />
      <label
        className={`drop-zone ${over ? "over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); intake(e.dataTransfer.files); }}
      >
        <input ref={ref} type="file" multiple accept=".txt,.md" onChange={(e) => intake(e.target.files)} />
        <span className="upload-visual"><Icon name="upload" size={26} /><i /></span>
        <h2>Drop resumes here</h2>
        <p>or <b>browse your files</b> to add them to the workspace</p>
        <div className="upload-meta">
          <span>.TXT, .MD</span><i /><span>Up to 10 MB each</span><i />
          <span><Icon name="lock" size={12} /> Processed locally in your browser</span>
        </div>
      </label>
      <div className="processing-header">
        <div>
          <h2>Intake log</h2>
          <p>{busy ? "Reading files…" : `${log.length} file${log.length === 1 ? "" : "s"} this session`}</p>
        </div>
        <Button variant="secondary" onClick={() => setLog((p) => p.filter((x) => !x.ok))} >Clear completed</Button>
      </div>
      <div className="file-queue">
        {log.map((f) => (
          <div className={`file-item ${f.ok ? "" : "file-error"}`} key={f.key}>
            <span className="file-type">{f.ok ? "TXT" : "!"}</span>
            <div className="file-info">
              <div>
                <b>{f.fileName}</b>
                <small>{fmtSize(f.size)} · {f.ok ? `Added as “${f.name}”` : "Not added"}</small>
              </div>
              {!f.ok && <p className="error-copy">{f.error}</p>}
            </div>
            <div className="file-state">
              {f.ok ? <StatusBadge tone="success">Ready</StatusBadge> : <StatusBadge tone="danger">Rejected</StatusBadge>}
              <button className="icon-button" aria-label="Dismiss" onClick={() => setLog((p) => p.filter((x) => x.key !== f.key))}><Icon name="close" size={15} /></button>
            </div>
          </div>
        ))}
        {!log.length && <p className="muted-note">No files added in this session yet.</p>}
      </div>
      {candidates.length > 0 && (
        <div className="security-strip">
          <Icon name="spark" />
          <div><b>{candidates.length} resume{candidates.length === 1 ? "" : "s"} ready to screen</b><p>Create a screening run to rank them against a job description.</p></div>
          <button className="text-button" onClick={() => go("Screening Runs")}>New screening run <Icon name="arrow" size={13} /></button>
        </div>
      )}
    </div>
  );
}
