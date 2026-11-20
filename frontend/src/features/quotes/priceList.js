import { spaceById } from '../../shared/data/spaces.js';

// Les tarifs à cliquer. Au départ : ceux des espaces (shared/data/spaces.js), les mêmes que sur le site. L'équipe peut les changer, en ajouter
// ou en retirer depuis la page (« Modifier les tarifs ») : la liste est alors enregistrée sur le serveur (/api/modeles/tarifs).
const DURATIONS = { '2h': '2 heures', half: 'Demi-journée', day: 'Journée', weekly: 'Séance hebdomadaire' };
const OFFERED = [
  { id: 'chapelle', name: 'La Chapelle' },
  { id: 'salon-collectif', name: 'Salon collectif / Séminaire' },
  { id: 'reunion', name: 'Le Bureau' },
];

export const defaultGroups = [
  ...OFFERED.map(({ id, name }) => {
    const space = spaceById[id];
    const items = Object.entries(space.prices || {}).map(([key, price]) => ({ id: `${id}-${key}`, name: DURATIONS[key] || key, price }));
    if (space.soundFee) items.push({ id: `${id}-son`, name: 'Sonorisation (micro + enceinte)', price: space.soundFee });
    return { id, name, items };
  }),
  { id: 'atelier', name: 'L’Atelier', items: [{ id: 'atelier-echange', name: 'Échange de services', price: 0 }] },
  { id: 'autres', name: 'Autres', items: [] },
];

// Le texte de la ligne ajoutée au devis : « La Chapelle — Demi-journée » (pour le groupe « Autres », seulement le nom du tarif).
export const designationOf = (group, item) => (group.id === 'autres' ? item.name : `${group.name} — ${item.name}`);

export const newSlug = prefix => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
