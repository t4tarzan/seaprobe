import { Router } from "express";
import { getDevices, getDevice, upsertDevice } from "../services/storage.js";
import { calculateHealthScore } from "../services/health-score.js";

export const devicesRouter = Router();

/* List all devices with health scores */
devicesRouter.get("/", (_req, res) => {
  const devices = getDevices();
  const withScores = devices.map((d) => ({
    ...d,
    healthScore: calculateHealthScore(d.id),
  }));
  res.json({ data: withScores });
});

/* Get single device with health score */
devicesRouter.get("/:id", (req, res) => {
  const device = getDevice(req.params.id);
  if (!device) {
    res.status(404).json({ error: "Device not found" });
    return;
  }
  device.healthScore = calculateHealthScore(device.id);
  res.json({ data: device });
});

/* Register a new device */
devicesRouter.post("/", (req, res) => {
  const { id, name } = req.body as { id?: string; name?: string };
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }
  upsertDevice(id, name);
  res.status(201).json({ data: { id, name: name ?? id } });
});
