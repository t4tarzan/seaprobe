#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "collector.h"

#ifdef __linux__

int collect_telemetry(telemetry_t *t)
{
    FILE *fp;
    char buf[256];

    /* CPU temperature */
    fp = fopen("/sys/class/thermal/thermal_zone0/temp", "r");
    if (fp) {
        if (fgets(buf, sizeof(buf), fp))
            t->cpu_temp = atof(buf) / 1000.0f;
        fclose(fp);
    } else {
        t->cpu_temp = -1.0f;
    }

    /* RAM usage from /proc/meminfo */
    fp = fopen("/proc/meminfo", "r");
    if (fp) {
        long mem_total = 0, mem_available = 0;
        while (fgets(buf, sizeof(buf), fp)) {
            if (strncmp(buf, "MemTotal:", 9) == 0)
                sscanf(buf, "MemTotal: %ld", &mem_total);
            else if (strncmp(buf, "MemAvailable:", 13) == 0)
                sscanf(buf, "MemAvailable: %ld", &mem_available);
        }
        fclose(fp);
        if (mem_total > 0)
            t->ram_used_pct = 100.0f * (1.0f - (float)mem_available / (float)mem_total);
        else
            t->ram_used_pct = -1.0f;
    } else {
        t->ram_used_pct = -1.0f;
    }

    /* Uptime from /proc/uptime */
    fp = fopen("/proc/uptime", "r");
    if (fp) {
        double up = 0;
        if (fscanf(fp, "%lf", &up) == 1)
            t->uptime_sec = (long)up;
        fclose(fp);
    } else {
        t->uptime_sec = -1;
    }

    return 0;
}

#elif defined(__APPLE__)

#include <sys/sysctl.h>
#include <mach/mach.h>
#include <time.h>

int collect_telemetry(telemetry_t *t)
{
    /* CPU temp: not available via sysctl on macOS without IOKit, use placeholder */
    t->cpu_temp = -1.0f;

    /* RAM usage via mach API */
    mach_port_t host = mach_host_self();
    vm_size_t page_size;
    vm_statistics64_data_t vm_stat;
    mach_msg_type_number_t count = HOST_VM_INFO64_COUNT;

    host_page_size(host, &page_size);
    if (host_statistics64(host, HOST_VM_INFO64, (host_info64_t)&vm_stat, &count) == KERN_SUCCESS) {
        long long used = ((long long)vm_stat.active_count + vm_stat.wire_count) * page_size;
        long long total_mem = 0;
        size_t len = sizeof(total_mem);
        sysctlbyname("hw.memsize", &total_mem, &len, NULL, 0);
        if (total_mem > 0)
            t->ram_used_pct = 100.0f * (float)used / (float)total_mem;
        else
            t->ram_used_pct = -1.0f;
    } else {
        t->ram_used_pct = -1.0f;
    }

    /* Uptime via sysctl */
    struct timeval boottime;
    size_t sz = sizeof(boottime);
    int mib[2] = { CTL_KERN, KERN_BOOTTIME };
    if (sysctl(mib, 2, &boottime, &sz, NULL, 0) == 0) {
        time_t now = time(NULL);
        t->uptime_sec = (long)(now - boottime.tv_sec);
    } else {
        t->uptime_sec = -1;
    }

    return 0;
}

#else
/* Fallback: return placeholder values */
int collect_telemetry(telemetry_t *t)
{
    t->cpu_temp = -1.0f;
    t->ram_used_pct = -1.0f;
    t->uptime_sec = -1;
    return 0;
}
#endif

int telemetry_to_json(const telemetry_t *t, const char *device_id, char *buf, int bufsize)
{
    return snprintf(buf, bufsize,
        "{"
        "\"deviceId\":\"%s\","
        "\"cpuTemp\":%.1f,"
        "\"ramUsedPct\":%.1f,"
        "\"uptimeSec\":%ld"
        "}",
        device_id, t->cpu_temp, t->ram_used_pct, t->uptime_sec);
}
