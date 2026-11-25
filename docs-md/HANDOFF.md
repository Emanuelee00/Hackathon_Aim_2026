# Handoff — Chez Marthe

Aggiornato il **25 novembre 2026**. È il punto di partenza di ogni nuova sessione: dice dove siamo,
cosa è stato deciso e perché, e cosa resta da fare. Ordine di lettura: questo file → `docs-md/Guide.md`
(regole di lavoro) → `docs-md/TODO.md` (backlog, in francese) → `deploy/README.md` (server).
`docs-md/CONTESTO_SESSIONE.md` è la versione precedente (16/11): utile per la storia, superata per lo stato.

> Il repo è **pubblico**. Qui non vanno mai password, chiavi, token, `deploy/.env` o `deploy/secrets/`.

## 1. Stato al 25/11/2026

| Cosa | Stato |
| --- | --- |
| `main` su GitHub | contiene tutto il lavoro: refactor `main2` + le sessioni del 25/11 (§4). È l'unico branch. |
| VM di produzione (Google Cloud, IP `34.155.50.2`) | **non ancora aggiornata**: gira una versione di `main` **precedente** al refactor (probabilmente senza i pacchetti 3–7). Nessun dominio punta ancora alla VM, quindi nessun utente la usa. |
| `chezmarthe.org` (DNS su IONOS) | `@` senza record; `www` è un `CNAME` verso Odoo (`chezmarthe1.odoo.com`); MX su IONOS (email: **non toccare**). |
| `chezmarthe.site` (DNS su Cloudflare, non è dell'associazione) | passa ancora da Cloudflare (tunnel del portatile). Deciso di usarlo come **dominio di demo** (§3). |
| IA | spenta in produzione (`MARTHE_AI=0`, `VITE_AI=off` in `deploy/Dockerfile.prod`); i 5 chatbot non compaiono. |
| Email in uscita | non collegate (nessun `SMTP_*` / `RESEND_API_KEY`): nessuna email parte. |
| Account Google Cloud | in prova: passare a «compte complet» **prima di fine gennaio 2027**, oppure cambiare server (previsto tra ~2 mesi). |

## 2. Prossimi passi, in ordine

1. **Aggiornare la VM** (l'utente, da SSH; Claude non ha accesso al server):
   ```sh
   cd ~/marthe && git branch                 # deve essere main (il vecchio branch deploy non esiste più)
   docker compose -f deploy/docker-compose.yml exec db pg_dump -U marthe marthe | gzip > ~/backup-$(date +%F).sql.gz
   git log -1 --oneline                      # annotare: è il commit a cui tornare
   git pull
   cd deploy && docker compose up -d --build && docker compose logs -f app
   ```
   `deploy/.env` resta **com'è**. Ritorno: `git checkout <commit annotato>` + `docker compose up -d --build`.
   I dati sono compatibili: le 3 migrazioni sono identiche byte per byte e le chiavi dello store sono le stesse (verificato).
2. **DNS di `chezmarthe.org` su IONOS**: record `A` → IP della VM per `@`, `www` (sostituisce il `CNAME` Odoo),
   `equipe`, `residents`, `benevoles`, `partenaires`, `bilan`; TTL al minimo. Procedura completa: `deploy/README.md`, tappa 2.
3. Quando `dig +short chezmarthe.org` risponde con l'IP della VM (non prima: Let's Encrypt blocca dopo vari rifiuti):
   in `deploy/.env` `SITE_HOSTS` con i soli host `.org`, `CANONICAL_DOMAIN=chezmarthe.org`, `OLD_DOMAINS=` vuoto; `docker compose up -d`.
4. Su Odoo togliere `www.chezmarthe.org` dalle impostazioni del sito.
5. Tra ~2 mesi **cambio di server**: procedura «Cambiare server» in `deploy/README.md` (database + `deploy/.env` + `deploy/secrets/`, poi i record `A`).

## 3. Decisioni prese, e perché

- **Tutto sulla VM, niente Vercel.** Il refactor `main2` divideva il sito pubblico (statico su Vercel) dall'app (VM, sottodominio `api`).
  Tolto (commit `33e72ea`): un solo deploy, nessun cambio DNS per il sito pubblico, niente CORS / `VITE_API_BASE_URL` /
  `PUBLIC_SITE_ORIGINS` da tenere allineati. Il vantaggio di Vercel (home visibile se la VM si ferma) non vale la complessità: senza VM
  moduli, eventi e login non funzionano comunque. **Non reintrodurre** Vercel, CORS o il sottodominio `api`.
- **Caddy resta** come reverse proxy (HTTPS automatico, 4 righe in `deploy/Caddyfile`). nginx funzionerebbe uguale ma richiede certbot,
  rinnovi da sorvegliare e più configurazione; a questa scala non dà niente in più.
- **`chezmarthe.org` = produzione, `chezmarthe.site` = demo dal portatile** (`make dev` + `make tunnel`, configurazione in `cloudflare/`).
  Per questo `.site` **non** va usato come redirect verso la VM (i due usi si contenderebbero lo stesso dominio).
- **Struttura: il backend rispecchia `frontend/src/`.** `backend/features/` ha gli stessi nomi di `frontend/src/features/`;
  `backend/core/` è il «`shared/`» del backend. L'utente voleva cartelle che corrispondono alla struttura del sito (come nel vecchio
  prototipo): `frontend/src/features/equipe/funding` ↔ `backend/features/equipe/funding`.
