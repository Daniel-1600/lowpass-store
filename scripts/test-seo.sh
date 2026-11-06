#!/bin/sh
# Starts the production build and runs the SEO check against it. Expects the backend to be running.
node .output/server/index.mjs &
server=$!
trap 'kill "$server"' EXIT

for _ in $(seq 1 30); do
  curl -sf -o /dev/null http://localhost:3000/robots.txt && break
  sleep 1
done

node scripts/check-seo.mjs http://localhost:3000
