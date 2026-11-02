# Messa in produzione su chezmarthe.org

Architettura: una VM Google Cloud con Docker esegue Postgres, l'app e `cloudflared`.
Il tunnel Cloudflare porta `chezmarthe.org` e `*.chezmarthe.org` all'app: l'HTTPS è gestito
da Cloudflare e la VM non ha porte aperte verso Internet.

In produzione l'AI è spenta (`MARTHE_AI=0`, `VITE_AI=off` in `Dockerfile.prod`):
matching, piani e righe CV usano i testi guidati, i chatbot non compaiono.

L'app rimanda anche:
- `www.chezmarthe.org` → `chezmarthe.org`;
- `chezmarthe.site` e i suoi sottodomini → lo stesso sottodominio su `chezmarthe.org`
  (così i QR già stampati funzionano), finché `chezmarthe.site` resta collegato al tunnel;
- le pagine del vecchio sito (`/contactus`, `/shop/...`) → la home.

## 1. DNS su Cloudflare (le email restano su IONOS)

1. Su [dash.cloudflare.com](https://dash.cloudflare.com) → *Add a domain* → `chezmarthe.org`, piano Free.
2. Cloudflare importa i record esistenti. **Controlla che ci siano tutti** i record
   `MX` (`mx00.ionos.fr`, `mx01.ionos.fr`) e i `TXT` (SPF, DKIM) e `CNAME` delle email di IONOS:
   devono essere in *DNS only* (nuvola grigia). Senza questi le email smettono di arrivare.
3. Nel pannello IONOS → Domini → `chezmarthe.org` → Nameserver → usa nameserver personalizzati:
   inserisci i due nameserver che indica Cloudflare. Il dominio resta registrato su IONOS.
4. Aspetta che Cloudflare segnali il dominio come *Active* (di solito meno di un'ora).

## 2. Tunnel

Su Cloudflare → *Zero Trust* → *Networks* → *Tunnels* → *Create a tunnel* (tipo Cloudflared),
nome `marthe-prod`. Copia il **token** (la stringa dopo `--token`).

Nella scheda *Public hostnames* aggiungi, tutti con servizio `HTTP` → `app:8000`:

| Hostname | Servizio |
| --- | --- |
| `chezmarthe.org` | `http://app:8000` |
| `*.chezmarthe.org` | `http://app:8000` |
| `chezmarthe.site` | `http://app:8000` |
| `*.chezmarthe.site` | `http://app:8000` |

Per `*.chezmarthe.org` Cloudflare potrebbe non creare il record DNS da solo: in tal caso
aggiungi a mano un `CNAME` `*` → `<id-del-tunnel>.cfargotunnel.com`, proxied.
Il vecchio `CNAME www → chezmarthe1.odoo.com` va sostituito dal tunnel.
Per `chezmarthe.site` devi prima spostare le route dal vecchio tunnel `marthe` del portatile.

## 3. VM su Google Cloud

```sh
gcloud compute instances create marthe \
  --zone=europe-west9-a --machine-type=e2-small \
  --image-family=debian-12 --image-project=debian-cloud \
  --boot-disk-size=20GB
gcloud compute ssh marthe --zone=europe-west9-a
```

Sulla VM:

```sh
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && newgrp docker
git clone https://github.com/Emanuelee00/Hackathon_Aim_2026.git marthe   # o via SSH con una deploy key
cd marthe && git checkout deploy
cp deploy/.env.example deploy/.env
nano deploy/.env        # POSTGRES_PASSWORD lunga e casuale (openssl rand -hex 24), TUNNEL_TOKEN
cd deploy && docker compose up -d --build
```

Le migrazioni del database partono da sole all'avvio dell'app.

Primo account dell'équipe:

```sh
docker compose exec app /opt/venv/bin/python -m accounts.create_user email@... "Nome" equipe
```

## Aggiornare

```sh
cd ~/marthe && git pull && cd deploy && docker compose up -d --build
```

## Backup del database

```sh
docker compose exec db pg_dump -U marthe marthe | gzip > marthe-$(date +%F).sql.gz
```

## Prova prima di cambiare il DNS

Prima del passo 1 puoi aggiungere al tunnel solo `chezmarthe.site` e i suoi sottodomini e verificare
tutto lì: con `CANONICAL_DOMAIN` vuoto in `docker-compose.yml` non c'è nessun redirect.
