import express from "express";
import cors from "cors";
import { devicesRouter } from "./routes/devices.js";
import { telemetryRouter } from "./routes/telemetry.js";

export function createApp(): express.Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "seaprobe-api", version: "0.1.0" });
  });

  // Routes
  app.use("/api/devices", devicesRouter);
  app.use("/api/telemetry", telemetryRouter);

  return app;
}
