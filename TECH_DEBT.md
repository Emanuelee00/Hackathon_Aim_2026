# Debito tecnico

Problemi trovati durante il refactor, **fuori scope** dei rispettivi commit.
Si affrontano in una passata dedicata, alla fine.

## Ruff — errori preesistenti

Trovati il 2026-11-20 durante il pilota `mailer/`. Non introdotti dal refactor.

- [ ] `chezmarthe/src/build.py` — I001 (import non ordinati), F401 (`sys` non usato),
      SIM115 (file aperti senza context manager). Script HTML legacy, probabilmente obsoleto:
      decidere se cancellarlo o riscriverlo.
- [ ] `tests/test_bilans.py` — errore ruff (da dettagliare)
- [ ] `tests/test_confirmations.py` — errore ruff (da dettagliare)
- [ ] `tests/test_editeur.py` — errore ruff (da dettagliare)
- [ ] `tests/test_espaces.py` — errore ruff (da dettagliare)
- [ ] `tests/test_funding.py` — errore ruff (da dettagliare)
- [ ] `tests/test_messages.py` — errore ruff (da dettagliare)
- [ ] `tests/test_modeles.py` — errore ruff (da dettagliare)
- [ ] `tests/test_profils.py` — errore ruff (da dettagliare)
- [ ] `tests/test_prospection.py` — errore ruff (da dettagliare)
- [ ] `tests/test_reminders.py` — errore ruff (da dettagliare)

## Refactor pacchetti backend (in corso)

- [x] `mailer.py` → `mailer/` (pilota)
- [x] `ranking.py` → `ranking/`
- [ ] `demo.py` → `demo/`
- [ ] `gcal.py` → `gcal/`
- [ ] `matching.py`, `profils.py`, `messages.py`, ...
- [ ] `main.py`: **non toccare** (punto d'ingresso)

## Note

- `modeles.py` è un file, ma esiste già la cartella asset `modeles/` (fonts, docx):
  non rinominarlo in `modeles/routes.py` senza prima spostare gli asset.
