/*
 * test_config.c — Unit tests for config_load() in probe/src/config.c
 *
 * Tests for issue #1: probe segfaults when config file doesn't exist
 *
 * Build (no libcurl needed — only links config.c):
 *   gcc -std=c11 -I include -o test_config tests/test_config.c src/config.c
 *
 * Run:
 *   ./test_config
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/stat.h>
#include "config.h"

/* ---------- tiny test framework ------------------------------------------ */

static int tests_run    = 0;
static int tests_passed = 0;
static int tests_failed = 0;

#define ASSERT(desc, expr)                                             \
    do {                                                               \
        tests_run++;                                                   \
        if (expr) {                                                    \
            printf("  PASS  %s\n", desc);                             \
            tests_passed++;                                            \
        } else {                                                       \
            printf("  FAIL  %s  [line %d]\n", desc, __LINE__);       \
            tests_failed++;                                            \
        }                                                              \
    } while (0)

/* ---------- helper -------------------------------------------------------- */

/* Write content to a temp file, returning the path (caller must unlink). */
static const char *write_tmp(const char *filename, const char *content)
{
    FILE *f = fopen(filename, "w");
    if (!f) { perror("fopen tmp"); exit(1); }
    fputs(content, f);
    fclose(f);
    return filename;
}

/* ---------- tests --------------------------------------------------------- */

/* TC-1: Missing config file must NOT segfault and must return 0 (use defaults). */
static void test_missing_file_no_segfault(void)
{
    puts("\n[TC-1] Missing config file — no segfault, returns 0, uses defaults");

    probe_config_t cfg;
    memset(&cfg, 0, sizeof(cfg));

    int ret = config_load("/tmp/seaprobe_no_such_file_xyz.ini", &cfg);

    ASSERT("config_load returns 0 for missing file",   ret == 0);
    ASSERT("api_url default set",   strcmp(cfg.api_url,   "http://localhost:4000") == 0);
    ASSERT("device_id default set", strcmp(cfg.device_id, "probe-001")             == 0);
    ASSERT("interval_sec default",  cfg.interval_sec == 10);
}

/* TC-2: Valid config file is parsed correctly. */
static void test_valid_config_parsed(void)
{
    puts("\n[TC-2] Valid config file — values parsed correctly");

    const char *path = "/tmp/seaprobe_test_valid.ini";
    write_tmp(path,
        "api_url=http://api.example.com:8080\n"
        "device_id=test-device-42\n"
        "interval=30\n");

    probe_config_t cfg;
    memset(&cfg, 0, sizeof(cfg));
    int ret = config_load(path, &cfg);

    ASSERT("config_load returns 0",
           ret == 0);
    ASSERT("api_url parsed correctly",
           strcmp(cfg.api_url, "http://api.example.com:8080") == 0);
    ASSERT("device_id parsed correctly",
           strcmp(cfg.device_id, "test-device-42") == 0);
    ASSERT("interval parsed correctly",
           cfg.interval_sec == 30);

    unlink(path);
}

/* TC-3: Empty config file — defaults should be used. */
static void test_empty_file_uses_defaults(void)
{
    puts("\n[TC-3] Empty config file — defaults used");

    const char *path = "/tmp/seaprobe_test_empty.ini";
    write_tmp(path, "");

    probe_config_t cfg;
    memset(&cfg, 0, sizeof(cfg));
    int ret = config_load(path, &cfg);

    ASSERT("config_load returns 0",   ret == 0);
    ASSERT("api_url default",   strcmp(cfg.api_url,   "http://localhost:4000") == 0);
    ASSERT("device_id default", strcmp(cfg.device_id, "probe-001")             == 0);
    ASSERT("interval_sec default", cfg.interval_sec == 10);

    unlink(path);
}

/* TC-4: Config file with only comments and blank lines — defaults used. */
static void test_comments_only_uses_defaults(void)
{
    puts("\n[TC-4] Config file with only comments — defaults used");

    const char *path = "/tmp/seaprobe_test_comments.ini";
    write_tmp(path,
        "# This is a comment\n"
        "; Another comment style\n"
        "\n"
        "# trailing comment\n");

    probe_config_t cfg;
    memset(&cfg, 0, sizeof(cfg));
    int ret = config_load(path, &cfg);

    ASSERT("config_load returns 0",   ret == 0);
    ASSERT("api_url default",   strcmp(cfg.api_url,   "http://localhost:4000") == 0);
    ASSERT("device_id default", strcmp(cfg.device_id, "probe-001")             == 0);
    ASSERT("interval_sec default", cfg.interval_sec == 10);

    unlink(path);
}

