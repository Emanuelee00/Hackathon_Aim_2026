import { useEffect, useState } from 'react';

// The spaces offered to the public, with the names, surfaces and prices of the « Espaces Chez Marthe » sheet.
// « reunion » is the Bureau; the Atelier is lent in exchange for free workshops.
export const defaultRentalSpaces = [
  { id: 'chapelle', space: 'chapelle', name: 'La Chapelle', photo: '/foto/chapelle.jpg', focus: 'center 14%', details: ['80 à 150 personnes', '114 m²', 'Concerts, spectacles, danse, yoga'], prices: [['2 heures', '40 €'], ['Demi-journée', '150 €'], ['Journée', '300 €']], note: 'Sonorisation (micro + enceinte) : 50 € en plus.' },
  { id: 'salon-collectif', space: 'salon-collectif', name: 'Salon collectif / Séminaire', photo: '/foto/salon.jpg', focus: 'center 45%', details: ['Maximum 20 personnes', '28 m²', 'Séminaires et réunions'], prices: [['2 heures', '40 €'], ['Demi-journée', '100 €'], ['Journée', '200 €']] },
  { id: 'reunion', space: 'reunion', name: 'Le Bureau', photo: '/foto/bureau.jpg', focus: 'center 40%', details: ['Maximum 6 personnes', '16 m²', 'Réunions en petit comité'], prices: [['2 heures', '40 €'], ['Demi-journée', '100 €'], ['Journée', '200 €']] },
  { id: 'atelier', space: 'atelier', name: 'L’Atelier', photo: '/foto/atelier.jpg', focus: 'center 55%', details: ['Échange de services'], exchange: 'Vous utilisez l’Atelier et, en échange, vous animez un atelier gratuit pour Chez Marthe.' },
  // Ces deux espaces sont gérés par des associations du lieu : la carte renvoie vers leur site (pas vers le formulaire de demande).
  { id: 'coworking', name: 'Le Coworking', photo: '/foto/coworking.jpg', focus: 'center 50%', details: ['Jusqu’à 12 places', 'Location à la place', 'Géré par Sista4good'], note: 'Tarifs et réservation auprès de Sista4good.', link: { url: 'https://www.sista4good.com/', label: 'Découvrir Sista4good' } },
  { id: 'cantines', name: 'Les Petites Cantines', photo: '/foto/cantine.webp', focus: 'center 50%', details: ['30 personnes', '32 m² + terrasse de 30 m²', 'Cantine solidaire à prix libre'], note: 'Privatisable, tarif sur devis.', link: { url: 'https://marseille.lespetitescantines.org/', label: 'Voir Les Petites Cantines' } },
];

// The cards the team saved in « Louer un espace (site) » (espaces.py), or the ones above until they change them.
export function useRentalSpaces() {
  const [cards, setCards] = useState(defaultRentalSpaces);
  useEffect(() => {
    fetch('/api/espaces-a-louer').then(response => (response.ok ? response.json() : null)).then(data => { if (data?.cards) setCards(data.cards); }).catch(() => {});
  }, []);
  return cards;
}
