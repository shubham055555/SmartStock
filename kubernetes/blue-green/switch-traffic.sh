#!/usr/bin/env bash
# ==============================================================================
# SmartStock Zero-Downtime Blue-Green Traffic Switch Script
# Usage: ./switch-traffic.sh [blue|green]
# ==============================================================================

set -euo pipefail

TARGET_COLOR="${1:-}"

if [[ -z "$TARGET_COLOR" || ( "$TARGET_COLOR" != "blue" && "$TARGET_COLOR" != "green" ) ]]; then
    echo "❌ Usage: $0 [blue|green]"
    exit 1
fi

NAMESPACE="smartstock"
SERVICE_NAME="smartstock-backend-live"

echo "🔄 Initiating zero-downtime traffic switch to version: ${TARGET_COLOR}..."

# Verify target deployment pods are ready
echo "🔍 Checking ${TARGET_COLOR} pod readiness..."
kubectl wait --for=condition=Available deployment/smartstock-backend-${TARGET_COLOR} -n "$NAMESPACE" --timeout=60s

# Patch service selector to route 100% of traffic to the chosen version
echo "🔀 Patching live service selector to 'version=${TARGET_COLOR}'..."
kubectl patch service "$SERVICE_NAME" -n "$NAMESPACE" -p "{\"spec\":{\"selector\":{\"version\":\"${TARGET_COLOR}\"}}}"

echo "✅ Traffic successfully routed to ${TARGET_COLOR} version!"
echo "Status of live service endpoints:"
kubectl get endpoints "$SERVICE_NAME" -n "$NAMESPACE"
