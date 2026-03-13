import { useEffect, useState } from "react";
import { fetchDevice, fetchTelemetry, type Device, type TelemetryPoint } from "../api/client.js";
import { HealthGauge } from "../components/HealthGauge.js";

interface DeviceDetailProps {
  deviceId: string;
  onBack: () => void;
}

export function DeviceDetail({ deviceId, onBack }: DeviceDetailProps) {
  const [device, setDevice] = useState<Device | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDevice(deviceId), fetchTelemetry(deviceId)])
      .then(([d, t]) => {
        setDevice(d);
        setTelemetry(t);
      })
      .finally(() => setLoading(false));
  }, [deviceId]);

  if (loading) return <div style={{ padding: "2rem", color: "#9ca3af" }}>Loading...</div>;
  if (!device) return <div style={{ padding: "2rem", color: "#ef4444" }}>Device not found</div>;

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "1px solid #2d333b",
          color: "#9ca3af",
          padding: "0.25rem 0.75rem",
          borderRadius: 4,
          cursor: "pointer",
          marginBottom: "1rem",
        }}
      >
        Back
      </button>

      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>{device.name}</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.5rem" }}>
        {/* Health gauge */}
        <div style={{ background: "#161b22", borderRadius: 8, padding: "1rem" }}>
          <HealthGauge score={device.healthScore} />
          <div style={{ fontSize: "0.75rem", color: "#666", textAlign: "center", marginTop: "0.5rem" }}>
            ID: {device.id}
          </div>
        </div>

        {/* Recent telemetry table */}
        <div style={{ background: "#161b22", borderRadius: 8, padding: "1rem" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Recent Telemetry</h3>
          {telemetry.length === 0 ? (
            <div style={{ color: "#666" }}>No telemetry data</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2d333b", textAlign: "left" }}>
                  <th style={{ padding: "0.25rem" }}>CPU</th>
                  <th style={{ padding: "0.25rem" }}>RAM</th>
                  <th style={{ padding: "0.25rem" }}>Uptime</th>
                  <th style={{ padding: "0.25rem" }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {telemetry.slice(0, 10).map((t, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #1c2028" }}>
                    <td style={{ padding: "0.25rem" }}>{t.cpuTemp >= 0 ? `${t.cpuTemp}°C` : "n/a"}</td>
                    <td style={{ padding: "0.25rem" }}>{t.ramUsedPct >= 0 ? `${t.ramUsedPct.toFixed(1)}%` : "n/a"}</td>
                    <td style={{ padding: "0.25rem" }}>{formatUptime(t.uptimeSec)}</td>
                    <td style={{ padding: "0.25rem", color: "#666" }}>{t.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function formatUptime(sec: number): string {
  if (sec < 0) return "n/a";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
