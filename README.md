# Marthe

Scheletro per Hackathon AIM 2026: FastAPI, HTML/CSS e un piccolo modello locale.
Python 3.14, dipendenze e ambiente virtuale gestiti con uv.

## Avvio locale

Servono [uv](https://docs.astral.sh/uv/getting-started/installation/), Make e
[Ollama](https://ollama.com/download) (già presente su questo computer).

```sh
make install
make ai
```

Lascia aperto quel terminale. In un secondo terminale:

```sh
make model-pull  # solo al primo avvio: scarica circa 398 MB
make dev
```

Ollama usa la porta locale **11435** e salva il modello in `.ollama/models/`,
esclusa da Git e dal deploy Vercel. Le funzioni cloud di Ollama sono disabilitate.
Dopo il download l'inferenza funziona senza Internet, account o chiavi API.
Per fermare i server usa Ctrl+C nei rispettivi terminali.

- Sito: http://127.0.0.1:8000
- Stato backend: http://127.0.0.1:8000/api/health
- Prova AI: http://127.0.0.1:8000/docs → `POST /api/chat`

```sh
curl http://127.0.0.1:8000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Scrivi un saluto in italiano."}'
```

La risposta ha la forma `{"reply":"..."}`. La pagina iniziale non contiene ancora
una chat; usa `/docs` per provare il collegamento.

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
- `web/`: pagina iniziale e CSS.
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
