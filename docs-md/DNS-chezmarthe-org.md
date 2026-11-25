# DNS de chezmarthe.org

Les enregistrements sont gérés chez **IONOS** (Domaines & SSL → `chezmarthe.org` → DNS).
Ces informations sont publiques (n'importe qui les lit avec `dig`) : aucun secret ici.

## État avant la bascule vers la VM (relevé le 25 novembre 2026)

| Nom | Type | Valeur | TTL | Rôle |
| --- | --- | --- | --- | --- |
| `chezmarthe.org` (`@`) | — | **aucun enregistrement A** | — | le domaine nu ne menait nulle part |
| `www` | `CNAME` | `chezmarthe1.odoo.com.` (IP `34.141.22.9`) | 3600 | **ancien site Odoo** |
| `@` | `MX` | `10 mx00.ionos.fr.` et `10 mx01.ionos.fr.` | 3600 | e-mails — ne pas toucher |
| `@` | `TXT` | `"v=spf1 include:_spf-eu.ionos.com ~all"` | 3600 | SPF des e-mails — ne pas toucher |
| `_dmarc` | `CNAME` | `dmarc.ionos.fr.` (`"v=DMARC1; p=none;"`) | 3600 | DMARC — ne pas toucher |
| `s1-ionos._domainkey` | `CNAME` | `s1.dkim.ionos.com.` | 3600 | DKIM — ne pas toucher |
| `s2-ionos._domainkey` | `CNAME` | `s2.dkim.ionos.com.` | 3600 | DKIM — ne pas toucher |
| `autodiscover` | `CNAME` | `adsredir.ionos.info.` | 3600 | configuration des boîtes mail — ne pas toucher |
| `_domainconnect` | `CNAME` | `_domainconnect.ionos.com` | — | service IONOS (Domain Connect) — ne pas toucher |
| `@` | `NS` | `ns1073.ui-dns.biz.`, `ns1077.ui-dns.de.`, `ns1080.ui-dns.com.`, `ns1122.ui-dns.org.` | 86400 | serveurs DNS d'IONOS |

## État après la bascule (25 novembre 2026)

Un seul enregistrement porte l'adresse de la VM ; les autres noms la suivent. Le jour du changement de serveur,
on ne modifie que la première ligne.

| Nom | Type | Valeur | TTL |
| --- | --- | --- | --- |
| `@` | `A` | `34.155.50.2` | 1 min |
| `www` | `CNAME` | `chezmarthe.org` | 1 min |
| `equipe`, `residents`, `benevoles`, `partenaires` | `CNAME` | `chezmarthe.org` | 1 min |
| `bilan` | — | pas d'enregistrement (le bilan deviendra la page `chezmarthe.org/bilan`) | — |

Les enregistrements des e-mails (`MX`, `TXT` SPF, `_dmarc`, DKIM, `autodiscover`) et `_domainconnect` n'ont pas
été touchés. Sur IONOS, ajouter `@` propose aussi d'ajouter `www` : cliquer « Ne pas ajouter l'enregistrement DNS
pour www » tant que `www` doit rester ailleurs.

## Bascule vers la VM (Google Cloud, IP `34.155.50.2`)

Ajouter (et remplacer **seulement** `www`) : enregistrements `A` vers `34.155.50.2` pour `@`, `www`, `equipe`,
`residents`, `benevoles`, `partenaires`, `bilan`, avec un TTL au plus bas. Puis `deploy/.env` sur la VM
(procédure complète : `deploy/README.md`, étape 2).

## Revenir à l'ancien site Odoo

1. Sur IONOS : remettre `www` en `CNAME` → `chezmarthe1.odoo.com.` (TTL 3600) et supprimer les enregistrements
   ajoutés pour la VM (`A` `@` ; `CNAME` `equipe`, `residents`, `benevoles`, `partenaires`).
2. Sur Odoo : remettre `www.chezmarthe.org` comme domaine du site, si on l'avait retiré.
3. L'ancien site reste de toute façon joignable à l'adresse `https://chezmarthe1.odoo.com`.
