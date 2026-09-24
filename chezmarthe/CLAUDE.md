# Chez Marthe : plateforme de gestion des espaces (hackathon)

Ce fichier résume tout le travail de cadrage et de prototypage fait en amont. Lis-le en entier avant de modifier le code. Langue du projet : français (interface, textes, commits si possible).

## 1. Le contexte

**Chez Marthe** est une association qui gère un lieu hybride :
- un **centre d'hébergement** pour des femmes et leurs enfants (c'est la vocation première, et la contrainte numéro un) ;
- un **tiers-lieu** : chapelle désacralisée, jardin avec buvette, salon collectif, cantine solidaire, salle de réunion, coworking, salles de soin ;
- des **associations hébergées** : Benenova (bénévolat, permanence hebdomadaire), Sista4good (gère le coworking et les salles de soin ; Chez Marthe veut reprendre cette partie sur les prochains lieux, sujet sensible), Les Petites Cantines (cantine à prix libre, réseau national qui essaime dans plusieurs villes).

L'objectif du hackathon est une **démo** (pas un produit en production), présentée cet après-midi.

### Problème principal

Chez Marthe reçoit plus de demandes d'occupation qu'elle ne peut en traiter, et tout est manuel :
- **Demandes éclatées** : mail, Instagram, téléphone, Linktree, puis deux Google Forms (programmation / location) qui alimentent un Excel.
- **Tri manuel** : recherche sur la personne ou l'association, vérification de l'alignement avec la charte de programmation, visite, puis décision en **comité de coordination une fois par semaine (vendredi)**.
- **Pas de vue centralisée** : un Google Agenda partagé, mais chaque association hébergée utilise son propre outil.
- **Tarification à redéfinir** : location vs privatisation, jauge, impact sur le lieu, rémunération des personnes qui travaillent.
- **Logistique** : quels bénévoles pour l'événement, quels besoins techniques (éclairage et son de la chapelle).
- **Suivi absent** : tout devrait être enregistré pour la compta, suivi d'un questionnaire de satisfaction (dont « des femmes hébergées sont-elles venues ? »).
- **Pas de statistiques d'impact** : mixité des usages (résidentes, coworkers, quartier), profils hébergés (étudiantes précaires, femmes qui voyagent, aidantes). Nécessaires pour les financeurs et le storytelling.

Fil rouge à respecter partout : **protéger le calme et l'intimité des femmes hébergées** tout en restant ouvert au quartier.

### Les espaces (source : PDF Canva de l'association)

| Espace | Surface | Tarifs location | Contraintes |
|---|---|---|---|
| La chapelle | 114 m² | 2 h 40 €, ½ j. 100 €, journée 200 € ; cours hebdo d'1 h 30 € | Acoustique : pas de projection de films |
| Le jardin | – | 2 h 40 €, ½ j. 100 €, journée 200 € | Espace partagé, non clos, buvette jeudi soir, ateliers le week-end. L'association se demande si le louer a du sens |
| Le salon collectif | 28 m² | ½ j. 80 €, journée 150 € | Espace de vie des résidentes le soir et le week-end, pas de casiers ni paperboard |
| Les Petites Cantines | 32 m² + terrasse 30 m² | privatisable, tarif non défini | Cantine partagée et solidaire |
| Salle de réunion | 16 m² | non défini | Jamais utilisée pour l'instant |
| Coworking | – | non défini | Géré aujourd'hui par Sista4good |

Outils existants : Google Form programmation, charte de programmation (docx), tableur du comité de programmation, Google Form location, Canva des espaces. Liens privés, contenu de la charte non connu à ce stade.

## 2. Le cadrage (arbre de problèmes)

Question racine :

> Comment pourrions-nous faciliter la gestion et l'animation des espaces Chez Marthe, de la demande d'occupation au bilan de l'événement, afin de faire vivre des lieux à la fois économiquement viables, utiles aux femmes hébergées et reproductibles dans d'autres territoires ?

Cinq axes. Les leviers marqués **[démo]** sont dans le prototype, les autres sont la feuille de route.

1. **Réduire la charge** (bénévoles et salariées)
   - Guichet unique pour les demandes [démo]
   - Pré-analyse selon la charte [démo]
   - Réponses et visites automatisées [démo]
