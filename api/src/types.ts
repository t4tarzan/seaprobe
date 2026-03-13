export interface TelemetryPayload {
  deviceId: string;
  cpuTemp: number;
  ramUsedPct: number;
  uptimeSec: number;
}

export interface Device {
  id: string;
  name: string;
  lastSeen: string | null;
  healthScore: number | null;
}

export interface TelemetryRow {
  id: number;
  deviceId: string;
  cpuTemp: number;
  ramUsedPct: number;
  uptimeSec: number;
  createdAt: string;
}
