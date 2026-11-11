import { useState, type ReactNode } from "react";
import { Banner, Button, PageTitle } from "../components/ui";
import { DEFAULT_WEIGHTS, WEIGHT_LABELS, type Weights } from "../lib/screener";
import { useStore } from "../lib/store";

function Section({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <section className="settings-section">
      <div><h2>{title}</h2><p>{text}</p></div>
      {children}
    </section>
  );
}

export function SettingsPage({ theme, setTheme, toast }: { theme: string; setTheme: (s: string) => void; toast: (s: string) => void }) {
  const { candidates, runs, defaultWeights, setDefaultWeights, resetAll } = useStore();
  const [tab, setTab] = useState("Screening preferences");
  const [w, setW] = useState<Weights>(defaultWeights);
  const [confirm, setConfirm] = useState(false);
  const tabs = ["Screening preferences", "Appearance", "Data & privacy"];
  return (
    <div className="page page-enter">
      <PageTitle eyebrow="Workspace" title="Settings" description="Screening defaults, appearance and local data controls." />
      <div className="settings-layout">
        <nav>{tabs.map((t) => <button className={tab === t ? "active" : ""} onClick={() => setTab(t)} key={t}>{t}</button>)}</nav>
        <main className="settings-main">
          {tab === "Screening preferences" && (
            <Section title="Default scoring weights" text="New screening runs start with these weights. You can still adjust them per run.">
              <div className="weight-list">
                {(Object.keys(w) as (keyof Weights)[]).map((k) => (
                  <div key={k}>
                    <span><b>{WEIGHT_LABELS[k]}</b><strong>{w[k]}%</strong></span>
                    <input type="range" min={0} max={100} value={w[k]} aria-label={WEIGHT_LABELS[k]} onChange={(e) => setW({ ...w, [k]: +e.target.value })} />
                  </div>
                ))}
              </div>
              <div className="settings-actions">
                <Button variant="ghost" onClick={() => setW(DEFAULT_WEIGHTS)}>Reset to original</Button>
                <Button onClick={() => { setDefaultWeights(w); toast("Default weights saved"); }}>Save defaults</Button>
              </div>
            </Section>
          )}
          {tab === "Appearance" && (
            <Section title="Theme" text="Choose how the workspace looks on this device.">
              <div className="theme-choices">
                {["dark", "light"].map((t) => (
                  <button key={t} className={theme === t ? "active" : ""} onClick={() => setTheme(t)}>{t === "dark" ? "Dark" : "Light"}</button>
                ))}
              </div>
            </Section>
          )}
          {tab === "Data & privacy" && (
            <Section title="Local data" text="Resumes and results are processed in your browser and saved to this browser's local storage. Nothing is sent to a server.">
              <div className="fact-grid">
                <div><span>Candidates stored</span><b>{candidates.length}</b></div>
                <div><span>Screening runs stored</span><b>{runs.length}</b></div>
              </div>
              {confirm ? (
                <Banner tone="warning" title="Delete all candidates, runs and activity?" action={
                  <span className="banner-actions">
                    <Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
                    <Button variant="danger" onClick={() => { resetAll(); setConfirm(false); toast("Workspace data cleared"); }}>Delete everything</Button>
                  </span>
                }>This cannot be undone.</Banner>
              ) : (
                <div className="settings-actions"><Button variant="danger" onClick={() => setConfirm(true)}>Clear workspace data</Button></div>
              )}
            </Section>
          )}
        </main>
      </div>
    </div>
  );
}
