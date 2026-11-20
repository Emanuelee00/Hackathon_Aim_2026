// Dates, colors and test data of « La programmation », shared by the agenda cards.

export const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
export const monthNames = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
export const isoDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export function mondayOf(date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

// Programmation : une semaine du Google Agenda de l'association (via /api/programmation), avec une flèche pour la semaine suivante.
// Chaque activité garde toujours la même couleur (d'après le premier mot de son titre).
// Couleurs des activités : gradations de rose et de violet (et un peu d'orange), aux couleurs de Chez Marthe.
const eventColors = [['#FFB3C1', '#E0527C'], ['#FFC98A', '#F28C38'], ['#D2B4FF', '#8A4FD8'], ['#EDB0DC', '#B1479A'], ['#C8A6EC', '#662B80']];
export const fullMonths = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const keyOf = title => title.toLowerCase().replace(/[^a-zàâçéèêëîïôûùüÿ]+/g, ' ').trim().split(' ')[0] || title.toLowerCase();
export function colorOf(title) {
  let hash = 0;
  for (const ch of keyOf(title)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return eventColors[hash % eventColors.length];
}

// ÉVÈNEMENTS DE TEST (en dur) : tant que Google Agenda n'est pas relié en ligne, des évènements factices sur 12 semaines permettent de voir la mise
// en page et le bouton « Voir la suite ». Ils ne s'affichent que si l'agenda ne renvoie rien ; à supprimer une fois l'agenda relié.
const DEMO_WEEK = [
  [0, 'Afrovibe avec Imen', '18:00', '19:00', 'La chapelle'],
  [1, 'Jardinage', '18:00', '19:00', 'Le jardin'],
  [1, 'Permanence d’accueil', '14:00', '17:00', 'Le bureau'],
  [2, 'Atelier cuisine du monde', '12:00', '14:00', 'La cantine'],
  [3, 'Soirée jeux de société', '19:00', '22:00', 'Le salon'],
  [4, 'Danse immersive', '18:00', '21:00', 'La chapelle'],
  [5, 'Marché solidaire', '10:00', '13:00', 'La cour'],
];
export function demoEvents(weeks, base) {
  const out = [];
  for (let w = 0; w < weeks; w += 1) {
    for (const [dow, title, start, end, place] of DEMO_WEEK) {
      if (w % 2 && dow === 5) continue; // le marché : une semaine sur deux
      const day = new Date(base);
      day.setDate(base.getDate() + w * 7 + dow);
      out.push({ title, date: isoDate(day), start, end, place, ...(title === 'Danse immersive' ? { featured: true } : {}) });
    }
  }
  return out;
}

// « La programmation » : agenda des prochains évènements (Google Agenda via /api/programmation), sans jours vides,
// groupés par jour et par mois, filtrables par activité. « Voir la suite » charge 4 semaines de plus.
export const isFeatured = event => Boolean(event.featured) || /^\s*[★⭐]/.test(event.title);
export const cleanTitle = title => title.replace(/^\s*[★⭐]\s*/, '');
