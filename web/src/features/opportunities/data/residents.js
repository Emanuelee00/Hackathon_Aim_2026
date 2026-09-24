export const residents = [
  { id: 'fatou', first_name: 'Fatou', initials: 'FK', goals: ['Découvrir les métiers de la restauration', 'Gagner en confiance en situation professionnelle'], skills: ['Cuisine familiale', 'Organisation collective'], languages: ['Français B1', 'Wolof'], availability: 'En semaine entre 9h et 16h', consent: true, color: 'peach', fictional: true },
  { id: 'amina', first_name: 'Amina', initials: 'AB', goals: ['Développer un projet indépendant', 'Rencontrer des entrepreneures'], skills: ['Accueil', 'Gestion administrative'], languages: ['Français B2', 'Arabe'], availability: 'Matinées et mercredi après-midi', consent: true, color: 'sage', fictional: true },
  { id: 'sofia', first_name: 'Sofia', initials: 'SM', goals: ['Explorer les métiers créatifs', 'Créer un portfolio'], skills: ['Photographie amateur', 'Réseaux sociaux'], languages: ['Français C1', 'Espagnol'], availability: 'Après-midi et samedi', consent: true, color: 'lavender', fictional: true },
  { id: 'lea', first_name: 'Léa', initials: 'LD', goals: ['Reprendre une formation'], skills: ['Vente'], languages: ['Français'], availability: 'À confirmer', consent: false, color: 'sand', fictional: true },
];

export const residentById = Object.fromEntries(residents.map(resident => [resident.id, resident]));
