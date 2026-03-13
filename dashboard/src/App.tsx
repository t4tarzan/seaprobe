import { useState } from "react";
import { DeviceList } from "./pages/DeviceList.js";
import { DeviceDetail } from "./pages/DeviceDetail.js";

export function App() {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "2rem" }}>
      <header style={{ marginBottom: "2rem", borderBottom: "1px solid #2d333b", paddingBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
          SeaProbe
          <span style={{ fontSize: "0.75rem", color: "#9ca3af", marginLeft: "0.5rem", fontWeight: 400 }}>
            v0.1.0
          </span>
        </h1>
      </header>

      {selectedDevice ? (
        <DeviceDetail deviceId={selectedDevice} onBack={() => setSelectedDevice(null)} />
      ) : (
        <DeviceList onSelect={setSelectedDevice} />
      )}
    </div>
  );
}
