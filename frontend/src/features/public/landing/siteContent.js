import { useEffect, useState } from 'react';
import { hostedAssociations, members } from '../site-pages/teamData.js';
import { LINKS } from './links.js';
import { defaultRentalSpaces } from './rentalSpaces.js';

// Le contenu de la page d'accueil, section par section : ce que l'équipe peut changer dans « Site » (textes, photos, listes,
// section affichée ou cachée). Ces valeurs sont celles d'origine ; ce que l'équipe enregistre les remplace (backend/features/equipe/site.py, /api/site).
const partnerLogo = name => `/foto/partenaires/${name}`;

export const defaultSite = {
  hero: {
    visible: true, cities: ['Marseille', 'Nice', 'Avignon', 'Paris', 'Angers', 'La Ciotat'],
    title1: 'Des lieux', mark1: 'Tremplins', title2: 'pour les', mark2: 'Femmes',
    subtitle: 'Habiter, travailler, vivre ensemble, créer du lien et rayonner.', photo: '/foto/haut-de-page-hd.webp',
    button1: 'Nous soutenir', button2: 'Louer un espace',
  },
  place: {
    visible: true, eyebrow: 'NOTRE PREMIER LIEU', title: 'Chez Marthe, Saint-Savournin',
    text: 'Un lieu vacant devient un lieu innovant : un ancien couvent de 1 500 m² dans le quartier des Réformés, trois bâtiments, une chapelle néogothique et un jardin, réveillés pour devenir la première Maison Tremplin.',
    facts: [{ value: '30', label: 'femmes hébergées, avec ou sans enfants' }, { value: '6', label: 'espaces partagés avec le quartier' }],
    pressLabel: 'On parle de nous',
  },
  team: {
    visible: true, kicker: 'ILS FONT VIVRE LE LIEU', title: 'L’équipe de Chez Marthe',
    intro: 'Celles qui font vivre Saint-Savournin au quotidien, avec les associations installées dans le lieu.',
    members: members.map(({ name, role, photo, text }) => ({ name, role, photo, text })),
    assocLabel: 'Avec nous, au quotidien :',
    associations: hostedAssociations.map(({ name, role, logo, url }) => ({ name, role, logo, url })),
    buttonLabel: 'Rencontrer toute l’équipe',
  },
  pillars: {
    visible: true,
    items: [
      { title: 'Se loger', photo: '/foto/facade.webp', text: 'Un toit sûr pour se poser et retrouver de la stabilité avant la prochaine étape.' },
      { title: 'Se reconstruire', photo: '/foto/sororite.webp', text: 'Un lieu d’écoute, sans jugement, pour prendre soin de soi à son rythme.' },
      { title: 'Se nourrir', photo: '/foto/cantine.webp', text: 'Des repas partagés à prix libre avec la cantine et le jardin.' },
      { title: 'Rayonner', photo: '/foto/jardin.webp', text: 'Des rencontres, des projets et des coups de main avec tout le quartier.' },
    ],
  },
  events: { visible: true, title: 'Nos évènements' },
  spaces: { visible: true, kicker: 'LOUER UN ESPACE', title: 'Un lieu pour votre activité', showRequest: true },
  partners: {
    visible: true, kicker: 'SOUTIENS ET PARTENAIRES', title: 'Nos partenaires',
    partners: [
      { name: 'Habitat Alternatif Social', logo: partnerLogo('has.webp'), url: 'https://www.has.asso.fr/' },
      { name: 'JUST', logo: partnerLogo('just.webp'), url: 'https://just.earth/' },
      { name: 'Les Petites Cantines Marseille', logo: partnerLogo('petites-cantines.webp'), url: 'https://marseille.lespetitescantines.org/' },
      { name: 'Sister4Good', logo: partnerLogo('sista4good.webp'), url: 'https://www.sista4good.com/' },
      { name: 'Benenova Marseille', logo: partnerLogo('benenova.webp'), url: 'https://www.benenova.fr/' },
    ],
    fundersTitle: 'Nos partenaires financiers',
    funders: [
      { name: 'Métropole Aix-Marseille-Provence', logo: partnerLogo('metropole-aix-marseille-provence.svg'), url: 'https://www.ampmetropole.fr/' },
      { name: 'Fondation de France', logo: partnerLogo('fondation-de-france.webp'), url: 'https://www.fondationdefrance.org/fr/' },
    ],
    supportersTitle: 'Ils nous accompagnent',
    supporters: [
      { name: 'Ville de Marseille', logo: partnerLogo('ville-de-marseille.webp'), url: 'https://www.marseille.fr/' },
      { name: 'KEDGE Entrepreneurship', logo: partnerLogo('kedge-entrepreneurship.webp'), url: 'https://kedge.edu/' },
      { name: 'Gagnante Be a Boss Women Tour 2025', logo: partnerLogo('be-a-boss-women-tour.webp'), url: 'https://www.beaboss-womentour.com/e/sud-2027' },
      { name: 'HEC Paris – Stand Up', logo: partnerLogo('hec-paris-stand-up.webp'), url: 'https://www.hec.edu/' },
    ],
  },
  involve: {
    visible: true, kicker: 'REJOINDRE LE MOUVEMENT', title: 'Nous soutenir',
    text: 'Un bâtiment vide ne change aucune vie. Don, adhésion, communauté ou lieu à nous confier : chaque soutien fait vivre Chez Marthe.',
    items: [
      { title: 'Proposer un lieu d’accueil', photo: '/foto/facade.webp', text: 'Vous avez les murs, elles ont l’avenir. Vous nous le confiez ?', url: '#contact' },
      { title: 'Faire un don', photo: '/foto/jardin.webp', text: '1 500 m² de vide ou 1 500 m² d’avenir ? À vous de voir : aidez-nous à les aménager.', url: LINKS.donate },
      { title: 'Adhérer', photo: '/foto/sororite.webp', text: 'Rejoindre l’association et porter le projet avec nous.', url: LINKS.join },
      { title: 'Les amies de Chez Marthe', photo: '/foto/cantine.webp', text: 'La communauté qui suit la vie du lieu au quotidien.', url: LINKS.friends },
    ],
  },
  contact: {
    visible: true, kicker: 'CONTACT', title: 'Contactez-nous',
    text: 'Vos clés peuvent ouvrir bien plus que des portes. Écrivez-nous : nous répondons généralement sous 1 à 2 jours ouvrables.',
  },
};

