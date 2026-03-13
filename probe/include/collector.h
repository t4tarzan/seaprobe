#ifndef SEAPROBE_COLLECTOR_H
#define SEAPROBE_COLLECTOR_H

typedef struct {
    float cpu_temp;       /* Celsius */
    float ram_used_pct;   /* 0.0 - 100.0 */
    long  uptime_sec;     /* Seconds since boot */
    /* TODO: disk_used_pct not yet implemented */
} telemetry_t;

/* Collect current system telemetry. Returns 0 on success. */
int collect_telemetry(telemetry_t *t);

/* Format telemetry as JSON string into buf. Returns bytes written. */
int telemetry_to_json(const telemetry_t *t, const char *device_id, char *buf, int bufsize);

#endif
