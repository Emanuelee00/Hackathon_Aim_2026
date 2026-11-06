# Lavorare sulle immagini del sito (Canva, Figma…)

## 1. Vedere le pagine in Canva
`make canva-pdf` (con il sito acceso su http://localhost:8010) crea in `design/canva/`
un PDF per ogni pagina, in versione telefono e computer:
`accueil-telephone.pdf`, `accueil-ordinateur.pdf`, `nos-espaces-…`, `notre-equipe-…`.

In Canva: **Crea un design → Importa file** → scegli il PDF. Testi e immagini sono modificabili.
Serve per provare idee e preparare le foto: il sito vero resta nel codice.

## 2. Cambiare una foto del sito
1. Esporta la foto (da Canva: **Condividi → Scarica → JPG o PNG**).
2. Rinominala con il nome dello spazio foto (elenco qui sotto) e mettila in `design/images/`.
   Esempio: `espace-chapelle.jpg`.
3. Lancia `make images`: la foto viene ridimensionata, convertita e messa al suo posto nel sito.
   Le foto importate passano in `design/images/done/`.
4. Ricarica il sito e controlla. Le foto verticali vanno bene per « haut-de-page » e « lieu-panneaux ».

| Nome file (senza estensione) | Dove appare |
|---|---|
| `haut-de-page` | Grande foto in alto |
| `lieu-panneaux` | « Notre premier lieu », foto grande |
| `pilier-se-loger`, `pilier-se-reconstruire`, `pilier-se-nourrir`, `pilier-rayonner` | I 4 pilastri |
| `espace-chapelle`, `espace-salon`, `espace-bureau`, `espace-atelier` | Schede « Louer un espace » |
| `logo` | Logo nella barra (PNG trasparente) |
| `partenaire-has`, `partenaire-just`, `partenaire-petites-cantines`, `partenaire-sista4good`, `partenaire-benenova` | Loghi dei partner |

Dettagli (larghezza, file di destinazione): `design/images/slots.json`.
