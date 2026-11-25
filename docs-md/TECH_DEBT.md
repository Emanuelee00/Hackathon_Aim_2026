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
- [ ] `backend/features/equipe/opportunities.py`, `backend/features/equipe/profiles.py`, ... (piccoli e coesi: restano file)
- [ ] `backend/features/equipe/messages.py` (385 righe, 16 funzioni) — **coeso**: template, mittenti, lettura/
      scrittura e endpoint sono un solo dominio. Non splittare senza un problema
      concreto (Guide.md §6). Valutato il 2026-11-20, lasciato file.
- [x] `main.py` spostato in `backend/main.py` (25/11/2026): `uvicorn --app-dir backend`, niente più `sys.path` in `backend/__init__.py`.

## Note

- `backend/features/equipe/quotes/facturation/models.py` usa gli asset in `backend/features/equipe/quotes/modeles/`
  (fonts, docx) con `Path(__file__).parent.parent`: spostarli insieme.

- [ ] Dipendenza circolare tra package (Guide §0): `features/equipe/quotes/facturation`
      importa `french_date` da `features/public/confirmations`, che a sua volta importa
      `features/equipe/messages`; e `features/sharing/routes` importa
      `features/equipe/funding/backup`. Nessun ciclo tra moduli (tutto funziona), ma tra
      package sì. Rimedio semplice: spostare `french_date` in `core/`. Trovato il 25/11/2026,
      c'era già prima dello spostamento in `public/`.
