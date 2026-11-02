# Messa in produzione

Architettura: una VM Google Cloud con Docker esegue Postgres, l'app e Caddy.
Caddy è l'unico servizio raggiungibile da Internet (porte 80 e 443): ottiene da solo i
certificati HTTPS (Let's Encrypt) e passa le richieste all'app. Postgres non è esposto.

In produzione l'AI è spenta (`MARTHE_AI=0`, `VITE_AI=off` in `Dockerfile.prod`):
matching, piani e righe CV usano i testi guidati, i chatbot non compaiono.

La messa online avviene in due tappe:
1. **`chezmarthe.site`**, il cui DNS è su Cloudflare: si può fare subito.
2. **`chezmarthe.org`**, il cui DNS è su IONOS: serve qualcuno con l'accesso a IONOS.
   Da quel momento `chezmarthe.site` rimanda a `chezmarthe.org`, compresi i QR già stampati.

La VM segue il branch `main`: quello che è su `main` va in produzione al prossimo aggiornamento.

## 1. VM su Google Cloud

Con `gcloud`, da un computer qualsiasi:

```sh
gcloud compute addresses create marthe-ip --region=europe-west9
gcloud compute firewall-rules create marthe-web \
  --allow=tcp:80,tcp:443,udp:443 --target-tags=marthe-web
gcloud compute instances create marthe \
  --zone=europe-west9-a --machine-type=e2-small \
  --image-family=debian-12 --image-project=debian-cloud \
  --boot-disk-size=20GB --address=marthe-ip --tags=marthe-web
# L'IP fisso da mettere nei record DNS:
gcloud compute addresses describe marthe-ip --region=europe-west9 --format='value(address)'
gcloud compute ssh marthe --zone=europe-west9-a
```

Sulla VM:

```sh
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && newgrp docker
git clone https://github.com/Emanuelee00/Hackathon_Aim_2026.git marthe   # o via SSH con una deploy key
cd marthe
cp deploy/.env.example deploy/.env
nano deploy/.env        # POSTGRES_PASSWORD lunga e casuale: openssl rand -hex 24
```

Non avviare ancora: prima i record DNS, altrimenti Let's Encrypt rifiuta i certificati.

## 2. Tappa 1: `chezmarthe.site` (Cloudflare)

Su [dash.cloudflare.com](https://dash.cloudflare.com) → `chezmarthe.site` → *DNS* → *Records*:

1. Cancella i vecchi record del tunnel del portatile (i `CNAME` verso `...cfargotunnel.com`).
2. Aggiungi due record, **nuvola grigia** (*DNS only*), così l'HTTPS lo fa Caddy:

| Tipo | Nome | Valore |
| --- | --- | --- |
| `A` | `@` | IP della VM |
| `A` | `*` | IP della VM |

3. Ferma il vecchio tunnel sul portatile, se è ancora acceso.

Poi sulla VM:

```sh
cd ~/marthe/deploy && docker compose up -d --build
docker compose logs -f caddy     # "certificate obtained successfully" per ogni dominio
```

Le migrazioni del database partono da sole all'avvio dell'app.

Primo account dell'équipe:

```sh
docker compose exec app /opt/venv/bin/python -m accounts.create_user email@... "Nome" equipe
```

## 3. Tappa 2: `chezmarthe.org` (IONOS)

Su IONOS → *Domini & SSL* → `chezmarthe.org` → *DNS*: **aggiungere** questi record e
sostituire solo quello di `www` (oggi un `CNAME` verso Odoo). Tutti gli altri record
(`MX`, `TXT`, `_domainkey`, `_dmarc`, `autodiscover`) servono alle email: **non vanno toccati**.

| Tipo | Nome | Valore |
| --- | --- | --- |
| `A` | `@` | IP della VM |
| `A` | `www` | IP della VM |
| `A` | `equipe` | IP della VM |
| `A` | `residents` | IP della VM |
| `A` | `benevoles` | IP della VM |
| `A` | `partenaires` | IP della VM |
| `A` | `bilan` | IP della VM |

Da qui, quando `dig +short chezmarthe.org` risponde con l'IP della VM, in `deploy/.env`:

```sh
SITE_HOSTS=chezmarthe.org, www.chezmarthe.org, equipe.chezmarthe.org, residents.chezmarthe.org, benevoles.chezmarthe.org, partenaires.chezmarthe.org, bilan.chezmarthe.org, chezmarthe.site, www.chezmarthe.site, equipe.chezmarthe.site, residents.chezmarthe.site, benevoles.chezmarthe.site, partenaires.chezmarthe.site, bilan.chezmarthe.site
CANONICAL_DOMAIN=chezmarthe.org
OLD_DOMAINS=chezmarthe.site
```

e `docker compose up -d`. L'app rimanda allora:
- `www.chezmarthe.org` → `chezmarthe.org`;
- `chezmarthe.site` e i suoi sottodomini → lo stesso sottodominio su `chezmarthe.org`;
- le pagine del vecchio sito (`/contactus`, `/shop/...`) → la home.

Un nuovo spazio (sottodominio) dell'app va aggiunto sia nei record DNS sia in `SITE_HOSTS`.

## Aggiornare

```sh
cd ~/marthe && git pull && cd deploy && docker compose up -d --build
```

## Backup del database

```sh
docker compose exec db pg_dump -U marthe marthe | gzip > marthe-$(date +%F).sql.gz
```
