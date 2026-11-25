# Messa in produzione

Architettura: una VM Google Cloud con Docker esegue Postgres, l'app e Caddy.
Caddy è l'unico servizio raggiungibile da Internet (porte 80 e 443): ottiene da solo i
certificati HTTPS (Let's Encrypt) e passa le richieste all'app. Postgres non è esposto.

In produzione l'AI è spenta (`MARTHE_AI=0`, `VITE_AI=off` in `deploy/Dockerfile.prod`):
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
docker compose exec app /opt/venv/bin/python -m features.accounts.create_user email@... "Nome" equipe
```

## 3. Tappa 2: `chezmarthe.org` (IONOS)

Su IONOS → *Domini & SSL* → `chezmarthe.org` → *DNS*: **aggiungere** questi record e
sostituire solo quello di `www` (oggi un `CNAME` verso Odoo). Tutti gli altri record
(`MX`, `TXT`, `_domainkey`, `_dmarc`, `autodiscover`) servono alle email: **non vanno toccati**.

| Tipo | Nome | Valore |
| --- | --- | --- |
| `A` | `@` | IP della VM (l'unico record con l'indirizzo) |
| `CNAME` | `www` | `chezmarthe.org` |
| `CNAME` | `equipe` | `chezmarthe.org` |
| `CNAME` | `residents` | `chezmarthe.org` |
| `CNAME` | `benevoles` | `chezmarthe.org` |
| `CNAME` | `partenaires` | `chezmarthe.org` |

Il bilan non ha un sottodominio: è la pagina `chezmarthe.org/bilan` (i vecchi link `bilan.<dominio>` vi
vengono rimandati dall'app). Su IONOS, aggiungendo `@` il pannello propone di aggiungere anche `www`: scegliere
« Ne pas ajouter l'enregistrement DNS pour www » finché `www` deve restare sul vecchio sito. Sostituire `www`
per ultimo, quando l'HTTPS degli altri nomi funziona (stato reale e ritorno a Odoo:
`docs-md/DNS-chezmarthe-org.md`).

Mettere il **TTL più basso possibile** (5-10 minuti): un cambio di server si propaga
in fretta. Non toccare il `.env` finché il DNS non risponde: Caddy chiederebbe
certificati per nomi che non puntano ancora alla VM e Let's Encrypt, dopo vari
rifiuti, blocca per un po'. Controllo dal proprio computer:

```sh
dig +short chezmarthe.org          # IP della VM
dig +short www.chezmarthe.org      # IP della VM
dig +short equipe.chezmarthe.org   # IP della VM
```

Poi, in `deploy/.env`, solo `.org`:

```sh
SITE_HOSTS=chezmarthe.org, www.chezmarthe.org, equipe.chezmarthe.org, residents.chezmarthe.org, benevoles.chezmarthe.org, partenaires.chezmarthe.org
CANONICAL_DOMAIN=chezmarthe.org
OLD_DOMAINS=
```

Se dei QR stampati usano ancora `chezmarthe.site` e lo si vuole tenere come redirect
(il dominio non è dell'associazione), puntare anche i suoi record `@` e `*` alla VM
(Cloudflare, *DNS only*) e usare invece:

```sh
SITE_HOSTS=chezmarthe.org, www.chezmarthe.org, equipe.chezmarthe.org, residents.chezmarthe.org, benevoles.chezmarthe.org, partenaires.chezmarthe.org, chezmarthe.site, www.chezmarthe.site, equipe.chezmarthe.site, residents.chezmarthe.site, benevoles.chezmarthe.site, partenaires.chezmarthe.site
CANONICAL_DOMAIN=chezmarthe.org
OLD_DOMAINS=chezmarthe.site
```

e `docker compose up -d`, poi `docker compose logs -f caddy` («certificate obtained» per
ogni nome). L'app rimanda allora:
- `www.chezmarthe.org` → `chezmarthe.org`;
- `chezmarthe.site` e i suoi sottodomini → lo stesso sottodominio su `chezmarthe.org`
  (solo con `OLD_DOMAINS=chezmarthe.site`);
- le pagine del vecchio sito (`/contactus`, `/shop/...`) → la home.

Infine, su Odoo, togliere `www.chezmarthe.org` dalle impostazioni del sito (il vecchio
sito resta su `chezmarthe1.odoo.com`).

Un nuovo spazio (sottodominio) dell'app va aggiunto sia nei record DNS sia in `SITE_HOSTS`.

## Aggiornare

```sh
cd ~/marthe && git pull && cd deploy && docker compose up -d --build
```

## Cambiare server

Tutto è in Docker: sul nuovo server bastano Docker e il repo. Da spostare a mano solo
il database (contiene anche le foto caricate dall'équipe), `deploy/.env` e
`deploy/secrets/`; i certificati HTTPS Caddy li richiede da solo.

```sh
# vecchio server: da qui in poi non usarlo più, altrimenti le nuove scritture si perdono
cd ~/marthe/deploy && docker compose exec db pg_dump -U marthe marthe | gzip > ~/marthe.sql.gz
# copiare ~/marthe.sql.gz, deploy/.env e deploy/secrets/ sul nuovo server

# nuovo server
curl -fsSL https://get.docker.com | sudo sh
git clone https://github.com/Emanuelee00/Hackathon_Aim_2026.git marthe
# rimettere deploy/.env e deploy/secrets/ al loro posto
cd marthe/deploy
docker compose up -d db
gunzip -c ~/marthe.sql.gz | docker compose exec -T db psql -U marthe marthe
docker compose up -d --build
```

Poi sostituire il vecchio IP con il nuovo nel record `A` di `@` su IONOS (gli altri nomi sono
`CNAME` e lo seguono da soli). Abbassare il TTL il giorno prima; spegnere il vecchio server solo dopo
aver verificato home, login équipe e un modulo sul nuovo. Le copie Excel automatiche
(`excel-sauvegarde/`, dentro il container) non si spostano: la fonte resta il sito.

## Backup del database

```sh
docker compose exec db pg_dump -U marthe marthe | gzip > marthe-$(date +%F).sql.gz
```

## Google Agenda (programmation du site et calendrier de l'équipe)

Rien n'est nécessaire pour que le site fonctionne : sans agenda, la section « Nos évènements » affiche « programmation indisponible ».
Pour la brancher :

1. Sur la VM, créer le dossier des clés (hors Git) et y copier les deux fichiers du poste de travail, sans les afficher ni les coller dans un chat :
   `deploy/secrets/google-calendar.json` (clé du compte de service) et `deploy/secrets/calendars.json` (liste des agendas).
2. Dans `deploy/.env`, renseigner `GOOGLE_CALENDAR_ID` (l'identifiant du calendrier partagé avec le compte de service).
3. `docker compose up -d` : seul le conteneur de l'app est recréé.
4. Contrôle : `curl -s https://<le site>/api/programmation` doit répondre avec des évènements (`"events": [...]`).
