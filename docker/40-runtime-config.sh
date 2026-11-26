#!/bin/sh
# Runs at container start (nginx image runs /docker-entrypoint.d/*.sh before nginx).
# Writes every APP_<KEY>=value env var to runtime-config.js as window.APP_ENV = { KEY: "value" }.
# src/config.js reads that object and falls back to its own defaults for anything missing.
set -e

OUT=/usr/share/nginx/html/runtime-config.js

{
    echo "window.APP_ENV = {"
    env | grep -E '^APP_[A-Z0-9_]+=' | sort | while IFS='=' read -r name value; do
        key=${name#APP_}
        escaped=$(printf '%s' "$value" | sed 's/\\/\\\\/g; s/"/\\"/g')
        printf '    "%s": "%s",\n' "$key" "$escaped"
    done
    echo "};"
} > "$OUT"

echo "runtime-config: wrote $OUT"
