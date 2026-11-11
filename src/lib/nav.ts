export type Page =
  | "Overview"
  | "Candidates"
  | "Resumes"
  | "Screening Runs"
  | "Matches"
  | "Analytics"
  | "Activity"
  | "Settings";

export type Nav = {
  go: (page: Page) => void;
  openCandidate: (id: string) => void;
  openRun: (id: string) => void;
  toast: (message: string) => void;
};
