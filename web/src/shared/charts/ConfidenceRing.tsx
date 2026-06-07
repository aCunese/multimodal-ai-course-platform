type ConfidenceRingProps = {
  value: number;
  label: string;
};

export function ConfidenceRing({ value, label }: ConfidenceRingProps) {
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="confidence-ring">
      <svg viewBox="0 0 200 200" className="confidence-ring__svg" aria-hidden="true">
        <circle cx="100" cy="100" r={radius} className="confidence-ring__track" />
        <circle
          cx="100"
          cy="100"
          r={radius}
          className="confidence-ring__progress"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="confidence-ring__content">
        <strong>{value.toFixed(1)}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
