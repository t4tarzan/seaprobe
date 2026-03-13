#ifndef SEAPROBE_CONFIG_H
#define SEAPROBE_CONFIG_H

typedef struct {
    char api_url[256];
    char device_id[64];
    int  interval_sec;
} probe_config_t;

/* Load config from .ini file. Returns 0 on success, -1 on error. */
int config_load(const char *path, probe_config_t *cfg);

/* Print config to stdout for debugging. */
void config_print(const probe_config_t *cfg);

#endif