- **Regola sulle cartelle = spia, non limite** (Guide §0, scelta esplicita dell'utente): ~5 voci l'obiettivo, oltre 7 si riguarda;
  decidono le due domande «si capisce subito dove sta una cosa?» e «la struttura riflette qualcosa di vero o è inventata per la regola?».
  Una cartella che rispecchia il sito 1:1 (es. `landing/sections/`, `features/equipe/` = le pagine del menu) può restare sopra 7.
- **`main.py` in `backend/`**, avviato con `uvicorn main:app --app-dir backend` (Makefile, `Dockerfile`, `deploy/Dockerfile.prod`).
  Il vecchio trucco `import backend` che aggiungeva la cartella a `sys.path` aveva rotto l'avvio (ruff lo aveva riordinato): tolto.
- **`deploy/` senza sottocartelle**: `docker-compose.yml`, `Dockerfile.prod` (+ il suo `.dockerignore`), `Caddyfile`, `.env.example`, README.
  Spostare il compose avrebbe obbligato a spostare a mano `deploy/.env` e `deploy/secrets/` sulla VM.
- **Prototipo `chezmarthe-demo/` tolto** (nessun file del sito lo leggeva). Il suo `CLAUDE.md` (dati reali: spazi, tariffe, identità
  visiva) è archiviato in `docs-md/CLAUDE-PROTOTIPO.md`; `comptes.txt` tolto (doppione di `backend/features/accounts/seed_demo.py`).
  Recupero: `git checkout 327922a -- chezmarthe-demo`.
- **Makefile**: `make` da solo mostra l'aiuto (prima avviava Ollama e scaricava 2,3 GB); comando uvicorn in una variabile (`SERVER`);
  tolto `browser-test` (nessun test Playwright esisteva) e la dipendenza `@playwright/test`. Tenuti `demo`, `qr`, `tunnel` per le demo.
- **Branch**: su GitHub solo `main`. Tag di ritorno tenuti (`pre-*`), più `main-prima-refactor-2026-11` (il `main` prima del refactor, `161989b`)
  e `archivio/design`, `archivio/page` (gli unici due vecchi branch con commit non in `main`).

## 4. Cosa è stato fatto (20 e 25 novembre)

- **20/11, sessione GLM** (diario in `docs-md/glm.md`): repo diviso in `backend/` e `frontend/`, documenti in `docs-md/`, frontend per
  pubblico, landing una cartella per sezione, `home.css` in fogli tematici, registri `PAGES`/`MODALS` in `App.jsx`, Guide estesa,
  passaggio parziale a Nemotron per l'IA.
- **25/11, questa sessione** (commit in ordine):
  - `a799516` l'app non partiva (`ModuleNotFoundError`) dal primo commit del refactor: corretto + test di avvio.
  - `33e72ea` tolti Vercel, Jamstack, CORS, cron Vercel, controlli sulla variabile `VERCEL`.
  - `763d01c` procedura DNS `.org` e «Cambiare server» in `deploy/README.md`.
  - merge di `main2` in `main`, pulizia branch, tag di ritorno.
  - `327922a` backend per spazi; `9f4529f` tolto `chezmarthe-demo/`; `e874e67` `main.py` in `backend/`, `Dockerfile.prod` in `deploy/`.
  - `647b6f2` `backend/features/` + `backend/core/`; `a5ce593` conferme e QR in `features/public/`, regola cartelle come spia.
  - `6efc399` chatbot in `agents/spaces/`, `quotes/editor|invoicing|templates`, test che rispecchiano il codice (`tests/conftest.py`).
  - `67f6989` frontend raggruppato per sotto-funzioni (`quotes/`, `funding/table/`, `requests/<pannello>/`, `landing/shell/`, hook).
  - Makefile con aiuto, senza Playwright; questo handoff e il `CLAUDE.md` alla radice.
  - Migrazioni con SQLite: lock su file come il lock di Postgres, così l'immagine parte anche senza Postgres con 2 worker
    (prima: `table alembic_version already exists`); test `tests/core/test_db.py`.

## 5. Struttura attuale

```text
backend/
  main.py            entry point (router, redirect di dominio, frontend compilato)
  features/          accounts/ agenda/ agents/ (spaces/ = un chatbot per spazio) equipe/ public/ residents/ sharing/
  core/              ai.py db.py store.py demo/ mailer/ migrations/ ranking/
  tests/             conftest.py, test_main, test_startup, core/, features/<come il codice>/
frontend/src/        app/ features/ (equipe/ residents/ benevoles/ partenaires/ public/ auth/ chatbot/ traces/) shared/ styles/
deploy/              produzione: docker-compose.yml, Dockerfile.prod, Caddyfile, .env.example, README.md
cloudflare/          tunnel per le demo dal portatile su chezmarthe.site
docs-md/             Guide, TODO, HANDOFF, TECH_DEBT, business plan, QR, PDF degli spazi, glm.md
```

## 6. Cose aperte e debito tecnico

- **IA a metà tra Ollama e Nemotron** (commit `ce6c2d8`): `core/ai.py` punta a Nemotron (chat), ma `features/equipe/opportunities.py`
  e `features/residents/employment/cv_lines.py` mandano ancora richieste in formato Ollama a quell'indirizzo e falliscono in silenzio
  (ripiegano sui testi guidati); `employment/planning.py` usa ancora Ollama locale. Irrilevante in produzione (IA spenta); da decidere
  prima di riattivarla.
- **Dati demo nel bundle di produzione** (profili fittizi, etichetta «Données de démonstration»): basta `ENV VITE_DEMO=off` in
  `deploy/Dockerfile.prod` (voce in `TODO.md`).
- **Menu équipe**: 18 voci piatte. Idea proposta, non fatta: sezioni visibili (Demandes, Résidentes et parcours, Lieu, Bilans,
  Financements, Gestion) e poi cartelle `features/equipe/<sezione>/` con gli stessi nomi, frontend e backend. È una modifica di interfaccia:
  solo se l'utente la vuole.
- **Ciclo tra package** `equipe` ↔ `public`/`sharing` (in `TECH_DEBT.md`): rimedio, spostare `french_date` in `core/`.
- **Copie Excel automatiche dei finanziatori** (`excel-sauvegarde/`) dentro il container: si perdono a ogni ricostruzione; la fonte resta il sito.
- **Backup automatico del database** fuori dalla VM: non esiste ancora (prima voce di `TODO.md`).
- `/api/bilans` leggibile da ogni account connesso: voluto, ognuno vede solo i bilans che lo riguardano; l'export Excel è solo équipe.

## 7. Come verificare un cambiamento (cosa ha funzionato)

- `make check` (lock, ruff, 142 test backend, 115 test frontend, build) prima di ogni commit.
- **Avvio reale**, non solo i test: `make dev` oppure l'immagine di produzione:
  `docker build -f deploy/Dockerfile.prod -t marthe-test . && docker run --rm -p 127.0.0.1:8899:8000 marthe-test`
  (database vuoto → verifica anche tutte le migrazioni). I test da soli non avevano visto il bug dell'avvio né le route `/api/api/...`.
- **Elenco delle route** prima/dopo uno spostamento: `app.openapi()['paths']` (49 route oggi).
- **Spostamenti di file del frontend**: la build deve dare gli **stessi hash** dei file in `frontend/dist/assets/` (sito identico).
  Script usato: risolvere ogni import relativo prima di spostare, poi riscriverlo dalla nuova posizione.
- Python 3.14 non c'è su questo PC: `uv` lo installa in una cartella temporanea (`UV_PYTHON_INSTALL_DIR=...`).

## 8. Come lavora l'utente

- Scrive in **italiano**; il repo resta in inglese (codice, commenti, commit), il francese per i contenuti del sito e i documenti dell'équipe.
- Prima delle modifiche grandi vuole **la proposta prima del lavoro** («rispondimi prima di fare»), e chiede spesso «è da senior?»:
  rispondere con il ragionamento (chiarezza, struttura che riflette qualcosa di vero), anche quando la risposta è «no».
- Vuole provare **in locale** prima di `main`, e niente in produzione senza il suo ok. Sulla VM i comandi li lancia lui.
- La Guide si modifica solo su sua richiesta esplicita.
