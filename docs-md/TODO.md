# À faire — Chez Marthe

Dernière mise à jour : 16 novembre 2026. Voir aussi `CONTESTO_SESSIONE.md` (contexte de travail complet).

## ⚠️ Important : sauvegardes automatiques hors de la VM

- [ ] **Sauvegarde automatique de la base de données, chaque nuit, avec une copie hors de la VM.** Aujourd'hui il n'y en a pas : la seule sauvegarde est le `pg_dump` fait à la main avant chaque mise à jour, et elle reste sur la VM. Si la VM est perdue, tout est perdu : demandes, financements, financeurs potentiels, devis et factures, comptes, et maintenant tout le contenu du site modifié par l'équipe (textes, photos envoyées, cartes, ordre des sections). À prévoir : un `pg_dump` quotidien (cron sur la VM), envoyé vers un stockage externe (par ex. un bucket Google Cloud Storage), en gardant plusieurs jours, et un essai de restauration.

## Où en est la mise en ligne (VM Google Cloud `marthe`, adresse de test https://34-155-50-2.sslip.io)

- [x] **Paquet 1** (Financements, Messages, Devis, languette du menu) : en ligne.
- [x] **Paquet 2** (site public refait, « Factures et devis » avec éditeur, Google Agenda) : en ligne ; la programmation du site répond avec les évènements ; clés Google copiées dans `deploy/secrets/`, `GOOGLE_CALENDAR_ID` dans `deploy/.env`.
- [ ] **Paquet 3** (site public pour téléphone, photo HD, plus de flou) : fusionné dans `main` (commit `c013753`), build fait sur la VM. **Reste la bascule** : `docker compose up -d app`, puis contrôle des journaux. Retour rapide : `docker tag deploy-app:precedente deploy-app:latest && docker compose up -d app`.
- Étiquettes de retour arrière sur GitHub : `pre-finanziamenti-messaggi-2026-11`, `pre-sito-pubblico-2026-11`, `pre-sito-mobile-2026-11`.
- [ ] **Vérifier sur le PC avant de garder le paquet 3** : sur ordinateur la première partie des pages change un peu par rapport au paquet 2 (photo HD recadrée, plus de halo derrière les textes, 5 évènements au plus, pastille « Notre manifeste » sous les cartes, titres de presse en entier). Ce sont des demandes validées en aperçu, mais à regarder sur le vrai site.
- [ ] **Paquet 5** (demandes de l'équipe du 11 novembre : lien d'inscription des évènements, équipe du lieu sur l'accueil, Coworking et Cantine à louer, associations du lieu, ordre de l'équipe) : fusionné dans `main` le 12 novembre ; **reste** : mise sur la VM (voir le paquet 4, même procédure). Étiquette de retour : `pre-richieste-equipe-2026-11`.
- [ ] **Paquet 4** (Factures et devis : tarifs à cliquer, aperçu en direct, tarifs modifiables) : fusionné dans `main` (commit `652d52b`) ; **reste** : sauvegarde, `git pull`, build et bascule sur la VM. Étiquette de retour : `pre-devis-tarifs-2026-11`.
- [ ] **Paquet 6** (fenêtre Comptabilité des évènements, PDF identiques aux modèles, page « Financeurs potentiels » avec conseils et mécènes, modèle de message aux financeurs, page d'accueil modifiable par l'équipe (menu « Site »), logos des partenaires à faire glisser au doigt) : poussé sur `main` le 16 novembre ; **reste** : la bascule sur la VM (procédure habituelle). Étiquette de retour : `pre-paquet6-2026-11`. Pas de variable nouvelle ; l'envoi des devis et factures par e-mail marchera dès que le service e-mail sera branché (`SMTP_*` ou `RESEND_API_KEY`, voir plus bas).
- [ ] **Paquet 7** (depuis le paquet 6 : menu « Site » pour modifier toute la page d'accueil, « Bilans des structures », doublons de « Financeurs potentiels » en rouge, barre de défilement collée en bas, espaces personnels « Qui êtes-vous ? » avec menu rangé à la main et fonds, modes ☀ sombre et M violet) : dans `main` (commit `e834c3d`), **à mettre sur la VM** avec les paquets 3 à 6 (un seul `git pull`). Retour arrière : image `deploy-app:precedente` et sauvegarde `pg_dump` du jour ; dans Git, `pre-paquet6-2026-11`.
- [ ] Brancher les **noms de domaine** : `chezmarthe.org` et `.site` ne pointent pas encore vers la VM (voir plus bas).
- [ ] La branche locale `design` et le dépôt d'aperçu `chezmarthe-temp2` ne sont plus la référence : tout ce qui est en ligne vient de `main`. Décider quoi faire de `design` (reprendre depuis `main`, ou l'abandonner). Les validations de temp2 n'ont **pas** été poussées (limite de 100 déploiements par jour sur Vercel).

