interface StatusDotProps {
  lastSeen: string | null;
}

export function StatusDot({ lastSeen }: StatusDotProps) {
  if (!lastSeen) {
    return <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#666" }} />;
  }

  const ageSec = (Date.now() - new Date(lastSeen).getTime()) / 1000;
  const online = ageSec < 60;
  const color = online ? "#22c55e" : ageSec < 300 ? "#eab308" : "#ef4444";

  return (
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: color,
        boxShadow: online ? `0 0 6px ${color}` : "none",
      }}
    />
  );
}
