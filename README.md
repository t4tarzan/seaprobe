# SeaProbe — Lightweight Device Health Monitor

A multi-layer CLI tool: C probe binary + Express API + React dashboard.

Built to showcase the [SeaClip](https://github.com/t4tarzan/seaclip-v1) 6-agent pipeline (Charlie → Peter → David → Tina → Suzy → Matthews) fixing real bugs and building features across C, TypeScript, and React.

## Architecture

```
┌─────────────┐        ┌──────────────┐        ┌──────────────┐
│  C Probe    │──POST──│  Express API │──REST──│  React       │
│  CLI binary │  JSON  │  CLI + server│  JSON  │  Dashboard   │
│  probe/     │        │  api/        │        │  dashboard/  │
└─────────────┘        └──────────────┘        └──────────────┘
```

## CLI Usage

### Probe (C binary)
```bash
cd probe && make

./seaprobe help                    # Show commands
./seaprobe version                 # Print version
./seaprobe collect                 # Collect telemetry once, print to stdout
./seaprobe collect -c my.ini       # Use custom config file
./seaprobe report                  # Collect + POST to API once
./seaprobe watch                   # Loop: collect + report every N seconds
```

### API (Node CLI)
```bash
cd api && npm install

npx tsx src/cli.ts serve              # Start API server on :4000
npx tsx src/cli.ts serve -p 8080      # Custom port
npx tsx src/cli.ts devices            # List devices + health scores
npx tsx src/cli.ts status             # Quick system status summary
```

### Dashboard
```bash
cd dashboard && npm install && npm run dev
# Opens on :5173, proxies to API at :4000
```

## Config (probe)

`seaprobe.ini`:
```ini
api_url=http://localhost:4000
device_id=probe-001
interval=10
```

## Known Issues

See `docs/DEMO-ISSUES.md` for the 4 issues designed to be fixed by the agent pipeline:
- 2 bugs (C segfault, API NaN)
- 2 features (disk usage, auto-refresh)

## License

MIT
