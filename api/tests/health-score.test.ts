import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initStorage, closeStorage, upsertDevice, insertTelemetry } from "../src/services/storage.js";
import { calculateHealthScore } from "../src/services/health-score.js";

describe("calculateHealthScore", () => {
  beforeEach(() => {
    initStorage(":memory:");
  });

  afterEach(() => {
    closeStorage();
  });

  it("returns a valid number for a device with telemetry", () => {
    upsertDevice("test-device");
    insertTelemetry({ deviceId: "test-device", cpuTemp: 45.0, ramUsedPct: 60.0, uptimeSec: 3600 });

    const score = calculateHealthScore("test-device");
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(Number.isNaN(score)).toBe(false);
  });

  it("BUG: returns NaN for a device with no telemetry", () => {
    upsertDevice("empty-device");

    const score = calculateHealthScore("empty-device");
    // This test documents the bug: score is NaN due to division by zero
    // After fix, this should return a valid number (e.g., 0 or a default)
    expect(Number.isNaN(score)).toBe(true); // BUG — should be false after fix
  });

  it("scores high for cool, low-RAM device", () => {
    upsertDevice("cool-device");
    insertTelemetry({ deviceId: "cool-device", cpuTemp: 35.0, ramUsedPct: 20.0, uptimeSec: 100 });

    const score = calculateHealthScore("cool-device");
    expect(score).toBeGreaterThan(60);
  });

  it("scores low for hot, high-RAM device", () => {
    upsertDevice("hot-device");
    insertTelemetry({ deviceId: "hot-device", cpuTemp: 85.0, ramUsedPct: 92.0, uptimeSec: 100 });

    const score = calculateHealthScore("hot-device");
    expect(score).toBeLessThan(40);
  });
});
