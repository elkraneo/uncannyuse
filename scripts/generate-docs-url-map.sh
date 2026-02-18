#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FEATURES_JSON="$ROOT_DIR/src/data/features/realitykit-components.json"
OUTPUT_JSON="$ROOT_DIR/src/data/mappings/realitykit-docs-url-map.json"
OUTPUT_MD="$ROOT_DIR/src/data/mappings/realitykit-docs-url-map-report.md"
INSPECTOR_BIN="${INSPECTOR_BIN:-/Volumes/Plutonian/_Developer/Smith-Tools/smith-doc-inspector/.build/debug/smith-doc-inspector}"

if [[ ! -x "$INSPECTOR_BIN" ]]; then
  echo "Error: smith-doc-inspector binary not found at $INSPECTOR_BIN" >&2
  exit 1
fi

if [[ ! -f "$FEATURES_JSON" ]]; then
  echo "Error: features file not found at $FEATURES_JSON" >&2
  exit 1
fi

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

rows_file="$tmp_dir/rows.ndjson"

jq -r '.features[] | [.id, .name] | @tsv' "$FEATURES_JSON" | while IFS=$'\t' read -r id name; do
  symbol_path="$(echo "$name" | tr '[:upper:]' '[:lower:]' | tr '.' '/')"
  docs_url="https://developer.apple.com/documentation/realitykit/$symbol_path"

  resolved_json="$("$INSPECTOR_BIN" resolve "$docs_url" --format json 2>/dev/null || true)"
  json_url="$(echo "$resolved_json" | jq -r '.[0].json_url // empty' 2>/dev/null || true)"
  handler="$(echo "$resolved_json" | jq -r '.[0].handler // empty' 2>/dev/null || true)"
  route_status="$(echo "$resolved_json" | jq -r '.[0].status // "error"' 2>/dev/null || echo "error")"
  route_error="$(echo "$resolved_json" | jq -r '.[0].error // empty' 2>/dev/null || true)"

  verified=false
  title=""
  summary=""
  verify_error=""
  if doc_text="$("$INSPECTOR_BIN" docs "$docs_url" --format text --limit 420 2>/dev/null)"; then
    verified=true
    title="$(printf '%s\n' "$doc_text" | sed -n '1s/^# //p' | head -n 1)"
    summary="$(printf '%s\n' "$doc_text" | sed -n '2p' | sed 's/^[[:space:]]*//')"
  else
    verify_error="fetch_failed"
  fi

  jq -n \
    --arg id "$id" \
    --arg name "$name" \
    --arg docsUrl "$docs_url" \
    --arg jsonUrl "$json_url" \
    --arg handler "$handler" \
    --arg routeStatus "$route_status" \
    --arg routeError "$route_error" \
    --arg title "$title" \
    --arg summary "$summary" \
    --arg verifyError "$verify_error" \
    --arg verifiedAt "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --argjson verified "$verified" \
    '{
      id: $id,
      name: $name,
      docsUrl: $docsUrl,
      jsonUrl: $jsonUrl,
      handler: $handler,
      routeStatus: $routeStatus,
      routeError: (if $routeError == "" then null else $routeError end),
      verified: $verified,
      verifyError: (if $verifyError == "" then null else $verifyError end),
      title: (if $title == "" then null else $title end),
      summary: (if $summary == "" then null else $summary end),
      lastVerifiedAt: $verifiedAt
    }' >> "$rows_file"
done

jq -s '.' "$rows_file" > "$OUTPUT_JSON"

total_count="$(jq 'length' "$OUTPUT_JSON")"
verified_count="$(jq '[.[] | select(.verified == true)] | length' "$OUTPUT_JSON")"
failed_count="$(( total_count - verified_count ))"

{
  echo "# RealityKit Docs URL Verification Report"
  echo
  echo "- generated_at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "- total: $total_count"
  echo "- verified: $verified_count"
  echo "- failed: $failed_count"
  echo "- inspector: $INSPECTOR_BIN"
  echo
  if [[ "$failed_count" -gt 0 ]]; then
    echo "## Failed Items"
    echo
    jq -r '.[] | select(.verified == false) | "- \(.id) (\(.name)): \(.verifyError // "unknown_error")"' "$OUTPUT_JSON"
  else
    echo "All component docs URLs verified successfully."
  fi
} > "$OUTPUT_MD"

echo "Wrote: $OUTPUT_JSON"
echo "Wrote: $OUTPUT_MD"
