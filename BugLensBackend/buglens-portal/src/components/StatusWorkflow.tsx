import { statusLabels, statuses } from "../constants/reports";
import type { ReportStatus } from "../types/reports";

type StatusWorkflowProps = {
  currentStatus: ReportStatus;
  busy?: boolean;
  onChange: (nextStatus: ReportStatus) => void;
};

export function StatusWorkflow({
  currentStatus,
  busy = false,
  onChange,
}: StatusWorkflowProps) {
  return (
    <div className="status-workflow">
      {statuses.map((status) => (
        <button
          key={status}
          className={`status-step ${status} ${currentStatus === status ? "active" : ""}`}
          onClick={() => onChange(status)}
          disabled={busy || currentStatus === status}
        >
          <span>{statusLabels[status]}</span>
        </button>
      ))}
    </div>
  );
}
