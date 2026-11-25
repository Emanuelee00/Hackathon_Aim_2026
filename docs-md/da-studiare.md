# Da studiare

Appunti personali: concetti incontrati lavorando su Chez Marthe, da approfondire.

## Certificate Transparency e bot che scansionano i siti (25/11/2026)

Appena Caddy ha ottenuto i certificati HTTPS di `chezmarthe.org`, nei log sono comparse centinaia di richieste
a percorsi come `/.env`, `/.git/HEAD`, `/backup.sql`, `/wp-config.php`, `/.ssh/id_rsa`.

- Ogni certificato HTTPS emesso (per esempio da Let's Encrypt) viene registrato in **registri pubblici** chiamati
  **Certificate Transparency logs** (CT logs). Servono a scoprire certificati emessi per errore o con frode.
- Chiunque può leggere quei registri, quindi anche i **bot**: vedono un nome nuovo e in pochi secondi provano a
  scaricare file lasciati per sbaglio sui server (password in `.env`, backup del database, chiavi SSH, la cartella
  `.git` con tutto il codice, file di WordPress…).
- Succede a **ogni** sito appena pubblicato. Non è un attacco mirato, è rumore di fondo di Internet.
- Da noi non trovano niente: il server serve solo il frontend compilato e l'API; i percorsi sconosciuti portano alla
  home. Verificato il 25/11/2026.

Da approfondire: cos'è un CT log, il sito <https://crt.sh> (cercare `chezmarthe.org` per vedere i propri
certificati), perché non bisogna mai mettere `.env` o backup nella cartella servita dal web server.

## Altri concetti di oggi

- **DNS**: i tipi di record `A` (indirizzo IPv4), `AAAA` (IPv6), `CNAME` (soprannome di un altro nome),
  `MX` (email), `TXT`, `NS`; perché un nome non può avere insieme `CNAME` e `A`.
- **TTL** (*Time To Live*): quanto a lungo i risolutori DNS ricordano una risposta; perché si abbassa prima di
  un cambio e si rialza dopo; il TTL che conta è quello del record **vecchio**.
- **Reverse proxy** (Caddy, nginx) e differenza con un proxy normale; HTTPS automatico con Let's Encrypt.
- **Docker**: immagine, container, volume; cosa cambia con `docker compose up -d --build`; immagini senza nome
  (*dangling*) e `docker image prune`; perché `-a` in `prune` è pericoloso.
- **SSH con chiavi**: chiave privata e pubblica, `authorized_keys`, passphrase, perché la VM rifiuta le password.
- **Git**: tag e branch (un tag non si sposta), `git pull`, riscrivere la storia e `push --force-with-lease`.
- **Backup**: la regola 3-2-1 (3 copie, 2 supporti, 1 fuori sede); un backup mai ripristinato non è un backup.
- **npm ci** e **npm install**; il lockfile (`package-lock.json`, `uv.lock`) e le build riproducibili.
