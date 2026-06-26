type PortalView = "overview" | "triage" | "todo" | "resolved" | "releases" | "analytics";

type ViewNavigationProps = {
  activeView: PortalView;
  onChange: (view: PortalView) => void;
  todoCount: number;
  resolvedCount: number;
};

const viewOptions: Array<{
  id: PortalView;
  label: string;
  description: string;
}> = [
  {
    id: "overview",
    label: "Overview",
    description: "Health, release, and operational summary",
  },
  {
    id: "triage",
    label: "Triage Desk",
    description: "Priority queue, filters, and status handling",
  },
  {
    id: "todo",
    label: "Todo",
    description: "Bugs currently in progress",
  },
  {
    id: "resolved",
    label: "Resolved",
    description: "Completed bugs and closed history",
  },
  {
    id: "releases",
    label: "Releases",
    description: "Version health and release-specific issues",
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Breakdowns, trends, and concentration analysis",
  },
];

export function ViewNavigation({
  activeView,
  onChange,
  todoCount,
  resolvedCount,
}: ViewNavigationProps) {
  return (
    <section className="view-navigation">
      {viewOptions.map((option) => (
        <button
          key={option.id}
          className={`view-tab ${activeView === option.id ? "active" : ""}`}
          onClick={() => onChange(option.id)}
        >
          <strong>
            {option.label}
            {option.id === "todo" ? <span className="tab-badge">{todoCount}</span> : null}
            {option.id === "resolved" ? (
              <span className="tab-badge">{resolvedCount}</span>
            ) : null}
          </strong>
          <span>{option.description}</span>
        </button>
      ))}
    </section>
  );
}