/* TC-5: Partial config (only some keys present) — rest stay as defaults. */
static void test_partial_config(void)
{
    puts("\n[TC-5] Partial config (interval only) — other fields use defaults");

    const char *path = "/tmp/seaprobe_test_partial.ini";
    write_tmp(path, "interval=60\n");

    probe_config_t cfg;
    memset(&cfg, 0, sizeof(cfg));
    int ret = config_load(path, &cfg);

    ASSERT("config_load returns 0",   ret == 0);
    ASSERT("interval overridden",     cfg.interval_sec == 60);
    ASSERT("api_url remains default", strcmp(cfg.api_url,   "http://localhost:4000") == 0);
    ASSERT("device_id remains default", strcmp(cfg.device_id, "probe-001")           == 0);

    unlink(path);
}

/* TC-6: Malformed lines (no '=') are silently skipped. */
static void test_malformed_lines_skipped(void)
{
    puts("\n[TC-6] Malformed lines skipped, valid keys still parsed");

    const char *path = "/tmp/seaprobe_test_malformed.ini";
    write_tmp(path,
        "this_has_no_equals_sign\n"
        "interval=5\n"
        "also bad\n");

    probe_config_t cfg;
    memset(&cfg, 0, sizeof(cfg));
    int ret = config_load(path, &cfg);

    ASSERT("config_load returns 0",  ret == 0);
    ASSERT("interval still parsed",  cfg.interval_sec == 5);

    unlink(path);
}

/* TC-7: config_load called with NULL path — must not crash (defensive).
 * Note: fopen(NULL, "r") is undefined behaviour in C11, so we check that
 * the fix (fp == NULL guard) handles it gracefully in practice on Linux
 * where glibc's fopen(NULL) returns NULL. */
static void test_null_path_graceful(void)
{
    puts("\n[TC-7] NULL path — fopen returns NULL, guard catches it");

    probe_config_t cfg;
    memset(&cfg, 0, sizeof(cfg));

    /* On Linux, fopen(NULL, "r") returns NULL (EFAULT), so the guard fires. */
    int ret = config_load(NULL, &cfg);

    /* We only assert return value here; UB note is intentional for awareness. */
    ASSERT("config_load returns 0 for NULL path", ret == 0);
}

/* TC-8: Unreadable file (mode 000) — fopen returns NULL, guard fires. */
static void test_unreadable_file_no_crash(void)
{
    puts("\n[TC-8] Unreadable file (chmod 000) — no crash, defaults used");

    /* Skip if running as root (root ignores file permissions). */
    if (getuid() == 0) {
        printf("  SKIP  (running as root — permission checks don't apply)\n");
        return;
    }

    const char *path = "/tmp/seaprobe_test_noperms.ini";
    write_tmp(path, "interval=99\n");
    chmod(path, 0000);

    probe_config_t cfg;
    memset(&cfg, 0, sizeof(cfg));
    int ret = config_load(path, &cfg);

    ASSERT("config_load returns 0",    ret == 0);
    ASSERT("interval stays default",   cfg.interval_sec == 10);

    chmod(path, 0644);
    unlink(path);
}

/* TC-9: api_url buffer boundary — value exactly at max (255 chars). */
static void test_api_url_boundary(void)
{
    puts("\n[TC-9] api_url exactly 255 characters — no buffer overflow");

    /* Build a value of exactly 255 chars (sizeof(api_url)-1) */
    char long_url[260];
    memset(long_url, 'x', 255);
    long_url[255] = '\0';

    char content[300];
    snprintf(content, sizeof(content), "api_url=%s\n", long_url);

    const char *path = "/tmp/seaprobe_test_boundary.ini";
    write_tmp(path, content);

    probe_config_t cfg;
    memset(&cfg, 0, sizeof(cfg));
    int ret = config_load(path, &cfg);

    ASSERT("config_load returns 0",              ret == 0);
    /* The sscanf %255s will read at most 255 chars, so buffer safe. */
    ASSERT("api_url buffer not overflowed",      cfg.api_url[255] == '\0');

    unlink(path);
}

/* ---------- main ---------------------------------------------------------- */

int main(void)
{
    puts("============================================");
    puts(" SeaProbe config_load() test suite");
    puts(" Issue #1: segfault on missing config file");
    puts("============================================");

    test_missing_file_no_segfault();
    test_valid_config_parsed();
    test_empty_file_uses_defaults();
    test_comments_only_uses_defaults();
    test_partial_config();
    test_malformed_lines_skipped();
    test_null_path_graceful();
    test_unreadable_file_no_crash();
    test_api_url_boundary();

    puts("\n============================================");
    printf(" Results: %d/%d passed", tests_passed, tests_run);
    if (tests_failed)
        printf(", %d FAILED", tests_failed);
    puts("\n============================================");

    return tests_failed ? 1 : 0;
}
