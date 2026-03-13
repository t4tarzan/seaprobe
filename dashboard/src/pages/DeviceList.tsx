import { useEffect, useState } from "react";
import { fetchDevices, type Device } from "../api/client.js";
import { StatusDot } from "../components/StatusDot.js";

interface DeviceListProps {
  onSelect: (id: string) => void;
}

/**
 * FEATURE GAP: No auto-refresh.
 * The device list is fetched once on mount and never updates.
 * A coding task will ask the pipeline to add polling or WebSocket
 * updates so the list refreshes automatically.
 */
export function DeviceList({ onSelect }: DeviceListProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDevices()
      .then(setDevices)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // No interval — data goes stale immediately
  }, []);

  if (loading) return <div style={{ padding: "2rem", color: "#9ca3af" }}>Loading devices...</div>;
  if (error) return <div style={{ padding: "2rem", color: "#ef4444" }}>Error: {error}</div>;
  if (devices.length === 0) return <div style={{ padding: "2rem", color: "#9ca3af" }}>No devices registered. Start a probe to begin.</div>;

  return (
    <div>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Devices</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #2d333b", textAlign: "left" }}>
            <th style={{ padding: "0.5rem" }}>Status</th>
            <th style={{ padding: "0.5rem" }}>Name</th>
            <th style={{ padding: "0.5rem" }}>Health</th>
            <th style={{ padding: "0.5rem" }}>Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((d) => (
            <tr
              key={d.id}
              onClick={() => onSelect(d.id)}
              style={{ borderBottom: "1px solid #1c2028", cursor: "pointer" }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#161b22")}
              onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <td style={{ padding: "0.5rem" }}><StatusDot lastSeen={d.lastSeen} /></td>
              <td style={{ padding: "0.5rem" }}>{d.name}</td>
              <td style={{ padding: "0.5rem" }}>
                {d.healthScore !== null && !isNaN(d.healthScore) ? `${d.healthScore}%` : "—"}
              </td>
              <td style={{ padding: "0.5rem", color: "#9ca3af", fontSize: "0.875rem" }}>
                {d.lastSeen ?? "never"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
