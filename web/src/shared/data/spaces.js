import { sites } from './sites.js';

export const spaces = [
  // Chez Marthe — Marseille (site réel)
  { id: 'atelier', site: 'marseille', name: 'L’Atelier', capacity: 24, rate: 25, area: 48, color: 'sage', description: 'Un espace lumineux pour apprendre, créer et partager.', equipment: ['Tables modulables', 'Vidéoprojecteur', 'Point d’eau'], icon: 'palette' },
  { id: 'salon', site: 'marseille', name: 'Le Grand Salon', capacity: 40, rate: 40, area: 72, color: 'peach', description: 'Le cœur du lieu, ouvert aux rencontres et aux idées.', equipment: ['40 chaises', 'Sonorisation', 'Accès PMR'], icon: 'sofa' },
  { id: 'cuisine', site: 'marseille', name: 'La Cuisine', capacity: 12, rate: 30, area: 35, color: 'lavender', description: 'Une cuisine partagée où les liens se tissent autour de la table.', equipment: ['Cuisine équipée', 'Vaisselle', 'Grande tablée'], icon: 'cooking' },
  // Surfaces, tarifs et contraintes : PDF des espaces de l’association. Jauges : hypothèses à confirmer.
  { id: 'chapelle', site: 'marseille', name: 'La Chapelle', capacity: 90, rate: null, prices: { '2h': 40, half: 100, day: 200, weekly: 30 }, area: 114, color: 'peach', description: 'Chapelle désacralisée pour concerts, spectacles, danse ou yoga. L’acoustique ne permet pas les projections.', equipment: ['Sonorisation', 'Éclairage scénique'], icon: 'sparkles' },
  { id: 'jardin', site: 'marseille', name: 'Le Jardin', capacity: 150, rate: null, prices: { '2h': 40, half: 100, day: 200, weekly: 30 }, area: null, color: 'sage', description: 'Espace partagé et non clos, buvette le jeudi soir, ateliers le week-end. Le calme des résidentes prime après 21 h.', equipment: ['Buvette'], icon: 'leaf' },
  { id: 'salon-collectif', site: 'marseille', name: 'Le Salon collectif', capacity: 15, rate: null, prices: { half: 80, day: 150 }, area: 28, color: 'lavender', description: 'Espace de vie des résidentes le soir et le week-end. Ni casiers ni paperboard.', equipment: [], icon: 'sofa' },
  { id: 'cantines', site: 'marseille', name: 'Les Petites Cantines', capacity: 30, rate: null, area: 32, color: 'peach', description: 'Cantine solidaire à prix libre, avec une terrasse de 30 m². Privatisable, tarif sur devis.', equipment: ['Terrasse'], icon: 'cooking' },
  { id: 'reunion', site: 'marseille', name: 'La Salle de réunion', capacity: 8, rate: null, area: 16, color: 'lavender', description: 'Réunions en petit comité. Encore jamais louée : une piste de recettes.', equipment: [], icon: 'file' },
  { id: 'coworking', site: 'marseille', name: 'Le Coworking', capacity: 12, rate: null, area: null, unit: 'place', color: 'sage', description: 'Location à la place, pas à la salle entière. Géré aujourd’hui par Sista4good.', equipment: [], icon: 'dashboard' },
  // Chez Marthe — Nice (exemple, site fictif pour une autre antenne)
  { id: 'nice-studio', site: 'nice', name: 'Le Studio', capacity: 15, rate: 22, area: 28, color: 'sage', description: 'Un espace clair pour les ateliers créatifs et les petits groupes.', equipment: ['Tables modulables', 'Matériel de peinture', 'Point d’eau'], icon: 'palette' },
  { id: 'nice-verriere', site: 'nice', name: 'La Verrière', capacity: 45, rate: 42, area: 70, color: 'peach', description: 'Une grande salle baignée de lumière, pour les rencontres et les temps collectifs.', equipment: ['45 chaises', 'Sonorisation', 'Accès PMR'], icon: 'sofa' },
  { id: 'nice-terrasse', site: 'nice', name: 'La Terrasse', capacity: 30, rate: 28, area: 50, color: 'lavender', description: 'Un espace extérieur ombragé, pour les événements en plein air.', equipment: ['Mobilier extérieur', 'Point d’eau'], icon: 'leaf' },
  // Chez Marthe — Avignon (exemple, site fictif pour une autre antenne)
  { id: 'avignon-cour', site: 'avignon', name: 'La Cour', capacity: 35, rate: 30, area: 55, color: 'sage', description: 'Une cour intérieure pour les temps conviviaux et les petits événements.', equipment: ['Mobilier extérieur', 'Point d’eau'], icon: 'leaf' },
  { id: 'avignon-bibliotheque', site: 'avignon', name: 'La Bibliothèque', capacity: 18, rate: 24, area: 32, color: 'peach', description: 'Un espace calme pour les ateliers, les réunions et le travail concentré.', equipment: ['Tables', 'Vidéoprojecteur', 'Wifi'], icon: 'file' },
];
export const spaceById = Object.fromEntries(spaces.map(space => [space.id, space]));
// Les demandes, le calendrier et le matching restent scopés au site réel :
// les antennes fictives (ex. Nice) ne sont visibles que dans « Nos espaces ».
const realSiteId = sites.find(site => site.real)?.id;
export const bookableSpaces = spaces.filter(space => space.site === realSiteId);
export const TODAY = '2026-09-24';
export const statuses = { pending: 'À étudier', incomplete: 'Incomplète', waitlisted: 'Liste d’attente', confirmed: 'Confirmé', completed: 'Bilan saisi', cancelled: 'Annulé' };
