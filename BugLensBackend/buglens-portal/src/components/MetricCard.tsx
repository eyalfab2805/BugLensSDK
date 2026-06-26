type MetricCardProps = {
  label: string;
  value: string;
  tone?: "danger" | "warning" | "success";
  helper?: string;
};

export function MetricCard({ label, value, tone, helper }: MetricCardProps) {
  return (
    <div className={`metric-card ${tone || ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {helper ? <p>{helper}</p> : null}
    </div>
  );
}
