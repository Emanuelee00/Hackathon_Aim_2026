// Hosted associations. Their current tools and weekly slots are hypotheses to confirm with them.
// Weekdays follow ISO numbering: 1 = Monday … 7 = Sunday.
export const associations = [
  { id: 'benenova', name: 'Benenova', role: 'Bénévolat de proximité. Permanence hebdomadaire dans le coworking.', tool: 'Leur propre plateforme de missions', slots: [
    { id: 'benenova-perm', title: 'Permanence Benenova', weekdays: [3], start: '14:00', end: '18:00', space: 'coworking' },
  ] },
  { id: 'sista4good', name: 'Sista4good', role: 'Gestion du coworking et des salles de soin.', tool: 'Google Agenda partagé', slots: [
    { id: 'sista-cowork', title: 'Coworking Sista4good', weekdays: [1, 2, 4, 5], start: '09:00', end: '18:00', space: 'coworking' },
    { id: 'sista-soin', title: 'Atelier bien-être Sista4good', weekdays: [1], start: '10:00', end: '12:00', space: 'salon' },
  ] },
  { id: 'cantines', name: 'Les Petites Cantines', role: 'Cantine solidaire à prix libre, du lundi au vendredi midi.', tool: 'Outil de réservation du réseau national', slots: [
    { id: 'cantines-midi', title: 'Déjeuner à prix libre', weekdays: [1, 2, 3, 4, 5], start: '12:00', end: '14:00', space: 'cantines' },
  ] },
];
export const associationById = Object.fromEntries(associations.map(association => [association.id, association]));
export const onboardingSteps = [['mapped', 'Outils et besoins cartographiés'], ['referent', 'Référente désignée'], ['synced', 'Agenda synchronisé'], ['trained', 'Équipe formée à l’outil commun']];
export const syncSources = ['Google Agenda', 'Fichier Excel', 'Lien iCal'];
