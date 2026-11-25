# Contesto di lavoro — Chez Marthe

Scritto il **12 novembre 2026**, aggiornato il **16 novembre 2026** (pacchetti 6 e 7). Serve a riprendere il lavoro
da un'altra sessione di Claude o da un altro computer senza perdere il filo. Letto insieme a `TODO.md` (backlog dettagliato, in francese) e `deploy/README.md` (server).

> Il repo è **pubblico**. Qui non vanno mai password, chiavi, token, `deploy/.env` o `secrets/`.

## 1. Cos'è

Piattaforma di Chez Marthe (lieu a Saint-Savournin, Marsiglia). Il repo è `Emanuelee00/Hackathon_Aim_2026`.
Ha il **sito pubblico** (home, Notre équipe, On parle de nous, Connexion, Contact), lo **spazio équipe**
(Financements, Financeurs potentiels, Messages, Factures et devis, Bilans des structures, Site, calendrier, ecc.)
e lo **spazio associazioni** (`partenaires`: agenda comune e bilancio mensile). Backend Python in `backend/` (FastAPI, entry point `main.py` alla root), front-end React in `frontend/`,
Postgres. Il nuovo sito sostituirà il vecchio sito Odoo (`chezmarthe1.odoo.com`) su `chezmarthe.org`.
L'AI è spenta in produzione (`MARTHE_AI=0`, `VITE_AI=off`).

## 2. Come sto lavorando (il flusso)

Preferenza dell'utente: **vedere tutto in locale prima**, poi `main`, poi server. Nulla va in produzione senza il suo ok.

1. **Anteprima in locale**: le modifiche si provano su `localhost`. Per le modifiche al sito pubblico l'utente lavora in
   **parallelo su due copie di anteprima, `temp` e `temp2`**, per vedere le modifiche prima di portarle nel repo principale:
   - `temp2` = repo separato `Emanuelee00/chezmarthe-temp2` (progetto Vercel `chezmarthe-temp2`), cartella `~/projects/chezmarthe-temp2`.
     Qui è stata fatta gran parte del redesign del sito pubblico (home, schermate per telefono, "Nos évènements", ecc.).
     Alcune modifiche esistono in **entrambi** i repo (es. l'ordine dell'équipe: commit `49242d9` in temp2 e `67c5572` nel repo principale).
   - `temp` = la copia di anteprima precedente. **Non è su questo PC**: da confermare dove sta prima di usarla.
   - Vercel ha un limite di 100 deploy al giorno: in temp2 si pusha solo quando serve. Le anteprime non sono la produzione.
