#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <curl/curl.h>
#include "reporter.h"

/* Discard response body */
static size_t discard_cb(void *ptr, size_t size, size_t nmemb, void *userdata)
{
    (void)ptr; (void)userdata;
    return size * nmemb;
}

int report_telemetry(const probe_config_t *cfg, const telemetry_t *t)
{
    char json[1024];
    char url[512];
    int  http_code = -1;

    telemetry_to_json(t, cfg->device_id, json, sizeof(json));
    snprintf(url, sizeof(url), "%s/api/telemetry", cfg->api_url);

    CURL *curl = curl_easy_init();
    if (!curl)
        return -1;

    struct curl_slist *headers = NULL;
    headers = curl_slist_append(headers, "Content-Type: application/json");

    curl_easy_setopt(curl, CURLOPT_URL, url);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, json);
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, discard_cb);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 5L);
    curl_easy_setopt(curl, CURLOPT_CONNECTTIMEOUT, 3L);

    CURLcode res = curl_easy_perform(curl);
    if (res == CURLE_OK) {
        long code;
        curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &code);
        http_code = (int)code;
    } else {
        fprintf(stderr, "Report failed: %s\n", curl_easy_strerror(res));
    }

    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);
    return http_code;
}
