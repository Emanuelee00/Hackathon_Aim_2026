# À faire — Chez Marthe

Dernière mise à jour : 12 novembre 2026. Voir aussi `CONTESTO_SESSIONE.md` (contexte de travail complet).

## Où en est la mise en ligne (VM Google Cloud `marthe`, adresse de test https://34-155-50-2.sslip.io)

- [x] **Paquet 1** (Financements, Messages, Devis, languette du menu) : en ligne.
- [x] **Paquet 2** (site public refait, « Factures et devis » avec éditeur, Google Agenda) : en ligne ; la programmation du site répond avec les évènements ; clés Google copiées dans `deploy/secrets/`, `GOOGLE_CALENDAR_ID` dans `deploy/.env`.
- [ ] **Paquet 3** (site public pour téléphone, photo HD, plus de flou) : fusionné dans `main` (commit `c013753`), build fait sur la VM. **Reste la bascule** : `docker compose up -d app`, puis contrôle des journaux. Retour rapide : `docker tag deploy-app:precedente deploy-app:latest && docker compose up -d app`.
- Étiquettes de retour arrière sur GitHub : `pre-finanziamenti-messaggi-2026-11`, `pre-sito-pubblico-2026-11`, `pre-sito-mobile-2026-11`.
- [ ] **Vérifier sur le PC avant de garder le paquet 3** : sur ordinateur la première partie des pages change un peu par rapport au paquet 2 (photo HD recadrée, plus de halo derrière les textes, 5 évènements au plus, pastille « Notre manifeste » sous les cartes, titres de presse en entier). Ce sont des demandes validées en aperçu, mais à regarder sur le vrai site.
- [ ] **Paquet 5** (demandes de l'équipe du 11 novembre : lien d'inscription des évènements, équipe du lieu sur l'accueil, Coworking et Cantine à louer, associations du lieu, ordre de l'équipe) : fusionné dans `main` le 12 novembre ; **reste** : mise sur la VM (voir le paquet 4, même procédure). Étiquette de retour : `pre-richieste-equipe-2026-11`.
- [ ] **Paquet 4** (Factures et devis : tarifs à cliquer, aperçu en direct, tarifs modifiables) : fusionné dans `main` (commit `652d52b`) ; **reste** : sauvegarde, `git pull`, build et bascule sur la VM. Étiquette de retour : `pre-devis-tarifs-2026-11`.
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

## Factures et devis (espace équipe)

- [x] Menu « Factures et devis » : créer un devis ou une facture avec **tarifs à cliquer** (Chapelle, Salon collectif / Séminaire, Bureau, Atelier, ligne libre), **aperçu en direct** du document, numéro automatique, téléchargement en Word et en PDF ; éditeur de document avec devis et facture déjà écrits (champs `<<…>>` à remplacer). Rien n'est enregistré sur le serveur, sauf les tarifs.
- [x] **Tarifs modifiables** depuis la page (nom, prix, ajouter/retirer, groupes, retour aux tarifs d'origine), partagés par l'équipe.
- [ ] **Ouvrir un fichier Word téléchargé dans Word** une fois, pour vérifier la mise en page (la fabrication a été contrôlée dans le fichier, pas dans Word).
- [ ] Le PDF est dessiné par le serveur : il n'est pas identique au Word. Si vous avez des PDF exportés depuis Word, on peut les utiliser comme modèles.
- [ ] Plus tard : mémoire des clients, historique des devis/factures enregistrés dans l'espace équipe, numérotation partagée par l'équipe (aujourd'hui dans le navigateur), nature de prestation différente par ligne, éditeur avec images et tableaux libres, version téléphone de la page.

## Site public

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

- [ ] Relier **chezmarthe.org** : sur IONOS, ajouter les enregistrements `A` → `34.155.50.2` pour `@`, `www`, `equipe`, `residents`, `benevoles`, `partenaires`, `bilan` (voir `deploy/README.md`). **Ne pas toucher** aux enregistrements des e-mails (MX, TXT, `_domainkey`, `_dmarc`, `autodiscover`). Il faut quelqu'un qui a l'accès IONOS. `chezmarthe.site` n'appartient pas à l'association.
- [ ] Puis mettre `SITE_HOSTS`, `CANONICAL_DOMAIN` et `OLD_DOMAINS` à jour dans `deploy/.env` sur la VM.
- [ ] Sur Odoo, retirer le domaine `www.chezmarthe.org` des réglages du site (l'ancien site reste sur `chezmarthe1.odoo.com`).
- [ ] **Avant fin janvier 2027** : passer le compte Google Cloud en « compte complet », sinon la VM s'arrête à la fin de l'essai gratuit.
- [ ] Créer les vrais comptes (un compte par personne, pas un compte partagé par groupe) ; ne **jamais** lancer `make seed` sur la VM (comptes de démonstration avec mot de passe connu).
- [ ] Retirer `comptes.txt` du dépôt Git (comptes de démonstration et leur mot de passe) ou le garder privé.
- [ ] Faire attendre les visiteurs pendant les quelques secondes d'une mise à jour : `lb_try_duration 30s` dans le `Caddyfile` (à préparer, pas encore fait).
- [ ] Sauvegardes : le backup du 10 novembre est dans `~/marthe-2026-11-10-1807.sql.gz` sur la VM ; décider d'un rythme régulier et d'un endroit hors de la VM.
- [ ] Plus tard : passer au tunnel Cloudflare (aucun port ouvert sur la VM).
- [ ] Plus tard : décider si on réactive l'IA (OpenAI ou Ollama).
- [ ] Vercel : limite de 100 déploiements par jour atteinte ; des projets en double ont été supprimés. Si on garde temp2, y pousser seulement quand c'est nécessaire.

## Pour mettre à jour le site sur la VM (aide-mémoire)

1. Cloud Shell : `gcloud compute ssh marthe --zone europe-west9-a`.
2. Sauvegarde : `docker compose exec -T db pg_dump -U marthe marthe | gzip > ~/marthe-$(date +%F-%H%M).sql.gz`, puis `docker tag deploy-app:latest deploy-app:precedente`.
3. `cd ~/marthe && git pull`, puis `cd deploy && docker compose build app` (le site actuel continue de servir).
4. `docker compose up -d app` ; contrôle : `docker compose logs --tail=40 app` (« Application startup complete »).
