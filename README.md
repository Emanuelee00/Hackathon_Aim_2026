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

Al primo avvio viene scaricato anche il modello (circa 398 MB). Per fermare
Ollama e il sito insieme usa Ctrl+C.

Ollama usa la porta locale **11435** e salva il modello in `.ollama/models/`,
esclusa da Git e dal deploy Vercel. Le funzioni cloud di Ollama sono disabilitate.
Dopo il download l'inferenza funziona senza Internet, account o chiavi API.
Per fermare i server usa Ctrl+C nei rispettivi terminali.

- Sito: http://127.0.0.1:8000
- Stato backend: http://127.0.0.1:8000/api/health
- Prova AI: http://127.0.0.1:8000/docs → `POST /api/chat`
- Matching responsabile: sezione `Opportunités & parcours` oppure `POST /api/match`

```sh
curl http://127.0.0.1:8000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Scrivi un saluto in italiano."}'
```

La risposta della chat ha la forma `{"reply":"..."}`. Il matching usa soltanto
profili dimostrativi con consenso attivo, produce suggerimenti motivati e lascia
la decisione alla coordinatrice e alla residente.

## Modello

**Qwen2.5 0.5B**, tag Ollama `qwen2.5:0.5b`, quantizzato Q4_K_M: circa 398 MB
di download. La memoria richiesta durante l'esecuzione è maggiore.
È adatto a provare il flusso e richieste semplici; la qualità per i compiti
dell'hackathon dovrà essere valutata prima di usarlo nella demo finale.

Ogni richiesta è indipendente: massimo 2000 caratteri in ingresso, contesto
di 4096 token e massimo 256 token generati. Nessun costo o credito API;
il calcolo viene eseguito sul computer.

Verifica locale effettuata tramite `POST /api/chat`: risposta `4` alla domanda
`2 + 2`, in circa 0,31 secondi a modello caricato. Il primo avvio ha richiesto
circa 66 secondi. La prova di scrittura in italiano ha prodotto testo incoerente:
questo modello serve per collaudare l'integrazione, non valida la qualità della demo.

Riferimenti: [modello Ollama](https://ollama.com/library/qwen2.5:0.5b),
[API chat](https://docs.ollama.com/api/chat).

## Sviluppo

- `main.py`: app FastAPI e stato del backend.
- `ai.py`: `POST /api/chat` e chiamata HTTP a Ollama locale.
- `web/src/app/`: composizione dell’app e stato condiviso.
- `web/src/features/`: funzionalità autonome (`dashboard`, `requests`, `opportunities`, `journeys`, `calendar`, `spaces`, `reports`).
- `web/src/shared/`: componenti, dati demo e funzioni riutilizzabili.
- `web/src/styles/`: stile globale e responsive.
- `pyproject.toml` e `uv.lock`: dipendenze Python.
- `CODEX.md`: linee guida di sviluppo.

`make check` verifica lockfile, lint, formattazione e test.
`make test` esegue solo i test con risposte simulate, senza avviare il modello.
`make format` formatta Python. Il Makefile forza l'ambiente locale `.venv`.

## Vercel

L'entrypoint FastAPI `main:app` rimane predisposto in `pyproject.toml`, ma
**questa configurazione AI funziona in locale**: Vercel non può raggiungere
Ollama sul tuo PC tramite `127.0.0.1`. Prima del deploy della demo AI servirà
un endpoint remoto e la relativa configurazione del backend.
Il modello scaricato non va incluso nel deploy. Nessun deploy remoto è stato eseguito.
