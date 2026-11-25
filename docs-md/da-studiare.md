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

## Sottodomini, CNAME e dominio fuori dal codice (25/11/2026)

**Come si forma un nome.** Su IONOS si lavora dentro la zona `chezmarthe.org`: il « Nom d'hôte » `equipe`
diventa `equipe` + `.` + `chezmarthe.org` = `equipe.chezmarthe.org`. La `@` vuol dire « il dominio stesso »
(`chezmarthe.org`, senza niente davanti).

**Cosa fa un `CNAME`.** Dice solo **dove trovare l'indirizzo IP**, non cambia l'indirizzo che si vede:

1. il visitatore scrive `equipe.chezmarthe.org`;
2. il DNS risponde: « è un soprannome di `chezmarthe.org`, che sta a `34.155.50.2` »;
3. il browser si collega a `34.155.50.2`, ma nella barra resta `equipe.chezmarthe.org` e lo comunica al server;
4. Caddy e l'app leggono quel nome, vedono `equipe` davanti e mostrano lo spazio équipe.

Come un numero di telefono condiviso: nomi diversi, stesso numero; una volta arrivati ognuno dice con chi vuole parlare.

**Lo schema scelto** (un solo indirizzo da cambiare il giorno del cambio di server):

```
chezmarthe.org   A      34.155.50.2      ← l'unico posto con l'indirizzo
www              CNAME  chezmarthe.org
equipe           CNAME  chezmarthe.org
residents        CNAME  chezmarthe.org
benevoles        CNAME  chezmarthe.org
partenaires      CNAME  chezmarthe.org
```

La `@` non può essere un `CNAME`: un nome con un `CNAME` non può avere altri record, e sulla `@` ci sono i record
delle email (`MX`, `TXT` SPF).

**Il dominio non è scritto nel codice.** Sta solo nella configurazione della VM e nel DNS:

| Dove | Cosa | A cosa serve |
| --- | --- | --- |
| `deploy/.env` → `SITE_HOSTS` | `chezmarthe.org, equipe.chezmarthe.org, …` | dice a Caddy per quali nomi chiedere i certificati e rispondere |
| `deploy/.env` → `CANONICAL_DOMAIN` | `chezmarthe.org` | dice all'app il dominio "ufficiale" (rimanda `www.` lì) |
| `deploy/.env` → `OLD_DOMAINS` | `34-155-50-2.sslip.io` | dice all'app quali domini vecchi rimandare a quello ufficiale |
| IONOS | i record DNS | dicono a Internet che quei nomi stanno sulla VM |

Il sito ricava il dominio dall'indirizzo nel browser (`frontend/src/shared/lib/spaces.js`): `spaceFromHost()` guarda
la prima parte del nome e sceglie lo spazio; `spaceUrl()` costruisce i link agli altri spazi partendo dal dominio
attuale. Così lo stesso codice funziona su `localhost`, `localtest.me`, `sslip.io`, `chezmarthe.site` (demo) e
`chezmarthe.org` (produzione): passando da `sslip.io` a `chezmarthe.org` non si è toccata una riga di codice, solo il
`.env` e il DNS. Regola da ricordare: **la configurazione sta nell'ambiente, non nel codice.**

## Ordine giusto: prima il DNS, poi il certificato (25/11/2026)

Spostando `www.chezmarthe.org` da Odoo alla VM servono due operazioni: il record DNS su IONOS e il nome in
`SITE_HOSTS` sulla VM (perché Caddy chieda il certificato HTTPS). L'idea di fare **prima la VM** sembra prudente,
ma è l'ordine sbagliato, per come Let's Encrypt rilascia i certificati.

**Let's Encrypt verifica il nome collegandosi ad esso** (la "sfida" ACME): per dare il certificato di
`www.chezmarthe.org` si collega a quel nome e controlla che risponda il server che lo chiede.

- **Prima la VM, poi il DNS**: `www` punta ancora a Odoo, Let's Encrypt va su Odoo, non trova la prova e
  **rifiuta**. Caddy riprova da solo ma aspetta sempre di più (1, 2, 5, 10, 20 minuti…): quando poi il DNS cambia, il
  prossimo tentativo può arrivare tardi, e intanto chi arriva su `www` alla VM vede un errore di certificato. In più
  Let's Encrypt limita i tentativi falliti per lo stesso nome (*rate limit*).
- **Prima il DNS, subito dopo la VM**: quando Caddy chiede il certificato, `www` punta già alla VM e la verifica
  riesce **al primo colpo**, in pochi secondi. Il "buco" è al massimo il minuto tra le due operazioni, e tocca pochi
  visitatori, perché quasi tutti hanno ancora Odoo in memoria per un'ora (TTL del vecchio record).

**Come ridurre il buco**: preparare prima il file sulla VM senza applicarlo (`sed` su `.env`), poi salvare il DNS,
aspettare che IONOS lo pubblichi (circa 1 minuto, si controlla con `dig`), e solo allora `docker compose up -d`.

Da approfondire: le sfide ACME (`HTTP-01`, `TLS-ALPN-01`, `DNS-01`) e i *rate limit* di Let's Encrypt.

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
