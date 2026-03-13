#ifndef SEAPROBE_REPORTER_H
#define SEAPROBE_REPORTER_H

#include "collector.h"
#include "config.h"

/* POST telemetry JSON to the API endpoint. Returns HTTP status code, or -1 on error. */
int report_telemetry(const probe_config_t *cfg, const telemetry_t *t);

#endif
