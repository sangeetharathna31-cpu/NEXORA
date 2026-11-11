import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_WEIGHTS, screen, type ScreenResult, type Weights } from "./screener";

/**
 * Code 2 is a fully client-side app: there is no backend, API, database or auth.
 * This store is the integration layer that holds the same data Code 2 kept in the
 * DOM (job description, resumes, weights, ranked results) in React state, and
 * persists it to localStorage so it survives a page refresh.
 */

export type Decision = "shortlisted" | "rejected";

export type Candidate = {
  id: string;
  name: string;
  text: string;
  fileName?: string;
  addedAt: number;
  decision?: Decision;
};

export type Run = {
  id: string;
  title: string;
  jd: string;
  weights: Weights;
  createdAt: number;
  durationMs: number;
  status: "completed" | "failed";
  error?: string;
  candidateIds: string[];
  results: ScreenResult[];
};

export type ActivityType = "upload" | "add" | "run" | "failed" | "decision" | "remove" | "reset";
export type ActivityItem = { id: string; type: ActivityType; title: string; text: string; at: number };

type Data = {
  candidates: Candidate[];
  runs: Run[];
  activity: ActivityItem[];
  defaultWeights: Weights;
};

const KEY = "nexora-screener-v1";
const EMPTY: Data = { candidates: [], runs: [], activity: [], defaultWeights: DEFAULT_WEIGHTS };
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

function load(): { data: Data; error?: string } {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { data: EMPTY };
    const p = JSON.parse(raw) as Partial<Data>;
    return {
      data: {
        candidates: Array.isArray(p.candidates) ? p.candidates : [],
        runs: Array.isArray(p.runs) ? p.runs : [],
        activity: Array.isArray(p.activity) ? p.activity : [],
        defaultWeights: { ...DEFAULT_WEIGHTS, ...(p.defaultWeights || {}) },
      },
    };
  } catch {
    return { data: EMPTY, error: "Saved workspace data could not be read and was ignored." };
  }
}

type Store = Data & {
  loadError?: string;
  saveError?: string;
  addCandidates: (items: { name: string; text: string; fileName?: string }[], via: "upload" | "add") => Candidate[];
  removeCandidate: (id: string) => void;
  setDecision: (id: string, d: Decision | undefined) => void;
  runScreening: (input: {
    title: string;
    jd: string;
    weights: Weights;
    candidateIds: string[];
  }) => Run;
  deleteRun: (id: string) => void;
  setDefaultWeights: (w: Weights) => void;
  resetAll: () => void;
  latestResult: (candidateId: string) => { run: Run; result: ScreenResult } | undefined;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [init] = useState(load);
  const [data, setData] = useState<Data>(init.data);
  const [saveError, setSaveError] = useState<string>();

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      setSaveError(undefined);
    } catch {
      setSaveError("Changes could not be saved in this browser (storage full or blocked).");
    }
  }, [data]);

  const log = (d: Data, type: ActivityType, title: string, text: string): Data => ({
    ...d,
    activity: [{ id: uid(), type, title, text, at: Date.now() }, ...d.activity].slice(0, 200),
  });

  const addCandidates: Store["addCandidates"] = useCallback((items, via) => {
    const created = items.map((i) => ({
      id: uid(),
      name: i.name,
      text: i.text,
      fileName: i.fileName,
      addedAt: Date.now(),
    }));
    if (!created.length) return created;
    setData((d) =>
      log(
        { ...d, candidates: [...created, ...d.candidates] },
        via,
        via === "upload" ? "Resumes uploaded" : "Candidate added",
        created.length === 1 ? created[0].name : `${created.length} resumes added`,
      ),
    );
    return created;
  }, []);

  const removeCandidate = useCallback((id: string) => {
    setData((d) => {
      const c = d.candidates.find((x) => x.id === id);
      return log(
        { ...d, candidates: d.candidates.filter((x) => x.id !== id) },
        "remove",
        "Candidate removed",
        c?.name ?? "Candidate",
      );
    });
  }, []);

  const setDecision = useCallback((id: string, dec: Decision | undefined) => {
    setData((d) => {
      const c = d.candidates.find((x) => x.id === id);
      if (!c) return d;
      const next = { ...d, candidates: d.candidates.map((x) => (x.id === id ? { ...x, decision: dec } : x)) };
      return log(
        next,
        "decision",
        dec === "shortlisted" ? "Candidate shortlisted" : dec === "rejected" ? "Candidate rejected" : "Decision cleared",
        c.name,
      );
    });
  }, []);

  const runScreening: Store["runScreening"] = useCallback(
    ({ title, jd, weights, candidateIds }) => {
      const started = performance.now();
      const base = { id: uid(), title, jd, weights, createdAt: Date.now(), candidateIds };
      let run: Run;
      try {
        const pool = data.candidates.filter((c) => candidateIds.includes(c.id));
        const results = screen(jd, pool.map((c) => ({ id: c.id, name: c.name, text: c.text })), weights);
        run = { ...base, status: "completed", results, durationMs: Math.round(performance.now() - started) };
      } catch (e) {
        run = {
          ...base,
          status: "failed",
          error: e instanceof Error ? e.message : "Unknown error",
          results: [],
          durationMs: Math.round(performance.now() - started),
        };
      }
      setData((d) =>
        log(
          { ...d, runs: [run, ...d.runs] },
          run.status === "completed" ? "run" : "failed",
          run.status === "completed" ? "Screening run completed" : "Screening run failed",
          `${title} · ${candidateIds.length} resume${candidateIds.length === 1 ? "" : "s"}`,
        ),
      );
      return run;
    },
    [data.candidates],
  );

  const deleteRun = useCallback((id: string) => setData((d) => ({ ...d, runs: d.runs.filter((r) => r.id !== id) })), []);
  const setDefaultWeights = useCallback((w: Weights) => setData((d) => ({ ...d, defaultWeights: w })), []);
  const resetAll = useCallback(() => setData(log(EMPTY, "reset", "Workspace data cleared", "All candidates and runs were removed")), []);

  const value = useMemo<Store>(
    () => ({
      ...data,
      loadError: init.error,
      saveError,
      addCandidates,
      removeCandidate,
      setDecision,
      runScreening,
      deleteRun,
      setDefaultWeights,
      resetAll,
      latestResult: (cid) => {
        for (const run of data.runs) {
          if (run.status !== "completed") continue;
          const result = run.results.find((r) => r.id === cid);
          if (result) return { run, result };
        }
        return undefined;
      },
    }),
    [data, init.error, saveError, addCandidates, removeCandidate, setDecision, runScreening, deleteRun, setDefaultWeights, resetAll],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside <StoreProvider>");
  return s;
}

export function timeAgo(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 45) return "Just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  const d = Math.round(s / 86400);
  return d === 1 ? "Yesterday" : `${d} days ago`;
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

export const emailOf = (text: string) => text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0];
