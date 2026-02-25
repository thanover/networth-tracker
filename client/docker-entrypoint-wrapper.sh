#!/bin/sh
set -e

# Read the DNS nameserver from /etc/resolv.conf at runtime so the nginx
# resolver directive works in any environment (Railway, Docker, etc.)
NGINX_RESOLVER=$(awk '/^nameserver/ { print $2; exit }' /etc/resolv.conf)
export NGINX_RESOLVER

exec /docker-entrypoint.sh "$@"