// Les ancres du menu de la page, par section : une section cachée sort aussi du menu.
export const sectionAnchors = { place: 'le-lieu', events: 'evenements', spaces: 'espaces', partners: 'partenaires', involve: 's-impliquer', contact: 'contact' };

// L'ordre des sections sur la page : celui que l'équipe a choisi, puis les sections qu'il ne mentionne pas (dans l'ordre d'origine).
export function sectionOrder(saved) {
  const known = Object.keys(defaultSite);
  const chosen = (Array.isArray(saved?.order) ? saved.order : []).filter(id => known.includes(id));
  return [...new Set([...chosen, ...known])];
}

// Ce que l'équipe a enregistré remplace, champ par champ, le contenu d'origine (les listes sont remplacées en entier).
export function mergeSite(saved) {
  return Object.fromEntries(Object.entries(defaultSite).map(([section, values]) => [section, { ...values, ...(saved?.[section] || {}) }]));
}

// Le contenu et les cartes de la page, lus une fois. `ready` passe à vrai à la réponse (ou au bout d'1,5 s si le serveur tarde),
// pour ne pas montrer l'ancien texte puis le nouveau.
export function useSite() {
  const [site, setSite] = useState({ content: mergeSite(null), cards: defaultRentalSpaces, order: sectionOrder(null), ready: false });
  useEffect(() => {
    let done = false;
    const finish = data => {
      if (done) return;
      done = true;
      setSite({ content: mergeSite(data?.content), cards: data?.cards || defaultRentalSpaces, order: sectionOrder(data?.content), ready: true });
    };
    const timer = setTimeout(() => finish(null), 1500);
    fetch('/api/site').then(response => (response.ok ? response.json() : null)).then(finish, () => finish(null)).finally(() => clearTimeout(timer));
    return () => { done = true; clearTimeout(timer); };
  }, []);
  return site;
}
