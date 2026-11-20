// ---- « Contact direct » : les e-mails trouvés le 16 novembre 2026 (sites et documents publics des financeurs).
// « Non trouvé » : cherché, pas d'adresse publiée (souvent un formulaire de contact). « À chercher » : pas encore cherché.
// La date de la source est indiquée quand elle est ancienne : vérifier avant d'écrire.
const NOT_FOUND = 'Non trouvé';
export const contactEmails = {
  r01: 'alexis@fondation-marseille.org (contact noté dans le fichier de l’équipe)',
  r02: NOT_FOUND, r03: 'fondation@vinci.com (source 2019)', r05: 'laura.liguori@fondationcaritasfrance.org (source 2023 ; appels fermés à partir de 2026)',
  r06: 'fondation@nexity.fr (source 2021)', r08: NOT_FOUND, r09: NOT_FOUND, r12: 'mrichard@bricodepot.com (appel 2026)', r13: NOT_FOUND, r14: NOT_FOUND,
  r21: NOT_FOUND, r22: NOT_FOUND, r32: NOT_FOUND, r33: NOT_FOUND,
  w01: NOT_FOUND, w02: 'request@medwomensfund.org (demandes) · info@medwomensfund.org', w04: 'contact@lespetitespierres.org', w06: 'fondation@cma-cgm.com',
  w08: 'alexia.lozano@paca.gouv.fr (directrice régionale adjointe)', x001: 'droitsdesfemmes@marseille.fr', x008: 'alexia.lozano@paca.gouv.fr', x009: 'alexia.lozano@paca.gouv.fr',
  x011: 'paca-aap@culture.gouv.fr', x036: 'mediterranee@fdf.org (source 2019)', x037: 'mediterranee@fdf.org (délégation régionale, source 2019)',
  x038: 'mediterranee@fdf.org (délégation régionale, source 2019)', x039: 'mediterranee@fdf.org (délégation régionale, source 2019)', x092: NOT_FOUND,
  // Appels et échéances (fichier de l'équipe)
  a05: 'mrichard@bricodepot.com (appel 2026)', a06: NOT_FOUND, a07: NOT_FOUND,
  // Appels européens
  e01: 'cervfr@cidem.org (point de contact national CERV)', e02: 'cervfr@cidem.org (point de contact national CERV)', e03: 'cervfr@cidem.org (point de contact national CERV)',
  e04: 'cervfr@cidem.org (point de contact national CERV)', e08: 'aefa@agence-erasmus.fr · contact@agence-erasmus.fr',
  // Appels français
  f01: 'paca-aap@culture.gouv.fr', f06: NOT_FOUND, f07: 'request@medwomensfund.org', f08: 'droitsdesfemmes@marseille.fr', f09: 'alexia.lozano@paca.gouv.fr',
  f10: 'alexia.lozano@paca.gouv.fr', f11: 'alexia.lozano@paca.gouv.fr', f17: 'mediterranee@fdf.org (source 2019)', f18: 'mediterranee@fdf.org (source 2019)',
  f19: 'mediterranee@fdf.org (source 2019)', f21: 'mrichard@bricodepot.com', f22: NOT_FOUND, f26: 'contact@lespetitespierres.org', f27: 'fondation@cma-cgm.com',
};
// « LinkedIn » : la page publique de l'organisation trouvée par un moteur de recherche (pas d'accès à LinkedIn lui-même), et parfois
// le profil public de la personne dont le rôle compte pour une demande. « Non trouvé » / « À chercher » comme pour les e-mails.
const FDF_MED = 'https://fr.linkedin.com/company/fondation-de-france-m%C3%A9diterran%C3%A9e';
export const linkedinPages = {
  r01: 'Page non trouvée · Edouard Detaille, secrétaire général : https://www.linkedin.com/in/edouard-detaille-0b80481/',
  r02: 'https://fr.linkedin.com/company/fondation-macif', r03: 'https://fr.linkedin.com/company/fondation-vinci-pour-la-cite',
  r04: 'https://fr.linkedin.com/company/fondation-de-france', r14: 'https://fr.linkedin.com/company/fondationdesfemmes',
  r21: 'https://www.linkedin.com/showcase/banque-des-territoires-par-la-caisse-des-depots',
  r22: 'Page non trouvée · David Heckel, directeur : https://www.linkedin.com/in/david-heckel-2047152b1/',
  r32: 'https://fr.linkedin.com/company/inter-made (peut-être devenu « combo »)',
  w01: 'Page non trouvée · Francis Vernède, agence PACA (brochure 2022) : https://www.linkedin.com/in/francis-vern%C3%A8de-6a4666a3/',
  w02: 'https://fr.linkedin.com/company/medwf-ffmed · Lamia Batata, subventions : https://www.linkedin.com/in/lamia-batata-801344134/',
  w04: 'https://fr.linkedin.com/company/les-petites-pierres-org', w06: 'https://fr.linkedin.com/showcase/fondationcmacgm/',
  x036: FDF_MED, x037: FDF_MED, x038: FDF_MED, x039: FDF_MED, x040: FDF_MED,
  a07: 'https://fr.linkedin.com/company/fondationdesfemmes',
  f06: 'https://fr.linkedin.com/company/fondationdesfemmes', f07: 'https://fr.linkedin.com/company/medwf-ffmed', f17: FDF_MED, f18: FDF_MED, f19: FDF_MED,
  f26: 'https://fr.linkedin.com/company/les-petites-pierres-org', f27: 'https://fr.linkedin.com/showcase/fondationcmacgm/',
};
// Deuxième passage : les personnes en charge, trouvées par leur rôle dans les profils publics (moteur de recherche). Les titres
// viennent des profils eux-mêmes : à confirmer avant d'écrire. « non trouvé·e » : cherché sans résultat public.
const FDF_PERSON = `${FDF_MED} · Anaïs Jacoby, déléguée générale : https://www.linkedin.com/in/anais-jacoby/`;
const DRDFE = 'Yolande Eskenazi, directrice régionale aux droits des femmes (à confirmer) : https://www.linkedin.com/in/yolande-eskenazi-b644533a/ · adjointe : Alexia Lozano';
const CAF13 = 'https://fr.linkedin.com/company/caf-des-bouches-du-rh%C3%B4ne · conseiller·e vie sociale non trouvé·e';
const MARSEILLE_WOMEN = 'Marina Iliaev, responsable du service Droits des femmes : https://www.linkedin.com/in/marina-iliaev-73817384/ · élue : Nathalie Tessier';
Object.assign(linkedinPages, {
  r02: 'https://fr.linkedin.com/company/fondation-macif · chargé·e PACA non trouvé·e',
  r03: 'https://fr.linkedin.com/company/fondation-vinci-pour-la-cite · à Marseille : une « assistante de projet mécénat Sud-Est » (nom masqué par LinkedIn)',
  r05: 'Valentine Baroux, responsable de l’action philanthropique : https://www.linkedin.com/in/valentinebaroux/ · déléguée générale : Claire Dognin-O’Neill',
  r06: 'https://fr.linkedin.com/company/fondation-nexity · Peggy Klein, déléguée générale (profil non trouvé)',
  r07: 'Anil Adiceam, délégué général adjoint : https://www.linkedin.com/in/anil-adiceam-5697965b/ · déléguée générale : Mathilde Lerosier',
  r08: 'https://www.linkedin.com/company/credit-agricole-alpes-provence · Chloé Béron, Fondation CA Alpes Provence (rôle à vérifier) : https://www.linkedin.com/in/chloeberon/',
  r09: 'Mécénat : personne non trouvée · à Marseille : « chef·fe de projets relations presse & communication institutionnelle » (nom masqué par LinkedIn)',
  r24: 'Personne non trouvée',
  r21: 'https://www.linkedin.com/showcase/banque-des-territoires-par-la-caisse-des-depots · chargé·e ESS PACA non trouvé·e',
  r27: 'Chargé·e de mission ESS non trouvé·e',
  r34: 'https://fr.linkedin.com/company/les-premieres-sud · Caroline Dumond, dirigeante : https://www.linkedin.com/in/caroline-dumond',
  w08: DRDFE, x008: DRDFE, x009: DRDFE, f09: DRDFE, f10: DRDFE, f11: DRDFE,
  w17: 'Personne non trouvée', x016: 'Personne non trouvée', x017: 'Personne non trouvée',
  x001: MARSEILLE_WOMEN, f08: MARSEILLE_WOMEN,
  x007: 'Matthieu Berille, DREETS PACA, suit l’ESS (titre à confirmer) : https://www.linkedin.com/in/matthieu-berille-40228b5/',
  x011: 'Profil non trouvé · Raphaël Haziot, conseiller action culturelle à la DRAC', f01: 'Profil non trouvé · Raphaël Haziot, conseiller action culturelle à la DRAC',
  x014: 'Elodie Bordes, service Tourisme, ESS et économie de proximité (profil ancien) : https://www.linkedin.com/in/elodie-bordes-0a9018120/',
  x019: CAF13, x020: CAF13, f13: CAF13,
  x027: 'Personne non trouvée · le DLA 13 est animé avec France Active PACA',
  x036: FDF_PERSON, x037: FDF_PERSON, x038: FDF_PERSON, x039: FDF_PERSON, x040: FDF_PERSON, f17: FDF_PERSON, f18: FDF_PERSON, f19: FDF_PERSON,
  x082: 'https://www.linkedin.com/company/dons-solidaires · Dominique Besançon, déléguée générale : https://www.linkedin.com/in/dominquebesancon/',
  x084: 'Non trouvé',
  x092: 'https://fr.linkedin.com/company/soroptimist-international-france · club de Marseille non trouvé',
  y05: 'Nabil Cherkaoui, directeur territorial (Aix-Marseille, Var) : https://www.linkedin.com/in/nabil-cherkaoui-04339326/',
});
// Troisième passage (documents officiels : rapports d'activité, bilans, cahiers des charges, arrêtés, presse locale).
// Les noms vont dans « Contact (nom) » ; la source et sa date sont indiquées, car les postes changent.
export const contactNames = {
  r01: 'Marie-Laure Guidi, présidente (presse 2024-2026) · Edouard Detaille, secrétaire général',
  r02: 'Bouchra Rguibi, chargée de domaine Fondation Macif & ESS PACA-Corse (bilan Labo de l’ESS 2025)',
  r03: 'Clara Lemonnier, responsable régionale Sud-Est (rapport d’activité 2025)',
  r21: 'Karen Bouvet, directrice territoriale innovation et ESS (2022) · Jean-Charles Clerc, direction régionale Marseille (AAP DLA 2025)',
  r27: 'Olivia Fortin, 6e vice-présidente emploi, insertion, ESS (arrêté du 13 mai 2026)',
  w01: 'Francis Vernède, directeur régional PACA (courrier au préfet, juillet 2026)',
  x001: 'Marina Iliaev, responsable du service · élue : Nathalie Tessier',
  x014: 'Agnès Rossi, conseillère régionale déléguée à l’ESS',
  x016: 'Marion Morel, référente culture · Jonathan Barberis, référent seniors (cahier des charges 2027)',
  x027: 'Dominique Guyot, préfecture 13, ESS et DLA (organigramme avril 2024)',
};
Object.assign(contactEmails, {
  r03: 'fondation@vinci.com (source 2019) · demander Clara Lemonnier, Sud-Est',
  r21: 'karen.bouvet@caissedesdepots.fr (source 2022)',
  x016: 'marion.morel@departement13.fr (culture) · jonathan.barberis@departement13.fr (seniors)',
  f05: 'marion.morel@departement13.fr (culture) · jonathan.barberis@departement13.fr (seniors)',
  x019: 'animation-vie-sociale@caf13.caf.fr', x020: 'animation-vie-sociale@caf13.caf.fr', f13: 'animation-vie-sociale@caf13.caf.fr',
});
Object.assign(linkedinPages, {
  r03: 'Clara Lemonnier : https://www.linkedin.com/in/clara-lemonnier-aa6a11138/ · https://fr.linkedin.com/company/fondation-vinci-pour-la-cite',
});

