/** Resume intake — same accepted types as Code 2 (.txt / .md read as text). */
export const MAX_BYTES = 10 * 1024 * 1024;

export type IntakeResult =
  | { ok: true; fileName: string; name: string; text: string; size: number }
  | { ok: false; fileName: string; size: number; error: string };

export async function readResumeFile(f: File): Promise<IntakeResult> {
  const base = { fileName: f.name, size: f.size };
  if (!/\.(txt|md)$/i.test(f.name)) {
    const binary = /\.(pdf|docx?|rtf|odt)$/i.test(f.name);
    return {
      ok: false,
      ...base,
      error: binary
        ? "PDF and Word files can't be read by this screener yet. Save the resume as .txt or .md, or paste its text."
        : "Unsupported file type. Upload a .txt or .md resume.",
    };
  }
  if (f.size > MAX_BYTES) return { ok: false, ...base, error: "File is larger than 10 MB." };
  try {
    const text = (await f.text()).trim();
    if (!text) return { ok: false, ...base, error: "The file is empty." };
    return { ok: true, ...base, text, name: f.name.replace(/\.[^.]+$/, "").replace(/_/g, " ") };
  } catch {
    return { ok: false, ...base, error: "The file could not be read." };
  }
}

export const fmtSize = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`);
