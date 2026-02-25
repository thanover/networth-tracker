#!/bin/sh
set -e

# Read the DNS nameserver from /etc/resolv.conf at runtime so the nginx
# resolver directive works in any environment (Railway, Docker, etc.)
# IPv6 addresses must be wrapped in brackets for nginx's resolver directive.
NS=$(awk '/^nameserver/ { print $2; exit }' /etc/resolv.conf)
case "$NS" in
  *:*) NGINX_RESOLVER="[$NS]" ;;  # IPv6
  *)   NGINX_RESOLVER="$NS"   ;;  # IPv4
esac
export NGINX_RESOLVER

exec /docker-entrypoint.sh "$@"
