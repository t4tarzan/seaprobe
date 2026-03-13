#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "config.h"

/*
 * BUG: No null check on fopen() return value.
 * If the config file doesn't exist, fopen returns NULL and
 * the subsequent fgets() call will segfault.
 *
 * Steps to reproduce:
 *   ./seaprobe -c nonexistent.ini
 *   → Segmentation fault (core dumped)
 */
int config_load(const char *path, probe_config_t *cfg)
{
    char line[512];

    /* Set defaults */
    strncpy(cfg->api_url, "http://localhost:4000", sizeof(cfg->api_url) - 1);
    strncpy(cfg->device_id, "probe-001", sizeof(cfg->device_id) - 1);
    cfg->interval_sec = 10;

    FILE *fp = fopen(path, "r");
    /* BUG: missing null check — crashes if file doesn't exist */

    while (fgets(line, sizeof(line), fp)) {
        /* Strip newline */
        line[strcspn(line, "\n")] = 0;

        /* Skip comments and empty lines */
        if (line[0] == '#' || line[0] == ';' || line[0] == '\0')
            continue;

        char key[64], value[256];
        if (sscanf(line, "%63[^=]=%255s", key, value) == 2) {
            /* Trim leading spaces from key */
            char *k = key;
            while (*k == ' ') k++;

            if (strcmp(k, "api_url") == 0)
                strncpy(cfg->api_url, value, sizeof(cfg->api_url) - 1);
            else if (strcmp(k, "device_id") == 0)
                strncpy(cfg->device_id, value, sizeof(cfg->device_id) - 1);
            else if (strcmp(k, "interval") == 0)
                cfg->interval_sec = atoi(value);
        }
    }

    fclose(fp);
    return 0;
}

void config_print(const probe_config_t *cfg)
{
    printf("Config:\n");
    printf("  api_url:  %s\n", cfg->api_url);
    printf("  device:   %s\n", cfg->device_id);
    printf("  interval: %d sec\n", cfg->interval_sec);
}
