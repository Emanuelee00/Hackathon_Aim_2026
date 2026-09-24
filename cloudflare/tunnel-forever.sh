#!/usr/bin/env bash
# Tiene su il tunnel chezmarthe.site: rilancia cloudflared quando si ferma, e lo
# uccide e rilancia quando resta senza connessioni verso Cloudflare per ~1 minuto
# (es. dopo che il portatile si è addormentato o ha cambiato rete).
set -u
cd "$(dirname "$0")/.."

METRICS=${TUNNEL_METRICS:-127.0.0.1:20299}
pid=
trap '[ -n "$pid" ] && kill "$pid" 2>/dev/null; exit 130' INT TERM

while true; do
	echo "$(date '+%F %T') avvio del tunnel"
	cloudflared tunnel --config cloudflare/tunnel.yml --metrics "$METRICS" run marthe &
	pid=$!
	sleep 20
	fails=0
	while kill -0 "$pid" 2>/dev/null; do
		if curl -fs -m 5 "http://$METRICS/ready" >/dev/null; then
			fails=0
		else
			fails=$((fails + 1))
		fi
		if [ "$fails" -ge 6 ]; then
			echo "$(date '+%F %T') tunnel senza connessioni, lo rilancio"
			kill "$pid"
			break
		fi
		sleep 10
	done
	wait "$pid"
	echo "$(date '+%F %T') tunnel fermato, riavvio tra 5 s..."
	sleep 5
done
