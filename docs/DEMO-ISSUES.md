# Demo Issues — File These for Pipeline Video

## Issue 1: BUG — Probe crashes on missing config file

**Title:** `probe segfaults when config file doesn't exist`

**Body:**
```
Running `./seaprobe collect -c nonexistent.ini` causes a segmentation fault.

The probe should gracefully fall back to defaults when the config file is missing,
not crash. This makes deployment fragile — if someone typos the config path,
the binary just dies with no error message.

File: probe/src/config.c
Expected: print a warning and use defaults
Actual: SIGSEGV
```

**Labels:** `bug`, `probe`, `c`

---

## Issue 2: BUG — Health score returns NaN for new devices

**Title:** `GET /api/devices/:id returns NaN healthScore for devices with no telemetry`

**Body:**
```
When a device is registered but hasn't sent any telemetry yet,
the health score calculation divides by zero and returns NaN.

This breaks the JSON response (NaN is not valid JSON) and causes
the dashboard to show "—" even for registered devices.

Steps to reproduce:
1. POST /api/devices with { id: "test", name: "Test Device" }
2. GET /api/devices/test
3. Response: { healthScore: NaN } — invalid

File: api/src/services/health-score.ts
Expected: return 0 (or a sensible default) when no telemetry exists
Actual: NaN from division by zero
```

**Labels:** `bug`, `api`, `typescript`

---

## Issue 3: FEATURE — Add disk usage to probe telemetry

**Title:** `add disk usage percentage to telemetry payload`

**Body:**
```
The probe currently reports CPU temp, RAM usage, and uptime.
Disk usage is missing — it's one of the most important metrics
for edge devices that fill up their SD cards.

Requirements:
- probe/src/collector.c: read disk usage for "/" filesystem
- probe/include/collector.h: add disk_used_pct to telemetry_t struct
- probe/src/collector.c: include disk in telemetry_to_json output
- api/src/types.ts: add diskUsedPct to TelemetryPayload
- api/src/services/storage.ts: store disk_used_pct in telemetry table
- api/src/services/health-score.ts: factor disk usage into score

Cross-layer change: C binary + TypeScript API.
```

**Labels:** `feature`, `probe`, `api`, `cross-layer`

---

## Issue 4: FEATURE — Auto-refresh device list in dashboard

**Title:** `device list should auto-refresh every 10 seconds`

**Body:**
```
The dashboard device list only loads once on mount.
If a new device registers or a health score changes,
the user has to manually reload the page to see it.

Requirements:
- Add a 10-second polling interval to DeviceList.tsx
- Show a subtle "last updated X seconds ago" indicator
- Clean up the interval on unmount to prevent memory leaks
- Optionally show a manual refresh button

File: dashboard/src/pages/DeviceList.tsx
```

**Labels:** `feature`, `dashboard`, `react`