// Quatrième passage : le profil LinkedIn de chaque personne nommée (lien direct). Homonymes écartés ; « profil non trouvé » sinon.
const L = {
  rguibi: 'Bouchra Rguibi : https://fr.linkedin.com/in/bouchra-rguibi-b1b31b55',
  guidi: 'Marie-Laure Guidi, présidente : https://www.linkedin.com/in/marie-laure-guidi-0135a333/',
  detaille: 'Edouard Detaille, secrétaire général : https://www.linkedin.com/in/edouard-detaille-0b80481/',
  vernede: 'Francis Vernède : https://www.linkedin.com/in/francis-vern%C3%A8de-6a4666a3/',
  lemonnier: 'Clara Lemonnier : https://www.linkedin.com/in/clara-lemonnier-aa6a11138/',
  bouvet: 'Karen Bouvet (aujourd’hui « senior advisor », peut-être plus en poste) : https://www.linkedin.com/in/karen-bouvet-527a8a112/',
  fortin: 'Olivia Fortin : https://www.linkedin.com/in/olivia-fortin-3420606/',
  rossi: 'Agnès Rossi : https://fr.linkedin.com/in/agn%C3%A8s-rossi-b1a63855',
  barberis: 'Jonathan Barberis : https://www.linkedin.com/in/jonathan-barberis-b8892795/ · Marion Morel : profil non trouvé',
  guyot: 'Dominique Guyot, DDETS 13 : https://www.linkedin.com/in/dominique-guyot-628b1057/',
  iliaev: 'Marina Iliaev : https://www.linkedin.com/in/marina-iliaev-73817384/ · Nathalie Tessier (élue) : profil non trouvé',
  drdfe: 'Yolande Eskenazi : https://www.linkedin.com/in/yolande-eskenazi-b644533a/ · Alexia Lozano : https://www.linkedin.com/in/allozano/',
  caritas: 'Claire Dognin-O’Neill, déléguée générale : https://www.linkedin.com/in/claire-dognin-oneill/ · Laura Liguori : https://www.linkedin.com/in/laura-liguori-49aa7b273/ · Valentine Baroux : https://www.linkedin.com/in/valentinebaroux/',
  klein: 'Peggy Klein, déléguée générale : https://fr.linkedin.com/in/peggy-klein-62aba032',
  lerosier: 'Mathilde Lerosier, déléguée générale : https://www.linkedin.com/in/mathilde-lerosier-ba1a6725/ · Anil Adiceam : https://www.linkedin.com/in/anil-adiceam-5697965b/',
  dumond: 'Caroline Dumond : https://www.linkedin.com/in/caroline-dumond-641b54b5/',
};
Object.assign(linkedinPages, {
  r01: `${L.guidi} · ${L.detaille}`, r02: L.rguibi, r03: L.lemonnier, r05: L.caritas, r06: L.klein, r07: L.lerosier,
  r21: L.bouvet, r27: L.fortin, r34: L.dumond, w01: L.vernede, x001: L.iliaev, f08: L.iliaev, x014: L.rossi, x016: L.barberis, f05: L.barberis,
  x027: L.guyot, w08: L.drdfe, x008: L.drdfe, x009: L.drdfe, f09: L.drdfe, f10: L.drdfe, f11: L.drdfe,
});
contactNames.r05 = 'Claire Dognin-O’Neill, déléguée générale · Laura Liguori, responsable projets (2023) · Valentine Baroux';
contactNames.r06 = 'Peggy Klein, déléguée générale';
contactNames.r07 = 'Mathilde Lerosier, déléguée générale · Anil Adiceam, adjoint';
contactNames.r34 = 'Caroline Dumond, dirigeante';
contactNames.w08 = 'Yolande Eskenazi, directrice régionale · Alexia Lozano, adjointe';
contactNames.x027 = 'Dominique Guyot, directrice économie, emploi, insertion à la DDETS 13 (suit l’ESS et le DLA)';
contactNames.r21 = 'Jean-Charles Clerc, direction régionale Marseille (AAP DLA 2025) · Karen Bouvet (ESS, 2022, peut-être partie)';

export const withEmails = rows => rows.map(row => ({
  ...row,
  ...('contact' in row ? { contact: row.contact || contactNames[row.id] || '' } : {}), email: row.email || contactEmails[row.id] || 'À chercher', linkedin: row.linkedin || linkedinPages[row.id] || 'À chercher',
}));
