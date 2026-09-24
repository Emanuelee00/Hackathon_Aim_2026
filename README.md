# Marthe

Scheletro per Hackathon AIM 2026: FastAPI, HTML/CSS e un piccolo modello locale.
Python 3.14, dipendenze e ambiente virtuale gestiti con uv.

La visione del prodotto, il valore per utenti e finanziatori, il ciclo completo,
la strategia d'impatto e il pitch sono descritti nel [piano business](BUSINESS_PLAN.md).

## Avvio locale

Servono [uv](https://docs.astral.sh/uv/getting-started/installation/), Make e
[Ollama](https://ollama.com/download) (già presente su questo computer).

Per installare tutto e avviare Ollama e il sito con un solo comando:

```sh
make
```

Al primo avvio vengono scaricati anche i modelli (circa 2,3 GB in totale). Per fermare
Ollama e il sito insieme usa Ctrl+C.

Ollama usa la porta locale **11435** e salva il modello in `.ollama/models/`,
esclusa da Git. Le funzioni cloud di Ollama sono disabilitate.
Dopo il download l'inferenza funziona senza Internet, account o chiavi API.
Per fermare i server usa Ctrl+C nei rispettivi terminali.

- Sito: http://127.0.0.1:8000
- Stato backend: http://127.0.0.1:8000/api/health
- Prova AI: http://127.0.0.1:8000/docs → `POST /api/chat`
- Matching responsabile: sezione `Opportunités & parcours` oppure `POST /api/match`
- Piano verso l'impiego: `Vue résidente` oppure `POST /api/employment-plan`

### Sottodomini

Il dominio principale mostra la pagina d'accoglienza; ogni pubblico ha il suo
sottodominio: `equipe.`, `residents.`, `benevoles.` e `partenaires.` (questi ultimi
due in preparazione). In locale usa `localhost` invece di `127.0.0.1`, per esempio
http://equipe.localhost:8000. Eventi e percorsi sono salvati dal backend
(`/api/store/…`), così tutti i sottodomini condividono gli stessi dati: Postgres se
`DATABASE_URL` è definita (docker compose), altrimenti il file SQLite `marthe.db`.

`/api/store/…` richiede un account (`sharing/`): l'équipe legge e sostituisce
tutto; gli altri spazi ricevono solo ciò che serve alla loro pagina e il server
tiene solo le modifiche permesse al loro ruolo:

| Spazio | Legge | Può modificare |
| --- | --- | --- |
| `residents` | eventi senza contatti né importi, le proprie proposte (non `suggested`/`dismissed`) | le proprie risposte |
| `benevoles` | eventi senza contatti; gli altri bénévoles senza nome | le proprie iscrizioni, nei posti liberi |
| `partenaires` | eventi senza contatti, la propria scheda associazione | nuove prenotazioni `pending` a proprio nome, la propria scheda |

Le pagine pubbliche non leggono lo store: il modulo della pagina d'accoglienza usa
`POST /api/requests`, la pagina `bilan.` `GET /api/feedback/events` (solo titolo e
data) e `POST /api/feedback/{id}` (un bilan per evento). Profili demo, associazioni
e spazi sono copiati in `sharing/identity.py`; `test_store.py` verifica che restino
uguali ai file del frontend.

### Account e accesso

Gli spazi `equipe.` e `residents.` mostrano prima la pagina di accesso. Residenti e
associazioni (`partenaires.`) possono solo depositare una richiesta d'accesso: l'account
funziona dopo la convalida da parte dell'équipe (pagina « Demandes d’accès »). I volontari
creano il proprio account direttamente. Gli account dell'équipe si creano solo da
terminale, perché vedono i dati delle residenti:

```sh
make user EMAIL=coord@marthe.fr NAME="Coordinatrice" ROLE=equipe
```

Utenti e sessioni sono gestiti con SQLAlchemy e migrazioni **Alembic** (`migrations/`),
sullo stesso database di `store.py`. L'app applica le migrazioni all'avvio; a mano:
`make migrate`. Dopo una modifica a `accounts/models.py`:
`make migration NAME="descrizione"`. La sessione è un cookie httpOnly valido 30 giorni,
separato per ogni sottodominio; le password sono salvate con scrypt.

```sh
curl http://127.0.0.1:8000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Scrivi un saluto in italiano."}'
```

La risposta della chat ha la forma `{"reply":"..."}`. Il matching usa soltanto
profili dimostrativi con consenso attivo, produce suggerimenti motivati e lascia
la decisione alla coordinatrice e alla residente.

Le proposte della residente sono divise in tre gruppi: proposte dall'équipe, trovate
grazie al CV (dopo l'analisi, gli eventi in programma che condividono parole con CV e
mestiere cercato, senza AI) e attività aperte a tutte, sempre visibili finché lei non
sceglie. Ogni residente può candidarsi a tutte le attività (nessuna esclusione a monte):
la candidatura arriva alla coordinatrice, che la accetta o no secondo posti e budget. Ogni
suggerimento del matching mostra il perché: obiettivi e competenze in comune con l'evento.

Nella vista residente è possibile caricare un CV PDF o DOCX fino a 4 MB e
indicare il lavoro cercato. Il testo viene elaborato in memoria, senza conservare
il file. L'AI propone punti di forza, miglioramenti del CV e passi concreti; se
il modello locale non risponde correttamente, viene mostrato un piano guidato
esplicitamente riconoscibile e da validare con l'accompagnatrice.

## Agenti chatbot

Gli agenti usano l'API OpenAI (`OPENAI_API` in `.env`, letta da Make e da docker
compose; modello `gpt-4.1-mini`, modificabile con `OPENAI_MODEL`).

- **Renseignements** (`agents/renseignements.py`): bolla in basso a destra nella
  pagina d'accoglienza. Risponde solo con le regole del lieu scritte in
  `agents/knowledge/renseignements.md` (modificabile dall'équipe, riletto a ogni
  conversazione). Se non sa rispondere chiede nome ed e-mail e trasmette la domanda
  all'équipe (strumento `transmettre_a_equipe`).
- Ogni spazio con account ha il suo agente, riservato a quel ruolo (`audience`):
  chi non ha il ruolo riceve 401/403. Gli strumenti leggono solo i dati permessi e
  li filtrano con l'account connesso, mai con gli argomenti del modello:

  | Agente | Vede |
  | --- | --- |
  | `equipe` | tutte le demandes (contatti e budget), calendario, domande ricevute, parcours |
  | `residents` | solo le proprie proposte e il proprio parcours (non `suggested`/`dismissed`), attività aperte senza contatti |
  | `partenaires` | le prenotazioni della propria associazione; per le altre solo spazio e orario |
  | `benevoles` | missioni e posti liberi (senza nomi), le proprie iscrizioni |

  L'account è collegato ai dati per nome, come nelle pagine: residente per nome di
  battesimo, associazione per nome dell'associazione, bénévole per nome.
  Gli agenti leggono soltanto; tranne quello dell'équipe possono trasmettere una
  domanda all'équipe con nome ed e-mail dell'account.
- Le domande trasmesse compaiono in `equipe.` → **Questions reçues**, con la
  provenienza, leggibili solo con un account équipe (`GET/PATCH /api/questions`).
- Nuovo agente: un file in `agents/` con istruzioni, strumenti e `audience`, da
  aggiungere a `AGENTS` in `agents/routes.py`; in React, `<ChatBubble agentId="..." />`
  oppure una voce in `SpaceAssistant.jsx`.

## Modello

**Qwen2.5 3B** (`qwen2.5:3b`, circa 1,9 GB) per chat e matching; il piano verso
l'impiego usa ancora **Qwen2.5 0.5B** (`qwen2.5:0.5b`, circa 398 MB). Su GPU
(RTX 4050 6 GB) il 3B gira interamente in memoria video.

Il matching è ibrido:

1. `ranking.py` sceglie in modo deterministico fino a 3 profili consenzienti i cui
   obiettivi o competenze compaiono nel testo dell'evento (tutti, se nessuno è legato);
2. il modello scrive soltanto motivazione, beneficio e punto da verificare;
3. se il modello non risponde entro 9 secondi o produce dati non validi, ogni
   profilo riceve una **suggestion guidée** esplicita, così la risposta arriva
   sempre in meno di 10 secondi.

All'avvio il backend precarica il modello (`keep_alive` illimitato), per evitare
l'attesa del primo caricamento durante la demo. Misurato sui 6 eventi demo: da 2
a 5,5 secondi a modello caricato; primo caricamento a freddo circa 38 secondi.

Riferimenti: [modello Ollama](https://ollama.com/library/qwen2.5:0.5b),
[API chat](https://docs.ollama.com/api/chat).

## Sviluppo

- `main.py`: app FastAPI e stato del backend.
- `ai.py`: chat tramite Ollama locale e precaricamento del modello.
- `matching.py` e `ranking.py`: matching ibrido con risposta sempre sotto i 10 secondi.
- `accounts/`: utenti, password, sessioni ed endpoint `/api/auth`.
- `agents/`: agenti chatbot (OpenAI) e domande trasmesse all'équipe.
- `db.py` e `migrations/`: SQLAlchemy e migrazioni Alembic.
- `employment/`: estrazione CV, piano verso l'impiego ed endpoint dedicato.
- `web/src/app/`: composizione dell’app e stato condiviso.
- `web/src/features/`: funzionalità autonome, compresa la vista `resident`.
- `web/src/shared/`: componenti, dati demo e funzioni riutilizzabili.
- `web/src/styles/`: stile globale e responsive.
- `pyproject.toml` e `uv.lock`: dipendenze Python.
- `CODEX.md`: linee guida di sviluppo.

`make check` verifica lockfile, lint, formattazione e test.
`make test` esegue solo i test con risposte simulate, senza avviare il modello.
`make format` formatta Python. Il Makefile forza l'ambiente locale `.venv`.

## Modalità demo (link pubblico)

Con `MARTHE_DEMO=1`,
**l'AI non viene mai chiamata**. Dopo un'attesa simulata di 6 secondi
(`DEMO_DELAY` in `demo.py`), durante la quale scorre la barra di caricamento,
il backend restituisce le risposte scritte in `demo_responses.json`:

- matching: un testo per ogni evento demo e ogni residente consenziente; la scelta
  dei profili resta quella di `ranking.py`, gli eventi nuovi ricevono una
  suggestion guidée;
- piano verso l'impiego: un piano per ciascuno dei tre mestieri di esempio
  (commis de cuisine, assistante administrative, vente); gli altri obiettivi
  ricevono il piano guidato, il CV tech → cuisine il piano di reconversion.
- frasi per il CV (« Comment l’écrire sur un CV ? ») : una versione per ciascuno dei tre
  mestieri di esempio; gli altri mestieri ricevono una frase guidata.

I testi sono stati abbozzati con `qwen2.5:3b` e poi corretti a mano.

```sh
make demo                          # demo senza AI, visibile sulla rete locale
make qr URL=https://tuo-link.app   # crea qr-demo.png
```

## Tunnel Cloudflare (chezmarthe.site)

L'app gira sul portatile ed è pubblicata con un tunnel Cloudflare: il dominio e
tutti i sottodomini (`equipe.`, `residents.`, `benevoles.`, `partenaires.`,
`bilan.`) puntano a `localhost:8000`. Configurazione: `cloudflare/tunnel.yml`.

Una sola volta, dopo aver installato
[cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/):

```sh
cloudflared tunnel login                                  # apre il browser, scegli chezmarthe.site
cloudflared tunnel create marthe
cloudflared tunnel route dns marthe chezmarthe.site
cloudflared tunnel route dns marthe '*.chezmarthe.site'
```

Per la demo, in due terminali: `make build && make dev` (oppure `make` con l'AI),
poi `make tunnel`. Il portatile deve restare acceso e sveglio.

## Vercel (piano B se il tunnel non funziona)

Il tunnel Cloudflare resta la via principale (AI e dati veri, persistenti). Vercel
è tenuto pronto come riserva, nel caso il portatile o il tunnel non siano
disponibili il giorno della demo: basta collegare il repository su
[vercel.com](https://vercel.com), la build usa `vercel.json`.

Su Vercel la variabile `VERCEL` è già impostata dalla piattaforma: l'app passa
automaticamente in **modalità demo** (risposte precompilate, nessuna chiamata AI,
vedi sopra) e i dati vengono salvati in SQLite su `/tmp`, quindi persistono solo
finché l'istanza resta calda. Configura `DATABASE_URL` (Postgres) nelle variabili
d'ambiente del progetto Vercel se vuoi dati persistenti anche lì. I sottodomini
(`equipe.`, `residents.`...) richiedono un dominio personalizzato configurato nel
progetto Vercel: l'URL `*.vercel.app` di default non li supporta.

## Démonstration CV et reconversion

La vue résidente de **Marie** contient une proposition, un parcours réalisé,
un contact fictif, un plan exemple et un CV DOCX préchargé. Les décisions déjà
sauvegardées restent prioritaires. Les CV fictifs sont téléchargeables dans le
formulaire, et le bouton **Tester un CV tech → cuisine** prépare un second cas.

Pour un CV contenant des termes techniques reconnus et un objectif cuisine,
le backend fournit un **plan guidé sans génération IA**, avec les termes repérés,
les acquis à vérifier et les étapes de reconversion. Cette règle ciblée ne
constitue pas une évaluation générale de tous les métiers. Les autres cas
utilisent le modèle local avec un plan guidé en cas d’échec.
Les compétences du parcours fictif ne sont pas envoyées avec un CV personnel.