## Calendrier de l'équipe ↔ Google Agenda

- [x] Programmation du site lue depuis le Google Agenda « Programmation du site » (évènement rouge « Tomate » = mis à la une). Sans clé, la section dit « programmation indisponible ».
- [x] Clé Google et liste des agendas copiées sur la VM, hors Git.
- [ ] Synchronisation **dans les deux sens** entre le calendrier de l'espace équipe et le Google Agenda de l'équipe :
  - une réservation créée ou modifiée sur le site apparaît dans Google Agenda ;
  - un événement créé ou modifié dans Google Agenda apparaît sur le site.
- [ ] Décider quoi faire en cas de conflit (même créneau modifié des deux côtés).
- [ ] Afficher les 4 agendas Google dans la vue « Mois » du calendrier de l'équipe (l'API `/api/agenda` est prête, réservée à l'équipe).
- [ ] **Programmation en temps réel** (notifications push Google Calendar) : une fois `chezmarthe.org` relié à la VM, enregistrer le domaine comme vérifié dans la console Google Cloud, créer un point d'entrée HTTPS qui reçoit l'avis « un évènement a changé », vider la mémoire et relire l'agenda. Renouveler l'abonnement automatiquement (il expire au bout d'environ 7 jours). En attendant, le site relit l'agenda au plus toutes les minutes. Coût Google : aucun.

## Financeurs potentiels (espace équipe)

- [x] Page « Financeurs potentiels » (paquet 6), sous « Financements » : les quatre onglets du fichier de prospection de l'équipe (Google Sheets « Répertoire financeurs », « Appels et échéances », « Stratégie de financement », « Mode d'emploi »), en tableaux modifiables comme celui des financements (cellules, colonnes, tri, couleurs), avec recherche et filtres (statut, adéquation). Colonnes de suivi ajoutées comme le demande le mode d'emploi : contact, dernier échange, relance, montant demandé, montant obtenu ; « Date limite » pour les appels (les échéances à moins de 45 jours s'affichent en haut). Le bouton « Demander un financement » d'une ligne l'ajoute au tableau de bord « Financements ». Export Excel des quatre onglets.
- [x] Recherche sur internet (16 novembre 2026) : 18 financeurs ajoutés au répertoire et 6 appels français dans « Appels et échéances » (lignes en bleu « ciel »), et onglet « Appels européens » (15 lignes : DAPHNE, CERV, New European Bauhaus, Erasmus+, FSE+, Interreg, LIFE, FEDER…). Tout est à vérifier sur le site de chaque financeur avant de déposer.
- [x] Deuxième recherche (16 novembre 2026) : 201 financeurs au répertoire (lignes bleues = ajouts), onglet « Appels français » (28 appels : DRAC Culture et lien social 13 janvier 2027, CEDRE Région Sud 11 décembre 2026, Contrat de ville investissement 30 décembre 2026…). Colonnes « Site / lien », « Contact direct (e-mail) », « LinkedIn » et « Points de vigilance » placées au début de chaque tableau.
- [ ] Contacts : e-mails cherchés pour 32 organisations (« Non trouvé » si rien de publié), pages LinkedIn pour 14 ; les autres lignes disent « À chercher ». Pour les profils LinkedIn des personnes, il faut un accès LinkedIn (connecteur ou recherche à la main).
- [x] Onglet « Mécènes et investisseurs » (21 lignes, Marseille et toute la France) : philanthropes et cercles de mécènes pour l'association (DAPAT, Entreprendre pour toi, Sisley-d'Ornano, Femmes Ensemble…), business angels seulement pour le volet B (une association ne peut pas recevoir de capital).
- [x] Colonne « Conseils » dans tous les tableaux de « Financeurs potentiels » : ce que fait le financeur et ce que Chez Marthe met en avant ; écrit à la main pour 22 pistes principales, composé à partir de la ligne pour les autres ; s'ouvre dans une fenêtre et se réécrit.
- [ ] Nuit du Bien Commun : à discuter en équipe avant de candidater (appels au boycott en 2025, liés au projet politique de son cofondateur).
- [ ] Urgent si intéressant : New European Bauhaus « réutiliser des lieux vacants » et « sans-abrisme » (dépôt le 1er décembre 2026, seulement en rejoignant un consortium) ; Interreg Euro-MED (30 novembre 2026).
- [ ] DAPHNE : l'appel 2026 est clos (3 novembre 2026) ; 29 M€ prévus en 2027. Chercher des partenaires européens et surveiller les sous-subventions des intermédiaires en 2027.
- [ ] Données de départ : le fichier tel qu'il était le 16 novembre 2026. Au premier chargement sur la VM, les tableaux partent de ce fichier ; ensuite ils vivent sur le site (le Google Sheets n'est plus mis à jour automatiquement).
- [ ] Plus tard, si utile : import d'un fichier Excel dans cette page, rappels par e-mail à la date de relance (comme pour les financements).

