/**
 * Screening engine — ported 1:1 from resume-screener.html (Code 2).
 *
 * The scoring logic (skill dictionary, education ladder, TF-IDF cosine
 * similarity, years/education regexes and the weighted score formula) is
 * unchanged. The only differences from the original are structural:
 *  - weights are passed in instead of read from a mutable global,
 *  - highlight() returns segments (rendered by React) instead of an HTML string,
 *  - screen() additionally exposes the experience / education sub-scores that the
 *    original already computed internally, so the UI can display them.
 */

export const SKILLS = [
  "python", "java", "javascript", "typescript", "c++", "c#", "go", "sql", "mysql",
  "postgresql", "mongodb", "html", "css", "react", "angular", "vue", "node.js",
  "express", "django", "flask", "fastapi", "spring boot", "rest api", "graphql",
  "docker", "kubernetes", "aws", "azure", "gcp", "git", "linux", "machine learning",
  "deep learning", "nlp", "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
  "data structures", "algorithms", "data analysis", "power bi", "tableau", "ci/cd", "agile",
];

const EDU: Record<string, number> = {
  phd: 4, doctorate: 4, master: 3, "m.tech": 3, mtech: 3, "m.sc": 3, mba: 3,
  "m.e": 3, bachelor: 2, "b.tech": 2, btech: 2, "b.e": 2, "b.sc": 2, bca: 2, diploma: 1,
};
export const EDN = ["Not specified", "Diploma", "Bachelor's", "Master's", "PhD"];

export type Weights = { skills: number; text: number; exp: number; edu: number };
export const DEFAULT_WEIGHTS: Weights = { skills: 45, text: 30, exp: 15, edu: 10 };
export const WEIGHT_LABELS: Record<keyof Weights, string> = {
  skills: "Skills match",
  text: "Text similarity",
  exp: "Experience",
  edu: "Education",
};

const STOP = new Set(
  "a an the and or of to in for with on at by is are was be as from that this it we you our your will have has can must should their they them not but also more such than into over about able work working role team".split(
    " ",
  ),
);

const re = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
const skillRe = (s: string) => new RegExp("(?<![\\w+#])" + re(s) + "(?![\\w+#])", "i");

export const skillsOf = (t: string): Set<string> => new Set(SKILLS.filter((s) => skillRe(s).test(t)));

export const yearsOf = (t: string): number =>
  Math.max(
    0,
    ...[...t.toLowerCase().matchAll(/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)/g)].map((m) => +m[1]),
  );

export const eduOf = (t: string): number => {
  const lower = t.toLowerCase();
  return Math.max(
    0,
    ...Object.entries(EDU)
      .filter(([k]) => new RegExp("(?<![\\w.])" + re(k)).test(lower))
      .map(([, v]) => v),
  );
};

const ratio = (h: number, n: number) => (n === 0 ? 1 : Math.min(h / n, 1));

