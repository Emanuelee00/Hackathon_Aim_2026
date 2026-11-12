import { spaceById } from '../../shared/data/spaces.js';

// Le prix des espaces en un clic : on prend les tarifs déjà écrits pour les espaces (shared/data/spaces.js), les mêmes que sur le site.
// Un clic sur un tarif ajoute la ligne dans le devis ou la facture (un second clic augmente la quantité).
const DURATIONS = { '2h': '2 heures', half: 'Demi-journée', day: 'Journée', weekly: 'Séance hebdomadaire' };
const OFFERED = [
  { id: 'chapelle', name: 'La Chapelle' },
  { id: 'salon-collectif', name: 'Salon collectif / Séminaire' },
  { id: 'reunion', name: 'Le Bureau' },
];

export const priceGroups = [
  ...OFFERED.map(({ id, name }) => {
    const space = spaceById[id];
    const items = Object.entries(space.prices || {}).map(([key, price]) => ({ id: `${id}-${key}`, short: DURATIONS[key] || key, label: `${name} — ${DURATIONS[key] || key}`, price }));
    if (space.soundFee) items.push({ id: `${id}-son`, short: 'Sonorisation', label: `${name} — sonorisation (micro + enceinte)`, price: space.soundFee });
    return { id, name, items };
  }),
  { id: 'atelier', name: 'L’Atelier', items: [{ id: 'atelier-echange', short: 'Échange de services', label: 'L’Atelier — échange de services (atelier gratuit en contrepartie)', price: 0 }] },
  { id: 'autres', name: 'Autres', items: [{ id: 'libre', short: 'Prestation libre', label: '', price: null }] },
];
