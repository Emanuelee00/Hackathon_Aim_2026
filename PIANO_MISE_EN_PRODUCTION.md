> **Nota (12/11/2026):** piano scritto il 2 novembre, in parte superato (ora si usa Caddy e il sito segue `main`). Stato aggiornato in `TODO.md` e `CONTESTO_SESSIONE.md`. Resta valido come promemoria di sicurezza e di rollback.

# Piano: mettere sul server vero le modifiche (home, Financements, Messages)

**Regola d'oro: finché tu non dici "via" non si tocca il server.** Ogni fase dice cosa si fa, come si controlla e come si torna indietro.

## Cosa andrebbe online (verificato nel repo)
- Il branch `design` ha **85 commit** in più di `main` e **0 indietro**: contiene già tutto `main`, quindi l'unione è un avanzamento semplice.
- **Nessuna migrazione del database** nuova (nessun file in `migrations/` toccato). Le nuove informazioni (data di obtention, data di rimando, indirizzi, testi dei messaggi) sono salvate come documenti nel database esistente: non serve cambiare le tabelle.
- Unica dipendenza nuova: `cryptography` (per Google Agenda). Si installa da sola durante la ricostruzione dell'immagine.
- `deploy/docker-compose.yml` ha solo variabili nuove **facoltative** per le email: senza, non cambia niente e nessuna email parte.
- Il server segue il branch **`main`** (`deploy/README.md`): quello che finisce su `main` va online al prossimo aggiornamento.

## Cose da sapere prima (stato di oggi)
1. **`chezmarthe.site` risponde errore 530** (Cloudflare non trova più il vecchio tunnel) e **`chezmarthe.org` non risponde**: la tappa 1 del `deploy/README.md` (DNS di `.site` verso la VM) risulta **ancora da fare o non finita**. La porta 443 della VM (34.155.50.2) è aperta, ma non so cosa serva oggi.
2. **Le modifiche di temp2 NON sono nel repo principale**: la nuova sezione "Nos évènements", gli slogan, l'intro 3D e altre rifiniture di temp2 stanno in un altro repo. Nel repo principale (`design`) c'è il redesign della home fatto prima. **Va deciso cosa portare** e questo è un lavoro a parte.
3. **`comptes.txt` è tracciato in Git** (con gli account di demo e la loro password): sul server **non si deve mai eseguire `make seed`**, e va tolto dal repo o tenuto privato.
4. Le variabili Google Agenda **non arrivano al container** (`GOOGLE_*` non sono nel compose): serve una piccola modifica prima di collegare il calendario.
5. Sulla VM non posso entrare io: i comandi della fase 3 li lanci tu (o mi dai accesso come stabilito).

---

## Fase 0: decisioni (tue)
- [ ] Tappa 1 (`chezmarthe.site`) come primo test online, e poi `chezmarthe.org`: ok?
- [ ] Portare in `main` anche i cambiamenti di temp2 (Nos évènements, slogan, intro)? Sì / no / dopo.
- [ ] Servizio email: Gmail (password per app) o Resend. Si può anche attivare **dopo**.
- [ ] Chi ha accesso a: Google Cloud (SSH alla VM), Cloudflare, IONOS.

## Fase 1: preparazione in locale (la faccio io, senza toccare il server)
1. Test automatici di backend e front-end tutti verdi, controllo di stile.
2. **Prova "come in produzione"** sul tuo computer: build con `VITE_AI=off`, backend senza ricarica automatica (`MARTHE_AI=0`), su una copia del database. Docker non è installato qui, quindi non si prova l'immagine vera, ma una prova equivalente. Si guardano: home (sito e telefono), "Notre premier lieu", spazi, partner, programmazione, modulo di richiesta, contatti, e per l'équipe Financements e Messages. In questa prova non c'è il login automatico (esiste solo in sviluppo).
3. Revisione del diff (91 file) con attenzione a sicurezza: nuovi percorsi (`/api/messages`, `/api/funders/reminders/*`) riservati all'équipe, il percorso del cron protetto da segreto, nessuna chiave nel codice.
4. Commit separato di configurazione: passare `GOOGLE_*` al container e aggiornare `.env.example`.
5. Togliere `comptes.txt` dal repo (o spostarlo fuori).
6. Aggiornare `TODO.md` e questo piano con quello che è cambiato.