function terms(t: string): string[] {
  const w = (t.toLowerCase().match(/[a-z0-9+#.]+/g) || [])
    .map((x) => x.replace(/^\.+|\.+$/g, ""))
    .filter((x) => x && !STOP.has(x));
  const o = [...w];
  for (let i = 0; i < w.length - 1; i++) o.push(w[i] + " " + w[i + 1]);
  return o;
}

function tfidf(docs: string[]): Record<string, number>[] {
  const tk = docs.map(terms);
  const N = docs.length;
  const df: Record<string, number> = {};
  tk.forEach((t) => new Set(t).forEach((k) => (df[k] = (df[k] || 0) + 1)));
  return tk.map((t) => {
    const tf: Record<string, number> = {};
    t.forEach((k) => (tf[k] = (tf[k] || 0) + 1));
    const v: Record<string, number> = {};
    let n = 0;
    for (const k in tf) {
      const x = (1 + Math.log(tf[k])) * (Math.log((1 + N) / (1 + df[k])) + 1);
      v[k] = x;
      n += x * x;
    }
    n = Math.sqrt(n) || 1;
    for (const k in v) v[k] /= n;
    return v;
  });
}

const cos = (a: Record<string, number>, b: Record<string, number>) => {
  let s = 0;
  for (const k in a) if (b[k]) s += a[k] * b[k];
  return s;
};

export type ScreenInput = { id: string; name: string; text: string };

export type ScreenResult = {
  id: string;
  name: string;
  score: number;
  /** Skill match, 0-100 */
  sk: number;
  /** Text similarity (cosine), 0-100 */
  sim: number;
  /** Years of experience detected in the resume */
  y: number;
  /** Education level index into EDN */
  e: number;
  /** Experience sub-score 0-100 (ratio of detected years to required years) */
  expScore: number;
  /** Education sub-score 0-100 */
  eduScore: number;
  matched: string[];
  missing: string[];
  extra: string[];
  jdSkillCount: number;
};

export type JobRequirements = { skills: string[]; years: number; edu: number };

export function requirementsOf(jd: string): JobRequirements {
  return { skills: [...skillsOf(jd)], years: yearsOf(jd), edu: eduOf(jd) };
}

export function screen(jd: string, cands: ScreenInput[], W: Weights): ScreenResult[] {
  const js = skillsOf(jd);
  const jy = yearsOf(jd);
  const je = eduOf(jd);
  const vecs = tfidf([jd, ...cands.map((c) => c.text)]);
  const tot = Object.values(W).reduce((a, b) => a + b, 0) || 1;
  return cands.map((c, i) => {
    const s = skillsOf(c.text);
    const matched = [...s].filter((x) => js.has(x));
    const missing = [...js].filter((x) => !s.has(x));
    const extra = [...s].filter((x) => !js.has(x));
    const sk = js.size ? matched.length / js.size : 0;
    const sim = cos(vecs[0], vecs[i + 1]);
    const y = yearsOf(c.text);
    const e = eduOf(c.text);
    const score =
      ((W.skills * sk + W.text * Math.min(sim * 2, 1) + W.exp * ratio(y, jy) + W.edu * ratio(e, je)) /
        tot) *
      100;
    return {
      id: c.id,
      name: c.name,
      score,
      sk: sk * 100,
      sim: sim * 100,
      y,
      e,
      expScore: ratio(y, jy) * 100,
      eduScore: ratio(e, je) * 100,
      matched,
      missing,
      extra,
      jdSkillCount: js.size,
    };
  });
}

export type Fit = { label: string; tone: "success" | "info" | "warning" | "danger" };
export const fit = (s: number): Fit =>
  s >= 75
    ? { label: "Strong fit", tone: "success" }
    : s >= 55
      ? { label: "Good fit", tone: "info" }
      : s >= 35
        ? { label: "Partial fit", tone: "warning" }
        : { label: "Low fit", tone: "danger" };

/** Split resume text into plain / matched-skill / other-skill segments for safe rendering. */
export type Segment = { text: string; kind: "plain" | "matched" | "other" };
export function highlight(text: string, matchedSkills: Set<string>): Segment[] {
  const all = [...SKILLS].sort((a, b) => b.length - a.length).map(re).join("|");
  const rx = new RegExp("(?<![\\w+#])(" + all + ")(?![\\w+#])", "gi");
  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(rx)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ text: text.slice(last, idx), kind: "plain" });
    out.push({ text: m[0], kind: matchedSkills.has(m[0].toLowerCase()) ? "matched" : "other" });
    last = idx + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), kind: "plain" });
  return out;
}

/** CSV export — same columns as the original shortlist.csv. */
export function toCsv(results: ScreenResult[]): string {
  const q = (s: unknown) => '"' + String(s).replace(/"/g, '""') + '"';
  const rows = [
    ["Rank", "Candidate", "Score", "Skill match %", "Text similarity %", "Years", "Matched skills", "Missing skills"],
    ...[...results]
      .sort((a, b) => b.score - a.score)
      .map((x, i) => [
        i + 1,
        x.name,
        x.score.toFixed(1),
        x.sk.toFixed(0),
        x.sim.toFixed(0),
        x.y,
        x.matched.join("; "),
        x.missing.join("; "),
      ]),
  ];
  return rows.map((r) => r.map(q).join(",")).join("\n");
}

export const SAMPLE = {
  title: "Python Developer",
  jd: "Python Developer. 3+ years of experience building web applications. Required skills: Python, Flask, SQL, Docker, REST API, Git. Bachelor degree in computer science. Knowledge of AWS is a plus.",
  candidates: [
    {
      name: "Asha",
      text: "B.Tech Computer Science. 4 years experience as backend developer. Built REST API services with Python, Flask and PostgreSQL SQL databases. Deployed with Docker on AWS. Git workflow.",
    },
    {
      name: "Ravi",
      text: "Bachelor degree. 1 year experience as Java developer. Spring Boot, MySQL, Git, HTML, CSS.",
    },
    {
      name: "Meena",
      text: "M.Tech. 5 years experience. Python, Django, SQL, AWS, Git, data analysis with pandas.",
    },
  ],
};
