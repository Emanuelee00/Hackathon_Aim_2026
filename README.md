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
esclusa da Git e dal deploy Vercel. Le funzioni cloud di Ollama sono disabilitate.
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

Quando l'app gira su Vercel (variabile `VERCEL`) oppure con `MARTHE_DEMO=1`,
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

## Vercel

L'entrypoint FastAPI `main:app` rimane predisposto in `pyproject.toml`, ma
**questa configurazione AI funziona in locale**: Vercel non può raggiungere
Ollama sul tuo PC tramite `127.0.0.1`. Prima del deploy della demo AI servirà
un endpoint remoto e la relativa configurazione del backend.
Il modello scaricato non va incluso nel deploy. Nessun deploy remoto è stato eseguito.

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
