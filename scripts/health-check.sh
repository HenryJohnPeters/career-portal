#!/usr/bin/env bash
# Post-deploy smoke check for the API and web services.
#
#   ./scripts/health-check.sh https://api.example.com https://example.com
#   API_URL=... WEB_URL=... ./scripts/health-check.sh
#
# Exits non-zero if any check fails.
set -uo pipefail

API_URL="${1:-${API_URL:-}}"
WEB_URL="${2:-${WEB_URL:-}}"
if [ -z "$API_URL" ] || [ -z "$WEB_URL" ]; then
  echo "Usage: $0 <api-url> <web-url>" >&2
  exit 2
fi
API_URL="${API_URL%/}"
WEB_URL="${WEB_URL%/}"

failures=0

# check <description> <expected-status> <curl args...>
check() {
  local description="$1" expected="$2"
  shift 2
  local status
  # curl prints 000 itself when the request fails.
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$@")
  if [ "$status" = "$expected" ]; then
    echo "ok    $description ($status)"
  else
    echo "FAIL  $description (expected $expected, got $status)"
    failures=$((failures + 1))
  fi
}

check "API liveness        GET /health/live" 200 "$API_URL/health/live"
check "API + database      GET /health" 200 "$API_URL/health"
check "API auth required   GET /auth/me" 401 "$API_URL/auth/me"
# Stripe calls without an Origin header: must reach the controller (400), never a CORS 500.
check "Stripe webhook path POST /billing/webhook" 400 -X POST "$API_URL/billing/webhook"
check "Web liveness        GET /healthz" 200 "$WEB_URL/healthz"
check "Web app shell       GET /" 200 "$WEB_URL/"
check "Web SPA route       GET /app/dashboard" 200 "$WEB_URL/app/dashboard"
check "Missing asset 404   GET /assets/missing.js" 404 "$WEB_URL/assets/missing.js"
check "Web robots.txt      GET /robots.txt" 200 "$WEB_URL/robots.txt"

# Every same-origin file the app shell references must be served: the bundles and
# the apps/web/public files (theme-init.js, the Inter font, favicons). A 404 here
# means the build lost files, e.g. to the root .dockerignore (Nixpacks uses it too).
shell_refs=$(curl -s --max-time 15 "$WEB_URL/" | grep -oE '(src|href)="/[^/"][^"]*"' | cut -d'"' -f2 | sort -u)
if grep -qx /theme-init.js <<< "$shell_refs"; then
  for ref in $shell_refs; do
    check "Web shell file      GET $ref" 200 "$WEB_URL$ref"
  done
else
  echo "FAIL  Web app shell does not reference /theme-init.js (could not read $WEB_URL/)"
  failures=$((failures + 1))
fi

# The web origin must be allowed by the API's CORS (CLIENT_URL / CORS_ORIGINS).
allow_origin=$(curl -s -o /dev/null -D - --max-time 15 -X OPTIONS \
  -H "Origin: $WEB_URL" -H "Access-Control-Request-Method: GET" \
  "$API_URL/auth/me" | tr -d '\r' | awk -F': ' 'tolower($1)=="access-control-allow-origin" {print $2}')
if [ "$allow_origin" = "$WEB_URL" ]; then
  echo "ok    CORS allows $WEB_URL"
else
  echo "FAIL  CORS does not allow $WEB_URL (check CLIENT_URL / CORS_ORIGINS on the API)"
  failures=$((failures + 1))
fi

if [ "$failures" -gt 0 ]; then
  echo "$failures check(s) failed"
  exit 1
fi
echo "All checks passed"
