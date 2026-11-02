#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL in Render Environment.}"
: "${DB_SSL_CA_FILE:?Set DB_SSL_CA_FILE to /etc/secrets/mysql-ca.pem.}"
if [ ! -r "$DB_SSL_CA_FILE" ]; then
  echo "Add your Aiven CA certificate as the Render secret file mysql-ca.pem." >&2
  exit 1
fi
export APP_URL="${APP_URL:-${RENDER_EXTERNAL_URL:-}}"
: "${APP_URL:?Set APP_URL to the public HTTPS URL of this service.}"
export HOSTNAME=0.0.0.0

# Single-instance demo deployment. Use a pre-deploy migration job when scaling.
npm run db:deploy
exec node .next/standalone/server.js
