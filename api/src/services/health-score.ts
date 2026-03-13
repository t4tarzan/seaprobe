import { getRecentTelemetry } from "./storage.js";

/**
 * Calculate a 0–100 health score for a device based on recent telemetry.
 *
 * Scoring:
 *   - CPU temp:   100 if <60°C, scales down linearly to 0 at 90°C
 *   - RAM usage:  100 if <50%, scales down linearly to 0 at 95%
 *   - Freshness:  100 if last report <30s ago, 0 if >5min ago
 *
 * Final score = weighted average (CPU 30%, RAM 40%, Freshness 30%)
 *
 * BUG: When a device has zero telemetry rows, `rows.length` is 0.
 * The function divides by `rows.length` to compute averages,
 * producing NaN. The NaN propagates to the final score.
 *
 * Steps to reproduce:
 *   1. Register a device via POST /api/devices
 *   2. Don't send any telemetry
 *   3. GET /api/devices/:id → healthScore: NaN (invalid JSON number)
 */
export function calculateHealthScore(deviceId: string): number {
  const rows = getRecentTelemetry(deviceId, 10);

  // BUG: no guard for empty rows — division by zero below
  let avgTemp = 0;
  let avgRam = 0;

  for (const row of rows) {
    avgTemp += row.cpuTemp;
    avgRam += row.ramUsedPct;
  }
  avgTemp /= rows.length;  // NaN when rows.length === 0
  avgRam /= rows.length;   // NaN when rows.length === 0

  // CPU score: 100 at ≤60°C, 0 at ≥90°C
  const cpuScore = avgTemp < 0
    ? 50 // sensor unavailable, assume neutral
    : Math.max(0, Math.min(100, 100 - ((avgTemp - 60) / 30) * 100));

  // RAM score: 100 at ≤50%, 0 at ≥95%
  const ramScore = avgRam < 0
    ? 50
    : Math.max(0, Math.min(100, 100 - ((avgRam - 50) / 45) * 100));

  // Freshness score based on most recent telemetry timestamp
  let freshnessScore = 0;
  if (rows.length > 0) {
    const lastReport = new Date(rows[0].createdAt).getTime();
    const ageSec = (Date.now() - lastReport) / 1000;
    freshnessScore = Math.max(0, Math.min(100, 100 - (ageSec / 300) * 100));
  }

  // Weighted average
  const score = cpuScore * 0.3 + ramScore * 0.4 + freshnessScore * 0.3;

  return Math.round(score);
}