## Factures et devis (espace équipe)

- [x] Menu « Factures et devis » : créer un devis ou une facture avec **tarifs à cliquer** (Chapelle, Salon collectif / Séminaire, Bureau, Atelier, ligne libre), **aperçu en direct** du document, numéro automatique, téléchargement en Word et en PDF ; éditeur de document avec devis et facture déjà écrits (champs `<<…>>` à remplacer). Rien n'est enregistré sur le serveur, sauf les tarifs.
- [x] **Tarifs modifiables** depuis la page (nom, prix, ajouter/retirer, groupes, retour aux tarifs d'origine), partagés par l'équipe.
- [ ] **Ouvrir un fichier Word téléchargé dans Word** une fois, pour vérifier la mise en page (la fabrication a été contrôlée dans le fichier, pas dans Word).
- [x] **Fenêtre « Comptabilité » d'un évènement** (paquet 6) : depuis la fiche de l'évènement, devis prérempli (organisateur, évènement, espace, date), modifiable et enregistré automatiquement dans l'évènement ; « Devis accepté » (qui, quand) ; puis « Émettre la facture », qui reprend le devis (acompte modifiable). Envoi au client par e-mail avec le PDF joint ; le texte des deux e-mails se modifie dans la page Messages (« Factures et devis »). La confirmation d'une location attend le devis accepté. Onglet « Suivi des évènements » dans « Factures et devis ».
- [x] **Numérotation partagée par l'équipe** (sur le serveur, par année : `2026-001`…), pour les devis et les factures, aussi depuis la page « Factures et devis ».
- [x] **PDF identiques aux modèles** Word de l'association (mêmes polices Roboto, couleurs, tableau gris, cadre d'acceptation, pied de page légal) ; l'aperçu à l'écran suit la même mise en page.
- [ ] Envoi par e-mail : à essayer pour de vrai une fois le service e-mail branché (un devis envoyé à une adresse de l'équipe). Voir si le script actuel du tableau Google (publipostage) envoie un texte particulier à reprendre dans la page Messages, et si l'équipe veut une copie de chaque envoi.
- [ ] Plus tard : mémoire des clients (adresse postale), « facture payée », nature de prestation différente par ligne, éditeur avec images et tableaux libres, version téléphone de la page.

## Site public

- [x] Menu « Site » de l'espace équipe : toute la page d'accueil se modifie section par section (haut de page, notre lieu, l'équipe — aussi sur la page « Notre équipe » —, ce que l'on vit, évènements, louer un espace avec ses cartes, partenaires, nous soutenir, contact) : textes, photos, listes à ajouter, ranger ou retirer, et chaque section peut être cachée (elle sort aussi du menu). Publication immédiate ; les photos envoyées sont gardées dans la base de données.
- [ ] Plus tard, si utile : les autres pages (« Notre équipe » : manifeste ; « On parle de nous » ; mentions légales) dans « Site ».

### Fait
- [x] Page d'accueil refaite : première image en HD, schémas de couleurs, sections à hauteur d'écran sur ordinateur et sur téléphone, flèche pour descendre, descente automatique après 10 s sans action (`AUTO_SCROLL_SECONDS` dans `Landing.jsx`), retour au premier écran quand on recharge.
- [x] **Notre équipe** : sept personnes (Véronique, Joria, Flora, Sarah, Isadora, Barbara, Caroline) avec photo, rôle et citation entre guillemets ; manifeste à la place des « valeurs » (sans lien vers l'affiche) ; flèche « Notre manifeste ».
- [x] **On parle de nous** : page de presse (9 coupures, dont une carte Instagram) + entrée de menu (4ᵉ position) + bouton sous les cartes 30 / 6 de « Notre premier lieu ».
- [x] **Nos évènements** : 5 évènements au plus puis « Voir la suite ».
- [x] Page **Nos espaces** (connexion) : quatre espaces côte à côte (2 × 2 sur téléphone).
- [x] Menu : se resserre sur les fenêtres basses, barre de défilement seulement si nécessaire ; bouton « Accueil » (petite maison) dans les pages intérieures ; les liens du menu depuis une autre page arrivent à la bonne section.
- [x] Téléphone : « Notre premier lieu », les 4 piliers, évènements, partenaires, « Rejoindre le mouvement », Contact + pied de page tiennent chacun dans un écran ; Équipe, Presse et « Louer un espace » en cartes à faire défiler ; manifeste en deux pages.
- [x] Réseaux : Instagram, Facebook, LinkedIn, **YouTube** (chaîne https://www.youtube.com/@ChezMarthe-13).
- [x] Plus aucun flou (blur) sur le site public.

### Demandes de l'équipe du 11 novembre (à discuter ensemble avant de faire)
- [x] **Ordre des membres de l'équipe** (par ordre d'arrivée, sans noms de famille) : Véronique, Barbara, Caroline, Isadora, Joria, Flora, Sarah.
- [ ] **Noms de famille** : peut-être les ajouter sur la page Notre équipe (liste à recueillir auprès de chaque personne) ; à décider avec l'équipe, et à valider avec chaque personne.
- [ ] **Programmation** : ajouter l'évènement des « 3 ans des Sistas / Marseille Désirable » (à créer dans le Google Agenda ; en rouge pour le mettre à la une). Le site lit l'agenda, il ne l'écrit pas.
- [x] **Évènements** : bouton « S'inscrire » si la description de l'évènement dans Google Agenda contient « Inscription : https://… » (essayé en local, pas encore en ligne). Seule l'adresse est publiée, jamais le reste de la description.
- [x] (essayé en local) Trombinoscope : section « L'équipe de Chez Marthe » sur l'accueil (avant les partenaires) et « Les associations du lieu » (Sista4good, Les Petites Cantines) en bas de la page Notre équipe.
- [ ] **Compléter le trombinoscope** avec les membres des autres associations du lieu : qui, quelles photos, quels droits.
- [x] (essayé en local) **Coworking** et **Cantine** dans « Louer un espace », avec lien vers Sista4good et Les Petites Cantines. **Photo du coworking à remplacer** (aujourd'hui un détail de la photo du Bureau).
- [x] (essayé en local) L'équipe passe avant les partenaires sur l'accueil ; les partenaires deviennent « Soutiens et partenaires ».
- Questions à régler : qui valide les contenus, d'où viennent les photos et les liens, et si la liste des assos hébergées doit se gérer dans l'espace équipe plutôt que dans le code.

### À faire / à décider
- [ ] **Phrase de présentation** manquante : aucune (les sept ont leur phrase). Vérifier le texte de Flora (« elle s'invente, elle se transmet, elle se partage » : accord au pluriel ?).
- [ ] **Titres exacts de la presse** : Marcelle (« Aujourd'hui encore ! ») et Love Spots (« Chez Marthe, un ancien couvent où l'hospitalité se conjugue au féminin ») sont encore ceux déduits des liens ; carte Instagram « La Provence sur Instagram » à confirmer.
- [ ] Presse : ajouter des **aperçus** (image, description) sur les cartes ? (décidé : pas pour l'instant). Ajouter les stories Instagram permanentes ?
- [ ] **Droits et accord** : photos de l'équipe, citations et photos de l'archive FWD (`fwdmagazineavantages.zip`) : deux auteurs identifiés (l'un déjà cité dans les mentions légales, l'autre non cité) et onze images sans auteur connu. Ne pas les mettre sur le site avant d'avoir confirmé les droits et l'accord des personnes photographiées.
- [ ] **Photo d'accueil** : les gros pétales du premier plan sont flous dans la photo d'origine ; remplacer par une photo nette si possible.
- [ ] « Nos partenaires » : les logos défilent et se répètent. Alternative à décider : rangée fixe, chaque logo une seule fois.
- [ ] Téléphone : adapter le **formulaire de demande** (« Faire une demande », en bas de « Louer un espace »).
- [ ] Tablette (700 à 1299 px) : pas de mise en page dédiée ; à vérifier.
- [ ] Contrôler le site sur de vrais téléphones et navigateurs (la barre d'adresse change la hauteur) : « Notre premier lieu » et les évènements sont serrés sur les petits écrans (375×667).
- [ ] Rendre **« Adhérer »** et **« Faire un don »** visibles dès le haut de la page d'accueil (aujourd'hui dans le menu et en bas).
- [ ] Page d'accueil : ajouter un bouton **« Louer pour une activité »** à côté de « Choisir mon espace » et « Proposer une activité ».
- [ ] Créer le compte **TikTok**, puis réactiver son icône.
- [ ] L'intro 3D (`Intro.jsx`) est restée dans temp2 seulement, désactivée : à supprimer ou à reprendre plus tard.
- [ ] Nettoyage : l'affiche du manifeste (`foto/manifeste.webp`) n'est plus utilisée dans temp2.

## Espaces personnels de l'équipe

- [x] Après la connexion à l'espace équipe : « Qui êtes-vous ? » (les personnes de l'équipe du site, et « Ajouter une personne »). Chacune retrouve la même vue d'ensemble avec « Bonjour <prénom> », mais son menu à elle (« Ranger mon menu » : glisser-déposer, ⇡ tout en haut, ★ mettre en avant) et ses fonds (page et menu : couleur ou image, du site ou de l'ordinateur). Enregistré sur le serveur (`backend/features/equipe/profiles.py`), retrouvé sur tous les ordinateurs ; le prénom choisi est gardé dans le navigateur (« Changer de personne » en haut à droite).
- [ ] À savoir : ce n'est pas une sécurité (toutes utilisent le compte de l'équipe). Si un jour chacune doit avoir son propre mot de passe, il faudra des comptes équipe séparés.

## Bilans des structures (retour de Caroline, n° 10 du tableau du 30 octobre)

- [x] Page « Bilans des structures » (espace équipe) et « Notre bilan du mois » (espace associations) : un bilan par structure et par mois (Chez Marthe, HAS, JUST, Sista4good, Petites Cantines, Bénénova), d'après le tableau partagé par Caroline. Questions communes à toutes (personnes accueillies, dames qui participent, voisinage, orientations entre structures, récit du mois) puis celles de chaque structure ; indicateurs communs additionnés ; export Excel de l'année pour le bilan de juin 2027.
- [ ] **À valider avec Véro et Barbara** : la liste des indicateurs communs et des questions de chaque structure (dans `backend/features/equipe/bilans/schema.py`, facile à changer), et le rythme (mensuel pour l'instant ; le tableau proposait aussi une version hebdomadaire).
- [ ] **Choix fait pour la vie privée, à confirmer** : pour HAS et JUST, seulement des nombres du mois (hébergées, arrivées, départs, enfants…), **pas une ligne par dame** comme dans le tableau (dates, temps passé à la rue, cause de départ). Si un suivi par personne est vraiment nécessaire, il doit aller dans « Nos résidentes » (accès équipe seulement), avec l'accord des dames — à décider avant.
- [ ] **Créer les comptes des structures** sur le serveur (espace `partenaires`), au **nom exact** qui les relie à leur bilan : « Benenova », « Sista4good », « Les Petites Cantines », « HAS » (ou « Habitat Alternatif Social »), « JUST ». Le bilan de Chez Marthe se remplit depuis l'espace équipe.
- [ ] Reprendre les chiffres déjà notés par les Sistas (soirées Sista de février à mai : 50 participants, 3 à 5 dames) une fois l'année confirmée.
- [ ] Plus tard : un e-mail de rappel en fin de mois aux structures qui n'ont pas rempli leur bilan (quand l'envoi d'e-mails sera branché).

## Espaces

- [ ] Ajouter pour chaque espace **les prix, les photos et la capacité** (informations à recevoir de l'équipe).
- [ ] **Salon collectif** : le louer seulement si une personne de l'équipe est là le matin pour gérer la propreté (soirée des résidentes) ; **acheter une armoire qui ferme**. (Note interne, pas affichée sur le site.)
- [ ] **Chapelle** : confirmer la jauge (80 à 150 personnes : 80 assises, 150 debout ?) et le tarif du créneau hebdomadaire (30 €, absent du nouveau tableau).
- [ ] **Retirer le Jardin** et **retirer la Cuisine**.
- [ ] Renommer le Salon collectif en **« Salon collectif / Séminaire »**.
- [ ] **L'Atelier** ne se loue plus : il devient un espace d'**échange de services** (artistes qui animent des ateliers gratuits en contrepartie). Prévoir comment proposer un échange et comment l'équipe suit les ateliers promis.

## Réservations et demandes

- [ ] Les réservations passent par le **Linktree** d'Instagram : les boutons « Réserver » du site renvoient vers ce lien (lien à fournir).
- [ ] Les demandes à traiter par l'équipe sont envoyées vers le Linktree.

## E-mails (service d'envoi à brancher)

- [x] Promemoria finanziamenti : colonnes « Obtenu le » et « Relance » (11 mois par défaut, modifiable), contrôle chaque matin à 8 h (Paris), un courriel part une seule fois à la date de relance.
- [x] E-mail de confirmation automatique à la personne qui envoie une demande d'activité/location ou un message de contact (max 3 par adresse et par jour, 40 par heure).
- [x] Page **Messages** : objets et textes des e-mails modifiables, adresse « Bonjour Chez Marthe » modifiable avec confirmation.
- [ ] **Brancher le service d'envoi** (rien n'est envoyé tant que ce n'est pas fait). Recommandé : Gmail avec « mot de passe d'application » (compte `bonjour.chezmarthe@gmail.com` ou autre à choisir, vérification en deux étapes). Dans `deploy/.env` : `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` ; puis `docker compose up -d app`. **Ne jamais écrire le mot de passe dans un chat.** Alternative : Resend (demande de vérifier le domaine chez IONOS, sans toucher aux enregistrements MX/TXT).
- [ ] Mettre la même adresse comme « Bonjour Chez Marthe » dans la page Messages (sinon Gmail remplace l'expéditeur).
- [ ] Tester : « Envoyer un e-mail de test » depuis une fiche de financeur ; un formulaire de test avec sa propre adresse (puis supprimer la demande) ; en cas d'échec, `docker compose logs --tail=40 app`.
- [ ] Vérifier sur la VM : `POST /api/funders/reminders/run` (équipe connectée) liste les rappels du jour sans les envoyer ; `?dry=false` les envoie.
- [ ] Renseigner les **dates d'obtention** des financements existants (la colonne est vide au départ).
- [ ] D'autres e-mails à ajouter à la page Messages quand ils existeront (par exemple : accès aux espaces réservés).

## Mise en ligne et sécurité

- [x] Relevé des enregistrements DNS de `chezmarthe.org` **avant** la bascule (ancien site Odoo, e-mails) et procédure pour revenir à Odoo : `docs-md/DNS-chezmarthe-org.md` (25/11/2026).
- [x] **chezmarthe.org relié à la VM** (25/11/2026) : `@` en `A` → `34.155.50.2`, `www` et les espaces en `CNAME` → `chezmarthe.org` ; HTTPS par Caddy ; `www.` et les adresses `34-155-50-2.sslip.io` renvoient vers `chezmarthe.org`. Détail : `docs-md/DNS-chezmarthe-org.md`.
- [ ] **Connexion : afficher le mot de passe** pendant qu'on le tape, avec l'icône en forme d'œil à droite du champ (un clic montre le texte, un autre le cache), dans `frontend/src/features/auth/SignIn.jsx` ; même chose à la création de compte. Libellé accessible (« Afficher le mot de passe » / « Masquer le mot de passe ») pour les lecteurs d'écran.
- [ ] **Bilan en page du site** : `bilan.` devient `chezmarthe.org/bilan` (formulaire public, sans connexion : pas besoin d'un sous-domaine). Jusque-là le formulaire bilan n'est pas joignable sur `.org`.
- [ ] Dans quelques jours, si tout va bien : remonter le TTL des enregistrements DNS à 1 heure (le redescendre à 1 minute la veille du changement de serveur) ; retirer l'image de secours `deploy-app:precedente` (`docker rmi`).
- [ ] Dans quelques semaines : retirer les noms `*.34-155-50-2.sslip.io` de `SITE_HOSTS` et `OLD_DOMAINS` (plus personne ne devrait les utiliser).
- [ ] Sur Odoo, retirer le domaine `www.chezmarthe.org` des réglages du site (l'ancien site reste sur `chezmarthe1.odoo.com`).
- [ ] **Avant fin janvier 2027** : passer le compte Google Cloud en « compte complet », sinon la VM s'arrête à la fin de l'essai gratuit.
- [ ] Créer les vrais comptes (un compte par personne, pas un compte partagé par groupe) ; ne **jamais** lancer `make seed` sur la VM (comptes de démonstration avec mot de passe connu).
- [x] Retirer `comptes.txt` du dépôt Git (fait le 25/11/2026 avec le prototype `chezmarthe-demo/` ; les comptes de démonstration restent dans `backend/features/accounts/seed_demo.py`, à ne jamais lancer sur la VM).
- [ ] Masquer les données de démonstration en production : ajouter `VITE_DEMO=off` au build (`ENV VITE_DEMO=off` dans `deploy/Dockerfile.prod`, à côté de `VITE_AI=off`). Le drapeau `SHOW_DEMO_DATA` (`frontend/src/shared/lib/demo.js`) retire alors du bundle les profils fictifs, les matchs préécrits et l'étiquette « Données de démonstration ».
- [ ] Décider du sort des **docstrings et commentaires** du backend et du frontend : vérifier si les relire aide vraiment une session IA (ou une nouvelle personne) à comprendre le code plus vite en dépensant moins de jetons, ou si c'est du temps perdu. La règle proposée : garder ceux qui expliquent le « pourquoi », les contrats et les pièges (ex. la géométrie de la flèche de la carte, « la synchronisation est à sens unique ») ; raccourcir ou supprimer ceux qui répètent ce que le nom de la fonction dit déjà — un commentaire périmé qui contredit le code est pire que pas de commentaire.
- [ ] Faire attendre les visiteurs pendant les quelques secondes d'une mise à jour : `lb_try_duration 30s` dans le `Caddyfile` (à préparer, pas encore fait).
- [ ] Sauvegardes : le backup du 10 novembre est dans `~/marthe-2026-11-10-1807.sql.gz` sur la VM ; rythme régulier et copie hors de la VM : voir « Important » en haut de ce fichier.
- [ ] Plus tard : passer au tunnel Cloudflare (aucun port ouvert sur la VM).
- [ ] Plus tard : décider si on réactive l'IA (OpenAI ou Ollama).
- [ ] Vercel : limite de 100 déploiements par jour atteinte ; des projets en double ont été supprimés. Si on garde temp2, y pousser seulement quand c'est nécessaire.

## Pour mettre à jour le site sur la VM (aide-mémoire)

1. Cloud Shell : `gcloud compute ssh marthe --zone europe-west9-a`.
2. Sauvegarde : `docker compose exec -T db pg_dump -U marthe marthe | gzip > ~/marthe-$(date +%F-%H%M).sql.gz`, puis `docker tag deploy-app:latest deploy-app:precedente`.
3. `cd ~/marthe && git pull`, puis `cd deploy && docker compose build app` (le site actuel continue de servir).
4. `docker compose up -d app` ; contrôle : `docker compose logs --tail=40 app` (« Application startup complete »).