## Fase 2: unire in `main` (quando dici "via")
1. **Rete di sicurezza:** creo un tag sul `main` di oggi (`pre-design-2026-11`) e lo pubblico: è il punto a cui tornare.
2. Apro una **Pull Request** `design` → `main` su GitHub (per rivedere l'elenco dei cambiamenti), poi unisco. (Alternativa più veloce: avanzamento diretto, senza PR.)
3. **Il push su `main` non cambia ancora il server**: la VM aggiorna solo quando fai `git pull` lì. Ma riparte il deploy automatico dei progetti Vercel collegati.

## Fase 3: sul server (solo dopo "via", comandi da lanciare sulla VM)
1. **Controllo dello stato attuale**, senza modificare:
   ```sh
   cd ~/marthe && git log -1 --oneline && git status -s && cd deploy && docker compose ps
   ```
   Annotare l'ID del commit attuale (serve per tornare indietro).
2. **Backup del database** e del file di configurazione:
   ```sh
   docker compose exec db pg_dump -U marthe marthe | gzip > ~/marthe-$(date +%F-%H%M).sql.gz
   cp ~/marthe/deploy/.env ~/env-backup-$(date +%F)
   ```
   Controllare che il file di backup non sia vuoto (`ls -lh ~/marthe-*.sql.gz`).
3. **Vedere cosa cambierebbe**, senza applicare: `git fetch && git diff --stat HEAD origin/main | tail`.
4. Aggiornare `deploy/.env` **solo se serve** (nessuna variabile nuova è obbligatoria).
5. **Aggiornare in due tempi, così il sito resta acceso quasi sempre:**
   ```sh
   cd ~/marthe && git pull
   cd deploy
   docker tag deploy-app:latest deploy-app:precedente      # copia della versione attuale: ritorno in pochi secondi
   docker compose build app                                 # costruisce la nuova versione MENTRE quella vecchia continua a servire
   docker compose up -d app                                 # solo ora cambia: stacco di pochi secondi, Postgres e Caddy non si fermano
   ```
   (Il nome dell'immagine si legge con `docker compose images`.) La costruzione (1-3 minuti) **non interrompe niente**: lo stacco è solo il cambio del contenitore, di norma 10-30 secondi. Nessuno viene disconnesso (le sessioni stanno nel database) e nessun dato viene toccato. Le migrazioni partono da sole e questa volta non ce ne sono di nuove.
6. **Controllo subito dopo:** `docker compose logs --tail=80 app` senza errori; `docker compose ps` con tutti "Up"; `curl -I https://…/` risponde 200.

## Fase 3 bis (consigliata, prima di partire): far aspettare i visitatori invece di mostrare un errore
Piccola modifica a `deploy/Caddyfile` (la preparo io): `reverse_proxy app:8000 { lb_try_duration 30s  lb_try_interval 500ms }`. Durante i pochi secondi del cambio, Caddy **aspetta fino a 30 secondi** che l'app torni, e chi sta navigando vede solo una pagina che ci mette un po' di più, senza errore. Si applica senza fermare il sito: `docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile`.

## Fase 4: verifiche sul sito vero (checklist)
- [ ] Home: versione desktop e telefono, "Notre premier lieu" e freccia, partner, "Nous soutenir", contatti.
- [ ] Modulo di richiesta: inviarne una **di prova**; compare nelle richieste dell'équipe; poi eliminarla.
- [ ] Pagina Contatti: messaggio di prova arriva in "Questions reçues".
- [ ] Accesso équipe con l'**account vero** (non quelli demo).
- [ ] Financements: le piste di sempre ci sono, le colonne "Obtenu le" e "Relance le" sono vuote/di default, l'esportazione in Excel funziona, il menu si chiude con la linguetta.
- [ ] Messages: i tre testi sono quelli originali e il badge dice "À brancher" (nessuna email parte).
- [ ] Nessun account `@marthe.fr` di demo presente tra gli utenti.

## Fase 5: attivare le email (separata, anche giorni dopo)
1. Mettere nel `deploy/.env`: `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASSWORD` (Gmail con password per app) oppure `RESEND_API_KEY`, e `MAIL_FROM`, `CONTACT_EMAIL`. **La chiave non si scrive in chat.**
2. `docker compose up -d` (ricrea solo l'app).
3. Dalla scheda di un finanziatore premere **"Envoyer un e-mail de test"**; poi un modulo di prova con una tua email.
4. Impostare da Messages l'indirizzo "Bonjour Chez Marthe" e le date di obtention.

## Fase 6: se qualcosa va storto (tornare indietro)
- **Sito rotto dopo l'aggiornamento (ritorno rapido, senza ricostruire):** rimettere l'immagine `precedente` e `docker compose up -d app` (pochi secondi). Se serve anche il codice vecchio: `cd ~/marthe && git checkout <ID annotato in fase 3.1>`. Il database non ha cambiamenti di struttura, quindi **non serve ripristinarlo**. I nuovi campi dei documenti sono ignorati dalla vecchia versione.
- **Dati rovinati** (caso raro): ripristino dal backup della fase 3.2: `gunzip -c ~/marthe-….sql.gz | docker compose exec -T db psql -U marthe marthe` (solo dopo averne parlato).
- **Su GitHub:** il tag `pre-design-2026-11` indica il `main` di prima.

## Per aggiornare il sito in futuro senza stoppare niente
- Scegliere un momento tranquillo (mattina presto o dopo le attività serali) e avvisare l'équipe.
- Prima provare la nuova versione **in parallelo sulla stessa VM** (un secondo contenitore su un indirizzo di prova, con una copia del database), poi cambiare quella vera.
- Le modifiche al database in due tempi: prima si aggiunge (compatibile con la versione vecchia), solo dopo si toglie quello che non serve. Così vecchia e nuova versione possono convivere.
- Se un giorno servisse "zero secondi di stacco": due contenitori dell'app (blu e verde) con Caddy che passa dall'uno all'altro. Per un sito usato da poche persone di solito non serve.

## Mai fare (per non danneggiare il server)
- `docker compose down -v` o cancellare il volume `pgdata`: **cancella tutti i dati**.
- `make seed` sul server (crea account demo con password nota).
- Toccare i record `MX`, `TXT`, `_domainkey`, `_dmarc`, `autodiscover` su IONOS: sono le email dell'associazione.
- Pubblicare `deploy/.env`, chiavi o `secrets/` in Git. Nessun `git push --force` su `main`.

## Scadenze collegate
- **Prima della fine di gennaio 2027:** passare l'account Google Cloud a "compte complet", altrimenti la VM si ferma.
- Dominio `.org`: tappa 2 del `deploy/README.md` (serve l'accesso a IONOS).
