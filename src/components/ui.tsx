import type { ReactNode } from "react";
import { fit } from "../lib/screener";

export type IconName =
  | "grid"
  | "users"
  | "file"
  | "scan"
  | "spark"
  | "chart"
  | "activity"
  | "settings"
  | "search"
  | "bell"
  | "help"
  | "chevron"
  | "plus"
  | "arrow"
  | "more"
  | "filter"
  | "upload"
  | "shield"
  | "check"
  | "clock"
  | "close"
  | "sun"
  | "moon"
  | "menu"
  | "briefcase"
  | "mail"
  | "phone"
  | "location"
  | "download"
  | "lock"
  | "eye";

const iconPaths: Record<IconName, ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h6" />
    </>
  ),
  scan: (
    <>
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
      <circle cx="12" cy="11" r="3" />
      <path d="M7 17c1.2-2 2.9-3 5-3s3.8 1 5 3" />
    </>
  ),
  spark: (
    <path d="m12 3-1.3 4.3a5 5 0 0 1-3.4 3.4L3 12l4.3 1.3a5 5 0 0 1 3.4 3.4L12 21l1.3-4.3a5 5 0 0 1 3.4-3.4L21 12l-4.3-1.3a5 5 0 0 1-3.4-3.4L12 3Z" />
  ),
  chart: (
    <>
      <path d="M3 3v18h18" />
      <path d="m7 16 4-5 4 3 5-7" />
    </>
  ),
  activity: (
    <>
      <path d="M3 12h4l2-7 4 14 2-7h6" />
      <circle cx="12" cy="12" r="10" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M14 21h-4" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.1 9a3 3 0 1 1 4.8 2.4c-1.1.8-1.9 1.3-1.9 2.6M12 18h.01" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="m5 12 14 0m-5-5 5 5-5 5" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  filter: <path d="M4 5h16M7 12h10M10 19h4" />,
  upload: (
    <>
      <path d="M12 16V4m0 0L7 9m5-5 5 5" />
      <path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" />
    </>
  ),
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Zm-3-10 2 2 4-4" />,
  check: <path d="m5 12 4 4L19 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  phone: (
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2.1Z" />
  ),
  location: (
    <>
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12m0 0 5-5m-5 5-5-5M5 21h14" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
};

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  );
}

export function Logo() {
  return (
    <div className="logo">
      <div className="logo-mark">
        <span />
        <span />
        <span />
      </div>
      <div>
        <b>NEXORA</b>
        <small>SCREEN</small>
      </div>
    </div>
  );
}

export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: string }) {
  return (
    <span className={`status ${tone}`}>
      <i />
      {children}
    </span>
  );
}

export function MatchScore({ score, compact = false }: { score: number; compact?: boolean }) {
  const f = fit(score);
  const rounded = Math.round(score);
  return (
    <div className={`match-score ${compact ? "compact" : ""}`}>
      <div className="score-ring" style={{ "--score": `${Math.min(100, score) * 3.6}deg` } as React.CSSProperties}>
        <strong>{rounded}</strong>
      </div>
      {!compact && (
        <div>
          <b>{f.label}</b>
          <small>Score out of 100</small>
        </div>
      )}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  icon,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  variant?: string;
  icon?: IconName;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button type={type} className={`button ${variant}`} onClick={onClick}>
      {icon && <Icon name={icon} size={16} />}
      <span>{children}</span>
    </button>
  );
}

export function Sparkline({ points, tone = "violet" }: { points: string; tone?: string }) {
  return (
    <svg className={`sparkline ${tone}`} viewBox="0 0 110 34" preserveAspectRatio="none">
      <path className="spark-area" d={`${points} L110 34 L0 34Z`} />
      <path className="spark-line" d={points} />
    </svg>
  );
}

export function MiniBars({ data }: { data: number[] }) {
  return (
    <div className="mini-bars">
      {data.map((h, i) => (
        <i key={i} style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

export function PageTitle({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-title">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
  onAction,
}: {
  icon: IconName;
  title: string;
  text: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="empty">
      <span>
        <Icon name={icon} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      <Button variant="secondary" onClick={onAction}>
        {action}
      </Button>
    </div>
  );
}


export function Banner({
  tone = "error",
  title,
  children,
  action,
}: {
  tone?: "error" | "warning" | "success";
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={`state-banner ${tone}`} role={tone === "error" ? "alert" : "status"}>
      <Icon name={tone === "success" ? "check" : "shield"} size={16} />
      <div>
        <b>{title}</b>
        {children && <p>{children}</p>}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="skeleton-list" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <i key={i} className="skeleton" style={{ width: `${92 - i * 9}%` }} />
      ))}
    </div>
  );
}

export function Modal({
  title,
  eyebrow,
  onClose,
  children,
  footer,
}: {
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="explanation-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <header>
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h2>{title}</h2>
          </div>
          <button className="icon-button" aria-label="Close" onClick={onClose}>
            <Icon name="close" />
          </button>
        </header>
        {children}
        {footer && <footer>{footer}</footer>}
      </section>
    </div>
  );
}
