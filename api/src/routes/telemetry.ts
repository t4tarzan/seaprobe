import { Router } from "express";
import { upsertDevice, insertTelemetry, getRecentTelemetry } from "../services/storage.js";
import type { TelemetryPayload } from "../types.js";

export const telemetryRouter = Router();

/* Ingest telemetry from a probe */
telemetryRouter.post("/", (req, res) => {
  const payload = req.body as TelemetryPayload;

  if (!payload.deviceId) {
    res.status(400).json({ error: "deviceId is required" });
    return;
  }

  // Auto-register device on first telemetry
  upsertDevice(payload.deviceId);
  insertTelemetry(payload);

  res.status(201).json({ data: { status: "ok" } });
});

/* Get recent telemetry for a device */
telemetryRouter.get("/:deviceId", (req, res) => {
  const limit = parseInt(req.query.limit as string) || 60;
  const rows = getRecentTelemetry(req.params.deviceId, limit);
  res.json({ data: rows });
});