2. **Repo principale → `main`**: quando le modifiche vanno bene si portano nel repo principale su un branch (`release/...`
   o `feature/...`), si controllano i test, e **si pusha su `main`** (prima con PR e squash, il 12 novembre push diretto
   fast-forward su richiesta esplicita dell'utente). Prima di ogni rilascio si mette un **tag di ritorno** `pre-<nome>-2026-11`.
3. **Server**: quando l'utente dice che va bene, si aggiorna la VM (procedura al §6). La VM segue sempre `main`.

Regole da rispettare:
- Rispondere **in italiano**. I testi del sito e del TODO sono in francese.
- Niente push, merge o accessi al server senza richiesta esplicita (il 12/11 l'utente ha chiesto esplicitamente il push su `main`).
- Niente segreti in chat: password Gmail per app, chiavi Google, `TUNNEL_TOKEN` ecc. restano sulla VM (`deploy/.env`, `deploy/secrets/`).
- Mai `make seed` sulla VM (crea account demo con password nota).

## 3. Cosa è stato fatto

Pacchetti (VM Google Cloud `marthe`, test su https://34-155-50-2.sslip.io). **Al 16/11 tutto è in `main` (commit `8897125`);
sulla VM girava al massimo il pacchetto 2/3: i pacchetti 3–7 vanno su insieme con un solo `git pull` (§6.3).**

| Pacchetto | Contenuto | Stato |
|---|---|---|
| 1 | Financements (rilanci a 11 mesi, e-mail di promemoria), Messages (e-mail modificabili), Devis, linguetta del menu | in produzione |
| 2 | Sito pubblico rifatto, Factures et devis con editor Word/PDF, Google Agenda (programmazione letta dal calendario) | in produzione |
| 3 | Sito per telefono, foto HD, niente blur (commit `c013753`) | fuso in `main`, build fatto sulla VM, **bascola `up -d app` da confermare** |
| 4 | Factures et devis: tariffe da cliccare, anteprima in diretta, tariffe modificabili (`652d52b`) | in `main`, **non ancora sulla VM** |
| 5 | Richieste dell'équipe dell'11 novembre (vedi sotto) | in `main` dal 12/11, **non ancora sulla VM** |
| 6 | Comptabilité degli eventi (devis → fattura, PDF come i modelli Word, invio e-mail), «Financeurs potentiels» (201 finanziatori, bandi EU/FR, mecenati, consigli), card «Louer un espace» modificabili (`7d4e5d9`) | in `main` dal 16/11, **non ancora sulla VM** |
| 7 | Vedi sotto (16/11) | in `main` dal 16/11, **non ancora sulla VM** |

**Pacchetto 7** (16 novembre, tutto in `main`):
- **Menu «Site»** (`frontend/src/features/site/`, backend `backend/espaces.py` → `/api/site`): tutta la home si modifica dall'équipe, sezione per
  sezione (testi, foto caricate o del sito, liste, sezioni nascoste, ordine delle sezioni trascinando le linguette). I membri dell'équipe
  modificati compaiono anche su «Notre équipe». Contenuti di partenza in `frontend/src/features/landing/siteContent.js`.
- **Bilans des structures** (`backend/bilans/`, `frontend/src/features/bilans/`): bilancio mensile per struttura (Chez Marthe, HAS, JUST, Sista4good,
  Petites Cantines, Bénénova) dal foglio di Caroline; domande comuni + proprie; le associazioni lo compilano dal loro spazio, l'équipe
  vede i totali ed esporta l'anno in Excel. HAS/JUST: solo numeri, **nessun dato per persona** (scelta da confermare, vedi TODO).
- **Financeurs potentiels**: menu a tendina veri per statut/adéquation (prima era un datalist che mostrava solo il valore già scelto),
  statut «Contacté» verde; le 57 righe già presenti in «Financements» (file `AAP retroplanning`) sono **rosse** con «Déjà dans Financements»
  (mappa in `fundingMatches.js` + stesso nome), casella «Les masquer», bottone € per segnare/togliere a mano; barra di scorrimento
  orizzontale attaccata in fondo allo schermo (`StickyScrollbar.jsx`, anche in Financements).
- **Spazi personali** (`backend/profils.py` → `/api/profils`, `frontend/src/features/profiles/`): dopo il login équipe «Qui êtes-vous ?» (le persone
  dell'équipe del sito, + «Ajouter une personne»), «Bonjour <prenome>», menu personale riordinabile a mano (`shared/lib/usePointerSort.js`:
  la voce si solleva e le altre fanno spazio; anche nelle liste di «Site»), ★ per evidenziare, sfondi pagina e menu (colore o immagine),
  **☀ tema scuro e M tema viola** (`themes.css`). Salvati sul server; la persona scelta è ricordata nel browser. Non è una sicurezza
  (tutti usano l'account équipe).
- Test al 16/11: **139 backend, 114 front-end**, build ok.

**Pacchetto 5** (era l'ultimo lavoro della vecchia sessione, branch `feature/richieste-equipe`, completato e testato il 12/11):
- ordine dell'équipe per arrivo: Véronique, Barbara, Caroline, Isadora, Joria, Flora, Sarah (senza cognomi);
- bottone «S'inscrire» sugli eventi se la descrizione dell'evento in Google Agenda contiene `Inscription : https://…`
  (si pubblica solo l'indirizzo, mai il resto della descrizione) — `gcal.py`;
- sezione «L'équipe de Chez Marthe» sulla home, prima dei partner (che diventano «Soutiens et partenaires»);
- «Les associations du lieu» (Sista4good, Les Petites Cantines) in fondo a Notre équipe;
- Coworking e Cantine in «Louer un espace», con link alle associazioni (**foto del coworking provvisoria**: un dettaglio della foto del Bureau);
- test: 120 backend e 83 front-end passano.

**Programmazione e Google Agenda**: la sincronizzazione è **a senso unico**. Il sito *legge* il calendario «Programmation du site»
(un evento rosso «Tomate» = in primo piano) e non lo scrive. Quindi un evento aggiunto sul sito non compare in Google Agenda;
per aggiungere (ad esempio i «3 ans des Sistas / Marseille Désirable») si crea l'evento direttamente in Google Agenda.
Sincronizzazione nei due sensi: non fatta, è nel TODO.

## 4. Cosa mi manca (in ordine di importanza)

Il dettaglio completo è in `TODO.md`. In sintesi:

0. **Backup automatico del database fuori dalla VM** (segnato «important» in cima al TODO): oggi esiste solo il `pg_dump` a mano.
1. **Server**: mettere su i pacchetti 3–7 insieme (procedura al §6.3). Dopo: in «Financements» importare l'Excel `AAP retroplanning`
   se è vuoto (servono le pistes per il rosso in «Financeurs potentiels»); creare gli account `partenaires` delle associazioni con il
   **nome esatto** («Benenova», «Sista4good», «Les Petites Cantines», «HAS», «JUST») per i bilanci.
2. **Controllare il pacchetto 3 sul PC** sul sito vero (foto HD ritagliata, niente alone, 5 eventi, pillola «Notre manifeste»).
3. **Domini**: `chezmarthe.org` non punta ancora alla VM. Servono record `A` su IONOS (senza toccare MX/TXT/DKIM/DMARC delle e-mail),
   poi `SITE_HOSTS`, `CANONICAL_DOMAIN`, `OLD_DOMAINS` nel `.env` della VM. Serve chi ha l'accesso IONOS. `chezmarthe.site` non è dell'associazione.
4. **E-mail**: il servizio di invio non è collegato (Gmail con «password per app», oppure Resend). Finché non lo è, non parte nessuna e-mail.
5. **Richieste dell'équipe ancora aperte**: cognomi (da decidere e far validare), evento «3 ans des Sistas», trombinoscopio completo
   delle altre associazioni (chi, quali foto, quali diritti), foto vera del coworking, chi valida i contenuti.
6. **Diritti**: foto e citazioni dell'archivio FWD e foto dell'équipe non vanno sul sito prima di conferma dei diritti e del consenso.
7. **Prima di fine gennaio 2027**: passare l'account Google Cloud a «compte complet», altrimenti la VM si ferma a fine prova gratuita.
8. Sicurezza e pulizia: creare gli account veri (uno a persona), togliere `comptes.txt` dal repo, sauvegardes regolari fuori dalla VM,
   `lb_try_duration 30s` in Caddy, un domani il tunnel Cloudflare, e forse riattivare l'AI.
9. Backlog sito: tablet (700–1299 px), modulo di richiesta per telefono, «Adhérer»/«Faire un don» visibili in alto, TikTok, spazi
   (prezzi, foto, capacità, togliere Jardin e Cuisine, Atelier = scambio di servizi), Linktree per le prenotazioni.

## 5. Cosa facevano le sessioni precedenti (e come sono finite)

Sessione del 13–16/11 (id `49559626`): pacchetti 6 e 7, tutti pushati su `main` (fast-forward, su richiesta esplicita dell'utente);
branch di lavoro `feature/comptabilite`, allineato a `main`. Finita con le istruzioni per mettere tutto sulla VM (§6.3), non ancora eseguite.
Durante questa sessione l'utente provava in parallelo il sito locale (http://equipe.localhost:8000): le prove automatiche vanno fatte
su una persona di test, non su Véronique o sugli altri profili veri.


La sessione precedente (id interno `f77fce3e`, fino al 12/11 ~19:00) stava aggiungendo in locale le richieste dell'équipe
(pacchetto 5). Aveva già committato `91cd0f7` sul branch `feature/richieste-equipe` e lanciato i test, ma i test backend
erano scaduti per tempo senza esito e nulla era stato pushato. Questa sessione ha rilanciato i test (120 backend ok, 83 front-end ok),
messo il tag di ritorno `pre-richieste-equipe-2026-11`, aggiunto questo file e pushato su `main`.
Le altre due sessioni su Chez Marthe (`9179c45c` fino al 10/11 e la più vecchia) hanno prodotto i pacchetti 1–4.

## 6. Il server: com'è fatto e come si aggiorna

### 6.1 Com'è fatto
- **VM Google Cloud** `marthe`, zona `europe-west9-a`, tipo `e2-small`, Debian 12, IP statico `marthe-ip` (34.155.50.2), firewall `marthe-web` (porte 80/443).
  Progetto Google Cloud `chezmarthe`, account dell'associazione (prova gratuita da 300 $: **passare a account completo prima di fine gennaio 2027**).
- Utente sulla VM: `contact_chezmarthe`. Repo clonato in `~/marthe` (segue `main`). Si lavora in `~/marthe/deploy`.
- **Docker Compose** (`deploy/docker-compose.yml`), tre servizi: `db` (Postgres 17, non esposto), `app` (immagine `deploy-app`, costruita da `Dockerfile.prod`),
  `caddy` (unico servizio esposto, HTTPS automatico Let's Encrypt). Le migrazioni del database partono da sole all'avvio dell'app
  (un lock Postgres evita conflitti tra i worker).
- **Accesso**: il SSH diretto dal PC dell'utente è rifiutato (e la porta 22 è bloccata su certe reti). Si entra da **Cloud Shell** di Google Cloud:
  `gcloud compute ssh marthe --zone=europe-west9-a`. `gcloud` non è installato in WSL. Claude non può entrare nella VM: l'utente incolla i comandi in Cloud Shell
  e riporta l'esito.
- **File solo sulla VM, mai in Git**: `deploy/.env` (variabili) e `deploy/secrets/` (`google-calendar.json` = chiave del compte de service,
  `calendars.json` = elenco calendari). Il file `.env` contiene: `POSTGRES_PASSWORD`, `SITE_HOSTS`, `CANONICAL_DOMAIN`, `OLD_DOMAINS`,
  `GOOGLE_CALENDAR_ID`, e (da aggiungere) `CONTACT_EMAIL`, `REMINDER_TO`, `MAIL_FROM` più `SMTP_*` o `RESEND_API_KEY`. Il modello è `deploy/.env.example`.
- **Indirizzi oggi**: test su `https://34-155-50-2.sslip.io` (con `equipe.`, `bilan.`, ecc. davanti). `SITE_HOSTS` in `.env` usa ancora sslip.io.
  `chezmarthe.org` e `.site` **non** sono ancora sulla VM.

### 6.2 Cosa si sta mettendo sul server (stato al 16/11)
1. **Pacchetti 3–7**: tutti in `main` (`8897125`). Una sola passata con la procedura 6.3. Prima del `git pull` annotare `git log --oneline -1`
   sulla VM (per sapere da dove si parte). Nessuna variabile nuova obbligatoria; **nessuna migrazione dello schema** dal pacchetto 2:
   i dati nuovi (contenuto del sito, foto caricate, bilanci, spazi personali) vanno nella tabella `documents` già esistente.
2. Il pacchetto 6 invia devis/fatture per e-mail: funziona solo quando l'e-mail è collegata (punto 4).
3. **Google Agenda**: già configurato in produzione (chiavi in `deploy/secrets/`, `GOOGLE_CALENDAR_ID` nel `.env`). Verifica: `curl -s https://<sito>/api/programmation` risponde con `"events": [...]`.
4. **E-mail**: non collegata. Da fare: Gmail con «password per app» (verifica in due passaggi attiva) → nel `deploy/.env` `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`, poi `docker compose up -d app`.
   Mettere lo stesso indirizzo come «Bonjour Chez Marthe» nella pagina Messages. **La password non si scrive mai in chat**: la si digita direttamente nel `.env` sulla VM con `nano`.
5. **Domini** (tappa 2 di `deploy/README.md`): record `A` su IONOS per `@`, `www`, `equipe`, `residents`, `benevoles`, `partenaires`, `bilan` verso l'IP della VM
   (**non toccare** MX/TXT/`_domainkey`/`_dmarc`/`autodiscover`), poi in `.env` `SITE_HOSTS=...`, `CANONICAL_DOMAIN=chezmarthe.org`, `OLD_DOMAINS=chezmarthe.site`
   (elenco completo di host nel README) e `docker compose up -d`. Controllo prima: `dig +short chezmarthe.org` deve dare l'IP della VM, altrimenti Let's Encrypt rifiuta i certificati.

### 6.3 Aggiornare il sito (procedura standard, tutta in Cloud Shell)
```sh
gcloud compute ssh marthe --zone=europe-west9-a
cd ~/marthe/deploy

# 1. backup del database e immagine di ritorno
docker compose exec -T db pg_dump -U marthe marthe | gzip > ~/marthe-$(date +%F-%H%M).sql.gz
docker tag deploy-app:latest deploy-app:precedente

# 2. scaricare il nuovo codice e costruire (il sito attuale continua a rispondere)
cd ~/marthe && git pull && cd deploy
docker compose build app

# 3. attivare e controllare
docker compose up -d app
docker compose logs --tail=40 app      # deve comparire "Application startup complete"
docker compose ps                      # db, app, caddy "Up"
```
- **Ritorno rapido** se qualcosa non va: `docker tag deploy-app:precedente deploy-app:latest && docker compose up -d app`.
  Se il problema è nel codice si può anche tornare a un tag Git: `cd ~/marthe && git checkout pre-<nome>-2026-11` e ricostruire.
- Dopo la bascola: aprire il sito, `/equipe`, `/on-parle-de-nous`, accedere allo spazio équipe e aprire Financements, Messages, Factures et devis.
- Cambiare solo una variabile (es. `.env`): `nano deploy/.env` poi `docker compose up -d app` (si ricrea solo l'app).
- Backup di riserva più vecchio: `~/marthe-2026-11-10-1807.sql.gz` sulla VM. Non esiste un backup automatico né una copia fuori dalla VM (da fare).
- Utile: `docker compose logs -f caddy` (certificati), `docker compose exec app env PYTHONPATH=/app/backend /opt/venv/bin/python -m features.accounts.create_user email@... "Nome" equipe` (nuovo account équipe).
- Promemoria finanziamenti: `POST /api/funders/reminders/run` (équipe collegata) elenca quelli di oggi senza inviarli, `?dry=false` li invia.

### 6.4 Rilasci: dal codice alla VM
1. Branch da `origin/main` in un worktree (`../chezMarthe-release`), modifiche, `uv run ruff check`, `uv run pytest -q`, `(cd frontend && npm test)`.
2. Tag di ritorno sul `main` di oggi: `git tag pre-<nome>-2026-11 origin/main && git push origin pre-<nome>-2026-11`.
3. Push su `main` (PR con squash, oppure fast-forward se l'utente lo chiede).
4. Procedura 6.3 in Cloud Shell. Il classificatore di sicurezza di Claude blocca tunnel e merge senza ok esplicito: serve sempre il «sì» dell'utente.

Tag di ritorno su GitHub: `pre-finanziamenti-messaggi-2026-11`, `pre-sito-pubblico-2026-11`, `pre-sito-mobile-2026-11`, `pre-devis-tarifs-2026-11`, `pre-richieste-equipe-2026-11`, `pre-paquet6-2026-11` (= `main` prima dei pacchetti 6 e 7).

## 7. Riprendere su un altro computer

```bash
git clone git@github.com:Emanuelee00/Hackathon_Aim_2026.git chezMarthe && cd chezMarthe
uv sync && (cd frontend && npm install)
uv run pytest -q                      # 139 test backend
(cd frontend && npm test)             # test front-end
MARTHE_AI=0 uv run uvicorn main:app --port 8010   # sito su http://localhost:8010 (build front: cd frontend && VITE_AI=off npm run build)
```

- Per la programmazione in locale servono `secrets/google-calendar.json` e `GOOGLE_CALENDAR_ID` (non sono nel repo: chiederli all'utente).
  Senza chiave la sezione dice «programmazione indisponibile».
- Gli account demo locali si creano con `make seed` (elenco e password in `backend/features/accounts/seed_demo.py`, solo per sviluppo). Lo spazio équipe locale è su `http://equipe.localhost:<porta>`,
  quello delle associazioni su `http://partenaires.localhost:<porta>`.
- Se `uv` riempie la home: `UV_CACHE_DIR=<disco grande>/.cache/uv`. Le prove nel browser sono state fatte con Playwright e Chromium.
- Per i rilasci conviene un worktree: `git worktree add ../chezMarthe-release -b release/<nome> origin/main`.

## 8. Mappa dei branch e delle copie

- `main` = **fonte di verità**, è ciò che gira (o girerà) sulla VM.
- `release/*`, `feature/*`: rami di rilascio già fusi in `main` (squash), si possono cancellare.
- `design`: vecchio ramo del redesign, **superato** da `main` (40+ file diversi, nessuna novità da recuperare senza controllo). Da decidere se abbandonarlo.
- `deploy`, `page`, `financement-rappels`: vecchi rami, probabilmente superati (non verificati uno per uno).
- `~/projects/chezmarthe-temp2` (repo separato): anteprima del sito pubblico su Vercel. Contiene ancora cose non portate in `main`
  (intro 3D disattivata, affiche del manifesto non più usata): vedi `TODO.md`.
- File locali non versionati e non pubblicati: `design/canva/`, `design/screen/`, `design/slogans/`, `fwdmagazineavantages.zip` (diritti da chiarire).
