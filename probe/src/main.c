#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <signal.h>
#include "config.h"
#include "collector.h"
#include "reporter.h"

static volatile int running = 1;

static void handle_signal(int sig)
{
    (void)sig;
    running = 0;
}

static void print_usage(const char *prog)
{
    printf("SeaProbe — Lightweight Device Health Monitor\n\n");
    printf("Usage:\n");
    printf("  %s collect [-c config.ini]     Collect and print telemetry once\n", prog);
    printf("  %s report  [-c config.ini]     Collect and POST to API once\n", prog);
    printf("  %s watch   [-c config.ini]     Loop: collect + report at interval\n", prog);
    printf("  %s version                     Print version\n", prog);
    printf("  %s help                        Show this help\n", prog);
    printf("\nOptions:\n");
    printf("  -c <file>   Config file path (default: seaprobe.ini)\n");
}

static void print_telemetry(const telemetry_t *t)
{
    printf("  CPU Temp:    %.1f °C\n", t->cpu_temp);
    printf("  RAM Used:    %.1f%%\n", t->ram_used_pct);
    printf("  Uptime:      %ld sec\n", t->uptime_sec);
}

int main(int argc, char *argv[])
{
    if (argc < 2) {
        print_usage(argv[0]);
        return 1;
    }

    const char *cmd = argv[1];

    if (strcmp(cmd, "help") == 0 || strcmp(cmd, "--help") == 0 || strcmp(cmd, "-h") == 0) {
        print_usage(argv[0]);
        return 0;
    }

    if (strcmp(cmd, "version") == 0 || strcmp(cmd, "--version") == 0) {
        printf("seaprobe 0.1.0\n");
        return 0;
    }

    /* Parse -c flag */
    const char *config_path = "seaprobe.ini";
    for (int i = 2; i < argc - 1; i++) {
        if (strcmp(argv[i], "-c") == 0) {
            config_path = argv[i + 1];
            break;
        }
    }

    /* Load config */
    probe_config_t cfg;
    if (config_load(config_path, &cfg) != 0) {
        fprintf(stderr, "Failed to load config: %s\n", config_path);
        return 1;
    }

    /* --- collect --- */
    if (strcmp(cmd, "collect") == 0) {
        telemetry_t t;
        collect_telemetry(&t);
        printf("Telemetry:\n");
        print_telemetry(&t);

        char json[1024];
        telemetry_to_json(&t, cfg.device_id, json, sizeof(json));
        printf("  JSON:        %s\n", json);
        return 0;
    }

    /* --- report --- */
    if (strcmp(cmd, "report") == 0) {
        telemetry_t t;
        collect_telemetry(&t);
        printf("Collecting telemetry...\n");
        print_telemetry(&t);

        printf("Reporting to %s ...\n", cfg.api_url);
        int code = report_telemetry(&cfg, &t);
        if (code >= 200 && code < 300)
            printf("  OK (HTTP %d)\n", code);
        else
            printf("  Failed (HTTP %d)\n", code);
        return (code >= 200 && code < 300) ? 0 : 1;
    }

    /* --- watch --- */
    if (strcmp(cmd, "watch") == 0) {
        signal(SIGINT, handle_signal);
        signal(SIGTERM, handle_signal);

        config_print(&cfg);
        printf("Watching every %d seconds (Ctrl+C to stop)...\n\n", cfg.interval_sec);

        while (running) {
            telemetry_t t;
            collect_telemetry(&t);

            char json[1024];
            telemetry_to_json(&t, cfg.device_id, json, sizeof(json));

            int code = report_telemetry(&cfg, &t);
            if (code >= 200 && code < 300)
                printf("[OK]   %s\n", json);
            else
                printf("[FAIL] %s  (HTTP %d)\n", json, code);

            for (int i = 0; i < cfg.interval_sec && running; i++)
                sleep(1);
        }

        printf("\nStopped.\n");
        return 0;
    }

    fprintf(stderr, "Unknown command: %s\n", cmd);
    print_usage(argv[0]);
    return 1;
}