2. **Augmenter les revenus** (modèle économique viable)
   - Grille tarifaire claire (décision politique de l'association, ne pas trancher à sa place)
   - Optimiser l'occupation des espaces [démo]
   - Recherche de financements (idée : agent automatisé)
3. **Servir les femmes hébergées** (calme, place, participation)
   - Protéger le calme et l'intimité [démo, via les alertes et la pré-analyse]
   - Encourager leur participation (nécessite de les former)
   - Mesurer leur venue via les retours [démo]
4. **Rendre reproductible** (essaimer sur d'autres lieux)
   - Process et outils standardisés
   - Tableau de bord d'impact [démo]
   - Kit de déploiement pour de nouveaux lieux
5. **Fédérer les associations** (vers l'outil commun), à lire comme un plan d'adoption
   - Cartographier leurs outils et besoins
   - Synchroniser leurs agendas existants [démo]
   - Pilote avec une association volontaire (proposition : **Benenova**, usage simple et peu d'enjeux ; Sista4good est le cas le plus délicat)
   - Référent·e et formation par association

Principes de conception retenus :
- **Rester proche des outils existants** (Google Forms/Sheets/Agenda) : l'adoption compte plus que la sophistication.
- **Les humains décident, l'IA prépare** : le comité et la charte restent souverains.
- **Utilisable en 30 secondes sans formation** (bénévoles qui tournent, faible culture numérique).
- Ne pas demander aux associations d'abandonner leurs outils : synchroniser d'abord.

## 3. Le prototype

Site statique, cinq pages, une par sous-domaine prévu de `chezmarthe.ovh` :

| Dossier | Sous-domaine | Contenu |
|---|---|---|
| `accueil/` | chezmarthe.ovh | Plan cliquable des espaces, formulaire guichet unique, estimation de prix et alertes en direct, écran de confirmation avec étapes |
| `equipe/` | equipe.chezmarthe.ovh | Onglets : demandes pré-analysées (4 exemples), comité de vendredi (kanban aligné / à discuter / hors charte / décidé), agenda de la semaine par espace avec conflit, tableau de bord d'impact |
| `partenaire/` | partenaire.chezmarthe.ovh | Sélecteur Benenova / Sista4good / Petites Cantines, créneaux, synchronisation d'agenda simulée, réservation, checklist d'arrivée |
| `benevole/` | benevole.chezmarthe.ovh | Missions à pourvoir avec jauges et inscription, mes engagements, formation régie ouverte aux résidentes |
| `retour/` | retour.chezmarthe.ovh | Bilan post-événement : note, fréquentation, participation des résidentes, logistique, commentaire |

### Structure du code

```
chezmarthe/
  CLAUDE.md          ce fichier
  src/               SOURCES À MODIFIER
    common.css       styles partagés (tokens, composants)
    nav.js           menu inter-sites, cmLink(), cmToast()
    build.py         assemble chaque page en un index.html autonome
    accueil.html     CSS spécifique, puis <!--/css-->, puis le corps de page et son script
    equipe.html
    partenaire.html
    benevole.html
    retour.html
  accueil/index.html etc.   FICHIERS GÉNÉRÉS, ne pas éditer à la main
```

Pour modifier : éditer `src/`, puis `cd src && python3 build.py`. Le script injecte le CSS commun, l'en-tête, le bandeau « Démonstration hackathon, données fictives », le menu et `nav.js` dans chaque page, et écrit `../<page>/index.html`.

Navigation : `cmLink()` pointe vers `https://<sous-domaine>.chezmarthe.ovh/` quand le site tourne sur ce domaine, sinon vers `../<page>/index.html` (utile en local).

### Identité visuelle

- Polices : **Anton** (titres, reprise des visuels Canva de Chez Marthe) et **Atkinson Hyperlegible** (texte, choisie pour la lisibilité), via Google Fonts avec repli système.
- Couleurs : encre `#1E1A2B`, fond `#F5F6F8`, violet « vitrail » `#4B32C3` (action principale), vert « jardin » `#1F7A55` (validé), ocre `#B7801A` (à discuter), brique `#B93A32` (alerte/refus).
- Élément signature : le **plan du lieu** en page d'accueil, dessiné comme un plan d'architecte, avec l'hébergement hachuré et non réservable.
- Accessibilité : focus visible, `prefers-reduced-motion` respecté, erreurs de formulaire affichées sous les champs, responsive jusqu'au mobile.

### Données et limites (à dire au jury)

- **La pré-analyse est scénarisée** : les verdicts et critères des 4 demandes sont écrits en dur dans `equipe.html` (tableau `R`). Aucune IA n'est appelée. Les alertes du formulaire public sont de simples règles JS.
- **Données inventées** : jauges (chapelle 90, jardin 150, salon 15, cantine 30, réunion 8, coworking 12), chiffres d'impact, demandes, missions bénévoles, outils actuels des associations (hypothèses à vérifier avec elles). La majoration privatisation (×1,5) est aussi une hypothèse.
- **Données réelles** : tarifs, surfaces et contraintes des espaces (PDF de l'association), noms des associations hébergées, fonctionnement du comité du vendredi.
- Aucune persistance : tout est en mémoire, un rechargement remet à zéro.

### Parcours de démo conseillé

1. Accueil : cliquer la chapelle sur le plan, cocher « Vidéoprojecteur », monter la jauge à 120, pour faire apparaître les alertes. Envoyer la demande.
2. Équipe : ouvrir la projection du documentaire, montrer la pré-analyse et « Préparer une réponse ».
3. Comité de vendredi : valider ou refuser une carte.
4. Agenda : montrer le conflit du mardi 18 h et la salle de réunion vide (argument revenus).
5. Associations : synchroniser l'agenda de Sista4good, un conflit apparaît.
6. Bilan puis Impact : boucler sur les chiffres pour les financeurs.

## 4. Mise en ligne

1. Acheter `chezmarthe.ovh` chez OVH.
2. Déposer chaque dossier généré sur Netlify Drop (ou Cloudflare Pages / GitHub Pages).
3. Zone DNS OVH : un CNAME par sous-domaine (`equipe`, `partenaire`, `benevole`, `retour`) vers le site Netlify correspondant, et le domaine racine vers le site `accueil`. Déclarer chaque domaine dans les réglages Netlify.
4. Prévoir jusqu'à une heure de propagation DNS. Garder les adresses `.netlify.app` en secours.

## 5. Pistes si on continue après la démo

- Brancher une vraie pré-analyse via l'API Claude (côté serveur, jamais de clé dans le front), en lui donnant la charte de programmation comme référence.
- Remplacer les données en dur par un Google Sheet (ou une petite base) pour garder la compatibilité avec leurs outils.
- Synchronisation réelle Google Agenda / iCal pour les associations hébergées.
- Envoi réel des e-mails de réponse et du questionnaire de bilan après chaque événement.
- Travailler avec l'association la grille tarifaire et la règle location vs privatisation avant de les coder.
- Recueillir auprès de Chez Marthe : contenu de la charte, jauges réelles, outils réels de chaque association.
