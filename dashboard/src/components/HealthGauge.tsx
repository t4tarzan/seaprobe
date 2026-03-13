interface HealthGaugeProps {
  score: number | null;
}

/**
 * FEATURE GAP: This is a plain text display.
 * A coding task will ask the pipeline to turn this into
 * a proper radial SVG gauge with color transitions.
 */
export function HealthGauge({ score }: HealthGaugeProps) {
  if (score === null || isNaN(score)) {
    return (
      <div style={{ textAlign: "center", padding: "1rem" }}>
        <div style={{ fontSize: "2rem", color: "#666" }}>—</div>
        <div style={{ fontSize: "0.75rem", color: "#666" }}>No data</div>
      </div>
    );
  }

  const color = score >= 70 ? "#22c55e" : score >= 30 ? "#eab308" : "#ef4444";

  return (
    <div style={{ textAlign: "center", padding: "1rem" }}>
      <div style={{ fontSize: "2.5rem", fontWeight: 700, color }}>{score}%</div>
      <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Health Score</div>
    </div>
  );
}
