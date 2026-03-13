#!/usr/bin/env node
import { Command } from "commander";
import { createApp } from "./server.js";
import { initStorage, getDevices, closeStorage } from "./services/storage.js";
import { calculateHealthScore } from "./services/health-score.js";

const program = new Command();

program
  .name("seaprobe-api")
  .description("SeaProbe API — device health monitoring server & CLI")
  .version("0.1.0");

/* --- serve --- */
program
  .command("serve")
  .description("Start the API server")
  .option("-p, --port <port>", "Port to listen on", "4000")
  .option("-d, --db <path>", "SQLite database path", "seaprobe.db")
  .action((opts) => {
    initStorage(opts.db);
    const app = createApp();
    const port = parseInt(opts.port);

    app.listen(port, () => {
      console.log(`SeaProbe API listening on :${port}`);
      console.log(`  Database: ${opts.db}`);
      console.log(`  Health:   http://localhost:${port}/health`);
      console.log(`  Devices:  http://localhost:${port}/api/devices`);
    });

    process.on("SIGINT", () => {
      console.log("\nShutting down...");
      closeStorage();
      process.exit(0);
    });
  });

/* --- devices --- */
program
  .command("devices")
  .description("List registered devices and their health scores")
  .option("-d, --db <path>", "SQLite database path", "seaprobe.db")
  .action((opts) => {
    initStorage(opts.db);
    const devices = getDevices();

    if (devices.length === 0) {
      console.log("No devices registered.");
      closeStorage();
      return;
    }

    console.log("Devices:\n");
    console.log("  ID                    Health    Last Seen");
    console.log("  ─────────────────────────────────────────────");

    for (const d of devices) {
      const score = calculateHealthScore(d.id);
      const bar = healthBar(score);
      const lastSeen = d.lastSeen ?? "never";
      console.log(`  ${d.id.padEnd(22)} ${bar} ${String(score).padStart(3)}%    ${lastSeen}`);
    }

    closeStorage();
  });

/* --- status --- */
program
  .command("status")
  .description("Quick system status check")
  .option("-d, --db <path>", "SQLite database path", "seaprobe.db")
  .action((opts) => {
    initStorage(opts.db);
    const devices = getDevices();

    const healthy = devices.filter((d) => calculateHealthScore(d.id) >= 70).length;
    const warning = devices.filter((d) => {
      const s = calculateHealthScore(d.id);
      return s >= 30 && s < 70;
    }).length;
    const critical = devices.filter((d) => calculateHealthScore(d.id) < 30).length;

    console.log("SeaProbe Status");
    console.log(`  Devices:  ${devices.length}`);
    console.log(`  Healthy:  ${healthy}`);
    console.log(`  Warning:  ${warning}`);
    console.log(`  Critical: ${critical}`);

    closeStorage();
  });

function healthBar(score: number): string {
  const filled = Math.round(score / 10);
  const empty = 10 - filled;
  const color = score >= 70 ? "\x1b[32m" : score >= 30 ? "\x1b[33m" : "\x1b[31m";
  return `${color}[${"█".repeat(filled)}${"░".repeat(empty)}]\x1b[0m`;
}

program.parse();
