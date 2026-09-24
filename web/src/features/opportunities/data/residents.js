export const residents = [
  { id: 'marie', email: 'marie@marthe.fr', first_name: 'Marie', initials: 'MD', goals: ['Découvrir les métiers de la restauration', 'Gagner en confiance en situation professionnelle'], skills: ['Cuisine familiale', 'Organisation collective'], languages: ['Français B1', 'Wolof'], availability: 'En semaine entre 9h et 16h', consent: true, color: 'peach', fictional: true },
  { id: 'camille', email: 'camille.b@marthe.fr', first_name: 'Camille', initials: 'CB', goals: ['Développer un projet indépendant', 'Rencontrer des entrepreneures'], skills: ['Accueil', 'Gestion administrative'], languages: ['Français B2', 'Arabe'], availability: 'Matinées et mercredi après-midi', consent: true, color: 'sage', fictional: true },
  { id: 'sofia', email: 'sofia@marthe.fr', first_name: 'Sofia', initials: 'SM', goals: ['Explorer les métiers créatifs', 'Créer un portfolio'], skills: ['Photographie amateur', 'Réseaux sociaux'], languages: ['Français C1', 'Espagnol'], availability: 'Après-midi et samedi', consent: true, color: 'lavender', fictional: true },
  { id: 'lea', email: 'lea@marthe.fr', first_name: 'Léa', initials: 'LD', goals: ['Reprendre une formation'], skills: ['Vente'], languages: ['Français'], availability: 'À confirmer', consent: false, color: 'sand', fictional: true },
];

export const residentById = Object.fromEntries(residents.map(resident => [resident.id, resident]));

// The profile of a signed-in resident account; an account without a demo profile starts empty.
export function residentForUser(user) {
  const profile = residents.find(resident => resident.email === user.email.toLowerCase());
  if (profile) return profile;
  const initials = user.name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  return { id: `user-${user.id}`, email: user.email, first_name: user.name.split(/\s+/)[0], initials, goals: [], skills: [], languages: [], availability: '', consent: false, color: 'sand' };
}
