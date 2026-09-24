export const spaces = [
  { id: 'atelier', name: 'L’Atelier', capacity: 24, rate: 25, area: 48, color: 'sage', description: 'Un espace lumineux pour apprendre, créer et partager.', equipment: ['Tables modulables', 'Vidéoprojecteur', 'Point d’eau'], icon: 'palette' },
  { id: 'salon', name: 'Le Grand Salon', capacity: 40, rate: 40, area: 72, color: 'peach', description: 'Le cœur du lieu, ouvert aux rencontres et aux idées.', equipment: ['40 chaises', 'Sonorisation', 'Accès PMR'], icon: 'sofa' },
  { id: 'cuisine', name: 'La Cuisine', capacity: 12, rate: 30, area: 35, color: 'lavender', description: 'Une cuisine partagée où les liens se tissent autour de la table.', equipment: ['Cuisine équipée', 'Vaisselle', 'Grande tablée'], icon: 'cooking' },
];
export const spaceById = Object.fromEntries(spaces.map(space => [space.id, space]));
export const TODAY = '2026-09-24';
export const statuses = { pending: 'À étudier', confirmed: 'Confirmé', completed: 'Bilan saisi', cancelled: 'Annulé' };
