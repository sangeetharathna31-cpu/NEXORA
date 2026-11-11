import { EmptyState, Icon, PageTitle, type IconName } from "../components/ui";
import { useStore, type ActivityType } from "../lib/store";
import type { Nav } from "../lib/nav";

const ICON: Record<ActivityType, IconName> = { upload: "upload", add: "plus", run: "spark", failed: "shield", decision: "check", remove: "close", reset: "clock" };
const dayKey = (t: number) => {
  const d = new Date(t), n = new Date();
  const diff = Math.round((new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 864e5);
  return diff === 0 ? "Today" : diff === 1 ? "Yesterday" : d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
};

export function ActivityPage({ go }: Nav) {
  const { activity } = useStore();
  const groups: [string, typeof activity][] = [];
  activity.forEach((a) => {
    const k = dayKey(a.at);
    const g = groups.find((x) => x[0] === k);
    g ? g[1].push(a) : groups.push([k, [a]]);
  });
  return (
    <div className="page page-enter">
      <PageTitle eyebrow="Audit trail" title="Activity" description="A record of uploads, screening runs and shortlist decisions in this workspace." />
      <div className="audit-layout">
        <main className="audit-list">
          {groups.map(([day, items]) => (
            <section key={day}>
              <h3>{day}</h3>
              {items.map((a) => (
                <div className="audit-item" key={a.id}>
                  <span className="audit-icon"><Icon name={ICON[a.type]} size={16} /></span>
                  <div><b>{a.title}</b><p>{a.text}</p></div>
                  <time>{new Date(a.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time>
                </div>
              ))}
            </section>
          ))}
          {!groups.length && <EmptyState icon="activity" title="No activity yet" text="Actions like uploading resumes or running a screening will be recorded here." action="Create screening run" onAction={() => go("Screening Runs")} />}
        </main>
        <aside className="audit-aside">
          <Icon name="shield" />
          <h3>Stored locally</h3>
          <p>Activity is kept in this browser only. It is not sent to a server and is cleared if you clear workspace data or your browser storage.</p>
          <div><span>Entries kept</span><b>{activity.length} (max 200)</b></div>
        </aside>
      </div>
    </div>
  );
}
