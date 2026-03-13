const BASE = "";

export interface Device {
  id: string;
  name: string;
  lastSeen: string | null;
  healthScore: number | null;
}

export interface TelemetryPoint {
  cpuTemp: number;
  ramUsedPct: number;
  uptimeSec: number;
  createdAt: string;
}

export async function fetchDevices(): Promise<Device[]> {
  const res = await fetch(`${BASE}/api/devices`);
  const json = await res.json();
  return json.data;
}

export async function fetchDevice(id: string): Promise<Device> {
  const res = await fetch(`${BASE}/api/devices/${id}`);
  const json = await res.json();
  return json.data;
}

export async function fetchTelemetry(deviceId: string): Promise<TelemetryPoint[]> {
  const res = await fetch(`${BASE}/api/telemetry/${deviceId}?limit=30`);
  const json = await res.json();
  return json.data;
}
