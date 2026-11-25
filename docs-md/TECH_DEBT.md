# Debito tecnico

Problemi trovati durante il refactor, **fuori scope** dei rispettivi commit.
Si affrontano in una passata dedicata, alla fine.

## Ruff — errori preesistenti

Trovati il 2026-11-20 durante il pilota `backend/mailer/`. Non introdotti dal refactor.

- [ ] `backend/tests/test_bilans.py` — errore ruff (da dettagliare)
- [ ] `backend/tests/test_confirmations.py` — errore ruff (da dettagliare)
- [ ] `backend/tests/test_editeur.py` — errore ruff (da dettagliare)
- [ ] `backend/tests/test_espaces.py` — errore ruff (da dettagliare)
- [ ] `backend/tests/test_funding.py` — errore ruff (da dettagliare)
- [ ] `backend/tests/test_messages.py` — errore ruff (da dettagliare)
- [ ] `backend/tests/test_modeles.py` — errore ruff (da dettagliare)
- [ ] `backend/tests/test_profils.py` — errore ruff (da dettagliare)
- [ ] `backend/tests/test_prospection.py` — errore ruff (da dettagliare)
- [ ] `backend/tests/test_reminders.py` — errore ruff (da dettagliare)

## Refactor pacchetti backend (in corso)

> `backend/mailer/`, `backend/ranking/`, `backend/demo/` sono stati creati **prima** della guida attuale
> (`Guide.md` §0: "a file first, extract later"). Sono coerenti con "everything in a
> package" ma non sono il modello: funzionano e i test sono verdi, quindi restano.
> I prossimi package si fanno solo se il modulo è grande o composito (§6).

- [x] `backend/mailer.py` → `backend/mailer/` (pilota)
- [x] `backend/ranking.py` → `backend/ranking/`
- [x] `backend/demo.py` → `backend/demo/` (path di `demo_responses.json` corretto a `parent.parent`)
- [ ] `agenda/gcal.py` (ex `gcal.py`, ora nel package `agenda/` con le sue route; resta un file) → splittarlo — **NON fattibile senza riscrivere i test**: `week_public`
      chiama `list_events` dentro il modulo, e `backend/tests/test_programmation.py` fa
      `monkeypatch.setattr(gcal, "list_events", …)`. Con un package il patch su
      `gcal.list_events` non raggiunge `week_public` in `service.py` (2 test rossi).
      Se si rifà: patchare `gcal.service.list_events` nei test, oppure far risolvere
      `list_events` al package. Tentato il 2026-11-20, rollbackato.
- [ ] `backend/equipe/opportunities.py`, `backend/equipe/profiles.py`, ... (piccoli e coesi: restano file)
- [ ] `backend/equipe/messages.py` (385 righe, 16 funzioni) — **coeso**: template, mittenti, lettura/
      scrittura e endpoint sono un solo dominio. Non splittare senza un problema
      concreto (Guide.md §6). Valutato il 2026-11-20, lasciato file.
- [ ] `main.py`: resta alla root come entry point (uvicorn e Docker).

## Note

- `backend/equipe/quotes/facturation/models.py` usa gli asset in `backend/equipe/quotes/modeles/`
  (fonts, docx) con `Path(__file__).parent.parent`: spostarli insieme.
