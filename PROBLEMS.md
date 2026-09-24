# Problemi trovati — pre-hackathon (2026-09-23)

Elenco basato su test reali (codice letto, endpoint chiamati dal vivo, UI navigata con Chromium), non su ipotesi. Ordinato per gravità rispetto alla demo di giovedì.

---

## 1. [RISOLTO] Il modello AI produce output di bassa qualità o fallisce

> **Risolto il 2026-09-23:** passaggio a `qwen2.5:3b` su GPU, scelta dei profili deterministica (`ranking.py`), l'AI scrive solo le motivazioni, tetto di 9 secondi con suggerimento guidato di riserva e modello precaricato all'avvio. Misurato: da 2 a 5,5 s su tutti gli eventi demo, profili coerenti (Marie→cucina, Camille→imprenditoria, Sofia→foto). Barra di caricamento aggiunta nella UI.

**Dove:** [ai.py](ai.py) — `MODEL = "qwen2.5:0.5b"` (494M parametri, il più piccolo della famiglia Qwen).

**Test eseguiti (backend + Ollama avviati in locale, chiamata reale a `/api/match`):**

- **Evento "Atelier cuisine / stage commis de cuisine"** con Fatou (obiettivo esplicito: *"Découvrir les métiers de la restauration"*), Amina, Sofia → il modello ha proposto **Sofia** come primo match (obiettivi di Sofia: fotografia/portfolio, nessun legame con la cucina), poi Fatou. Motivazioni **identiche copiate tra i tre profili** e un errore fattuale (attribuisce l'arabo a Sofia, in realtà è la lingua di Amina).
- **Evento "Rencontre entrepreneures / mentorat"** con Amina (obiettivo esplicito: *"Rencontrer des entrepreneures"*) → il modello **non ha prodotto JSON valido**, risposta `502 "Le modèle n'a pas produit un résultat exploitable."`
- **Test dal vivo nell'interfaccia** (click reale su "Lancer le matching"): la card mostrata conteneva un **carattere rotto/illeggibile ("du仮")**, artefatto tipico di un modello troppo piccolo che perde coerenza a metà frase.

**Impatto:** è il "momento AI" del pitch — se fallisce o produce testo incoerente davanti alla giuria, la tesi centrale del progetto (l'IA trova connessioni non ovvie) si sgretola in diretta.

**Nota:** il README lo ammette già onestamente ("questo modello serve per collaudare l'integrazione, non valida la qualità della demo") — quindi non è una sorpresa per il team, ma va risolto prima di giovedì.

**Da fare (rimandato a dopo, per scelta):** provare un modello più capace (`qwen2.5:3b`/`7b` o endpoint cloud), oppure — soluzione minima — testare in anticipo 3-4 combinazioni evento/profilo e usare in demo **solo quella verificata pulita**.

---

## 2. [ALTO] L'AI non è deployabile da remoto, solo in locale

**Dove:** [ai.py:9](ai.py#L9) — `OLLAMA_URL = "http://127.0.0.1:11435/api/chat"` hardcoded; confermato anche nel README ("Vercel non può raggiungere Ollama sul tuo PC tramite 127.0.0.1... Nessun deploy remoto è stato eseguito").

**Impatto:** la demo del matching **deve** girare sul laptop di chi presenta, con Ollama avviato a mano (`make ai` + `make model-pull`). Nessun link condivisibile con la giuria per questa parte, nessun fallback se quel laptop ha un problema il giorno della presentazione (batteria, wifi, porta occupata, primo avvio che richiede il download del modello se cambia macchina).

**Da fare:** decidere esplicitamente su quale macchina si presenta, verificare che il modello sia già scaricato lì, e avere un piano B (screenshot/video di backup) se Ollama non parte in sala.

---

## 3. [RISOLTO] Nessuna gestione "elegante" del fallimento in demo

> **Risolto il 2026-09-23:** se il modello fallisce non compare più il riquadro rosso, ma una card etichettata "Suggestion guidée".

**Dove:** [Opportunities.jsx](web/src/features/opportunities/Opportunities.jsx) — in caso di errore mostra un riquadro rosso generico "Le copilote n'a pas répondu".

**Impatto:** funzionalmente corretto (l'errore è gestito, non crasha), ma esteticamente è la cosa peggiore che può apparire sullo schermo durante il pitch, proprio nel momento clou. Collegato al punto 1: il rischio è reale, non teorico (l'ho fatto succedere due volte su due test diversi).

**Da fare:** stessa soluzione del punto 1 — usare solo lo scenario demo pre-validato, non improvvisare la combinazione evento/profilo davanti alla giuria.

---

## 4. [INFO — non bloccante] Limiti già noti e dichiarati nel business plan

Questi non sono bug ma limiti strutturali del prototipo, già onestamente elencati nella sezione 17 del [BUSINESS_PLAN.md](BUSINESS_PLAN.md): niente autenticazione/ruoli, dati persistiti solo lato client, nessun registro di consenso reale, nessuna DPIA. Corretto lasciarli come roadmap post-hackathon — segnalati qui solo per completezza, nessuna azione richiesta prima di giovedì.

---

## 5. [RISCHIO DI PROCESSO — non tecnico] Il business plan è un documento da 22 sezioni, non un pitch

Ottimo come "cassaforte" per rispondere alle domande difficili della giuria, ma nessuno lo leggerà in 4 minuti di pitch. Rischio: investire ancora tempo nel documento invece che nella prova pratica della demo (in particolare i punti 1-3 sopra). Il documento è già in ottimo stato — a questo punto il tempo utile va sulla demo, non sul testo.

---

## Cosa NON è un problema (verificato)

- Backend: 11/11 test passano (`uv run pytest`).
- Frontend: 14/14 test passano (`npm test` in `web/`).
- Il flusso match accettato → parcours → bilancio **è davvero cablato** nel codice ([tracking.js](web/src/features/journeys/tracking.js), [reporting.js](web/src/features/reports/reporting.js)), non solo descritto nel business plan.
- L'interfaccia è coerente su tutte le pagine, filtra correttamente i profili senza consenso lato server (`422` se nessun consenso attivo, verificato anche da test dedicati in [test_ai.py](test_ai.py)).
