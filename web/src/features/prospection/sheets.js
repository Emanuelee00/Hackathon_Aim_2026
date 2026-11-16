// « Financeurs potentiels » : les trois tableaux du fichier de prospection de l'équipe, leurs colonnes, leurs tris et leurs filtres.
// Une ligne est un objet simple ({ id, name, … , color }) ; les tableaux sont enregistrés tels quels sur le serveur (store).
import { emptyFunder } from '../funding/funding.js';
import { amountValue } from '../funding/sorting.js';
import { adviceFor } from './advice.js';

// Adéquation : de la plus forte à la plus faible (les valeurs écrites à la main restent possibles, classées à la fin).
export const FITS = ['Très élevée', 'Élevée', 'Élevée à moyen terme', 'Moyenne', 'À moyen terme', 'Conditionnelle', 'Faible à conditionnelle', 'Exclue'];
// Statuts proposés : ceux du fichier, puis ceux du suivi d'une demande.
export const STATUSES = ['À contacter', 'Contacté', 'À explorer', 'À qualifier', 'À vérifier', 'À utiliser', 'Veille continue', 'Veille 2027', 'Veille prochaine édition', 'À moyen terme', 'Trop tôt actuellement',
  'Contact pris', 'Dossier en préparation', 'Dossier déposé', 'Obtenu', 'Refusé', 'Déjà sollicitée'];

// État d'un appel (européen ou français).
export const EU_STATES = ['Ouvert', 'À venir', 'Permanent', 'À vérifier', 'Clos – prochaine édition à surveiller', 'Fonds gérés en France', 'Candidature déposée', 'Obtenu', 'Refusé'];

// La couleur d'un statut ou d'une adéquation : à faire, à creuser, en veille, contacté (vert), en cours, gagné, fermé.
export function tone(value) {
  const text = (value || '').toLowerCase();
  if (!text) return 'none';
  if (/^ouvert/.test(text)) return 'hot';
  if (/^à venir|^permanent|gérés en france/.test(text)) return 'warm';
  if (/^clos/.test(text)) return 'watch';
  if (/candidature déposée/.test(text)) return 'active';
  if (/obtenu/.test(text)) return 'won';
  if (/^contacté/.test(text)) return 'contacted';
  if (/refus|déjà|exclu/.test(text)) return 'closed';
  if (/contact pris|dossier|déposé/.test(text)) return 'active';
  if (/veille|moyen terme|trop tôt/.test(text)) return 'watch';
  if (/à contacter|très élevée/.test(text)) return 'hot';
  if (/élevée/.test(text)) return 'warm';
  return 'explore';
}

// Les colonnes « Site / lien », « Contact direct » (e-mail), « LinkedIn » et « Points de vigilance » viennent tout de suite après le nom et l'état,
// pour être visibles sans faire défiler le tableau.
const prospectColumns = [
  ['name', 'Financeur / dispositif', 210], ['fit', 'Adéquation', 130], ['status', 'Statut', 150], ['link', 'Site / lien', 190], ['email', 'Contact direct (e-mail)', 230], ['linkedin', 'LinkedIn', 230],
  ['vigilance', 'Points de vigilance', 240], ['advice', 'Conseils', 240], ['nature', 'Nature', 150], ['action', 'Action recommandée', 230], ['themes', 'Thématiques', 220], ['support', 'Type de soutien', 210],
  ['eligible', 'Porteur éligible', 170], ['contact', 'Contact (nom)', 150], ['lastExchange', 'Dernier échange', 150], ['followUp', 'Relance le', 150],
  ['requested', 'Montant demandé', 130], ['obtained', 'Montant obtenu', 130], ['card', '', 160],
];
const callColumns = [
  ['name', 'Appel / dispositif', 230], ['deadline', 'Date limite', 150], ['period', 'Échéance / période', 220], ['link', 'Lien', 190], ['email', 'Contact direct (e-mail)', 230], ['linkedin', 'LinkedIn', 230],
  ['conditions', 'Conditions / points de vigilance', 260], ['advice', 'Conseils', 240], ['purpose', 'Objet', 190], ['relevance', 'Pertinence', 170], ['nextAction', 'Prochaine action', 230], ['owner', 'Resp.', 100], ['card', '', 125],
];
// Appels européens et appels français : mêmes colonnes ; pour les appels français, « Programme » est le financeur.
const callsColumns = programLabel => [
  ['name', 'Appel / programme', 240], ['fit', 'Adéquation', 130], ['state', 'État', 170], ['deadline', 'Date limite', 150], ['link', 'Site / lien', 190],
  ['email', 'Contact direct (e-mail)', 230], ['linkedin', 'LinkedIn', 230], ['vigilance', 'Points de vigilance', 230], ['advice', 'Conseils', 240], ['program', programLabel, 170], ['calendar', 'Calendrier / prochaine édition', 250],
  ['purpose', 'Objet', 230], ['amount', 'Montant', 180], ['partners', 'Partenariat', 200], ['action', 'Prochaine action', 240], ['owner', 'Resp.', 100], ['card', '', 125],
];
const euColumns = callsColumns('Programme');
const frColumns = callsColumns('Financeur');
// Mécènes et investisseurs : philanthropes et cercles de mécènes (pour l'association), business angels (volet B seulement).
export const PATRON_TYPES = ['Philanthropes (fonds familial)', 'Philanthropes (entrepreneurs)', 'Cercle d’entreprises mécènes', 'Club d’entrepreneurs mécènes', 'Fonds d’entreprise (Marseille)', 'Fonds de dotation', 'Soirée de collecte', 'Réseau de femmes', 'Réseau de philanthropes', 'Réseau de fondations familiales', 'Annuaire', 'Business angels (volet B)', 'Business angels à impact (volet B)', 'Fédération de business angels (volet B)'];
const patronColumns = [
  ['name', 'Mécène / réseau', 220], ['type', 'Type', 190], ['fit', 'Adéquation', 130], ['status', 'Statut', 150], ['link', 'Site / lien', 190], ['email', 'Contact direct (e-mail)', 230],
  ['linkedin', 'LinkedIn', 230], ['vigilance', 'Points de vigilance', 230], ['advice', 'Conseils', 240], ['people', 'Personnes clés', 240], ['funds', 'Ce qu’ils soutiennent', 260], ['amount', 'Montants', 180],
  ['action', 'Prochaine action', 240], ['contact', 'Contact (nom)', 150], ['lastExchange', 'Dernier échange', 150], ['followUp', 'Relance le', 150], ['card', '', 125],
];
const strategyColumns = [
  ['part', 'Volet', 200], ['scope', 'Périmètre', 280], ['targets', 'Financeurs à cibler', 260], ['documents', 'Pièces / données à préparer', 280], ['vigilance', 'Vigilances', 260], ['card', '', 90],
];

const blankOf = (prefix, columns) => () => ({ ...Object.fromEntries(columns.filter(([key]) => key !== 'card').map(([key]) => [key, ''])), id: `${prefix}-${crypto.randomUUID()}`, color: '' });

// kinds : comment une cellule se modifie (texte sur plusieurs lignes par défaut).
export const SHEETS = {
  repertoire: {
    storeKey: 'prospects', layoutKey: 'marthe-prospects-table-v3', title: 'Répertoire des financeurs', tab: 'Répertoire', item: 'financeur', columns: prospectColumns,
    kinds: { advice: 'advice', fit: 'fit', status: 'status', link: 'link', email: 'email', linkedin: 'link', lastExchange: 'date', followUp: 'date', name: 'title' },
    filters: [['status', 'Tous les statuts'], ['fit', 'Toutes les adéquations']], search: ['name', 'nature', 'themes', 'support', 'action', 'vigilance', 'contact', 'email', 'linkedin', 'eligible'],
    sortable: ['name', 'nature', 'fit', 'status', 'lastExchange', 'followUp', 'requested', 'obtained'], blank: blankOf('r', prospectColumns),
  },
  calls: {
    storeKey: 'prospectCalls', layoutKey: 'marthe-prospect-calls-table-v3', title: 'Appels et échéances', tab: 'Appels et échéances', item: 'appel', columns: callColumns,
    kinds: { advice: 'advice', link: 'link', email: 'email', linkedin: 'link', deadline: 'date', name: 'title' },
    filters: [['relevance', 'Toutes les pertinences']], search: ['name', 'purpose', 'period', 'relevance', 'conditions', 'nextAction', 'owner', 'email', 'linkedin'],
    sortable: ['name', 'deadline', 'relevance', 'owner'], blank: blankOf('a', callColumns),
  },
  europe: {
    storeKey: 'euCalls', layoutKey: 'marthe-eu-calls-table-v3', title: 'Appels européens', tab: 'Appels européens', item: 'appel', columns: euColumns,
    kinds: { advice: 'advice', fit: 'fit', state: 'state', link: 'link', email: 'email', linkedin: 'link', deadline: 'date', name: 'title' },
    filters: [['state', 'Tous les états'], ['fit', 'Toutes les adéquations']], search: ['name', 'program', 'purpose', 'calendar', 'partners', 'action', 'vigilance', 'owner', 'email', 'linkedin'],
    sortable: ['name', 'program', 'fit', 'state', 'deadline', 'owner'], blank: blankOf('e', euColumns),
  },
  france: {
    storeKey: 'frCalls', layoutKey: 'marthe-fr-calls-table-v2', title: 'Appels français', tab: 'Appels français', item: 'appel', columns: frColumns,
    kinds: { advice: 'advice', fit: 'fit', state: 'state', link: 'link', email: 'email', linkedin: 'link', deadline: 'date', name: 'title' },
    filters: [['state', 'Tous les états'], ['fit', 'Toutes les adéquations']], search: ['name', 'program', 'purpose', 'calendar', 'partners', 'action', 'vigilance', 'owner', 'email', 'linkedin'],
    sortable: ['name', 'program', 'fit', 'state', 'deadline', 'owner'], blank: blankOf('f', frColumns),
  },
  patrons: {
    storeKey: 'patrons', layoutKey: 'marthe-patrons-table-v2', title: 'Mécènes et investisseurs', tab: 'Mécènes et investisseurs', item: 'mécène', columns: patronColumns,
    kinds: { advice: 'advice', fit: 'fit', status: 'status', type: 'ptype', link: 'link', email: 'email', linkedin: 'link', lastExchange: 'date', followUp: 'date', name: 'title' },
    filters: [['type', 'Tous les types'], ['fit', 'Toutes les adéquations']], search: ['name', 'type', 'people', 'funds', 'action', 'vigilance', 'contact', 'email', 'linkedin'],
    sortable: ['name', 'type', 'fit', 'status', 'lastExchange', 'followUp'], blank: blankOf('m', patronColumns),
  },
  strategy: {
    storeKey: 'fundingStrategy', layoutKey: 'marthe-funding-strategy-table-v1', title: 'Stratégie de financement', tab: 'Stratégie', item: 'volet', columns: strategyColumns,
    kinds: { part: 'title' }, filters: [], search: ['part', 'scope', 'targets', 'documents', 'vigilance'], sortable: ['part'], blank: blankOf('s', strategyColumns),
  },
};

for (const [id, sheet] of Object.entries(SHEETS)) sheet.id = id;

// Les lignes qui correspondent à la recherche et aux filtres choisis.
export function filterRows(rows, sheet, query, chosen) {
  const words = query.trim().toLowerCase();
  return rows.filter(row => (!words || sheet.search.some(key => (row[key] || '').toLowerCase().includes(words)))
    && Object.entries(chosen).every(([key, value]) => !value || (row[key] || '') === value));
}

const sortValue = (key, row) => {
  const value = row[key] || '';
  if (!value) return null;
  if (key === 'fit') return FITS.includes(value) ? FITS.indexOf(value) : FITS.length;
  if (key === 'status') return STATUSES.includes(value) ? STATUSES.indexOf(value) : STATUSES.length;
  if (key === 'state') return EU_STATES.includes(value) ? EU_STATES.indexOf(value) : EU_STATES.length;
  if (key === 'requested' || key === 'obtained') return amountValue(value);
  return value.toLocaleLowerCase('fr');
};

// Trié comme une liste de boutique : croissant, décroissant ; les cases vides toujours à la fin.
export function sortRows(rows, sort) {
  if (!sort) return rows;
  const sign = sort.direction === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => {
    const [first, second] = [sortValue(sort.key, a), sortValue(sort.key, b)];
    if (first === second) return 0;
    if (first === null) return 1;
    if (second === null) return -1;
    return (typeof first === 'string' ? first.localeCompare(second, 'fr') : first - second) * sign;
  });
}

// Les valeurs proposées pour un filtre : celles qui existent dans le tableau, dans l'ordre de la liste puis alphabétique.
export function filterOptions(rows, key) {
  const order = key === 'fit' ? FITS : key === 'status' ? STATUSES : key === 'state' ? EU_STATES : [];
  const values = [...new Set(rows.map(row => row[key]).filter(Boolean))];
  return values.sort((a, b) => ((order.indexOf(a) + 1 || 999) - (order.indexOf(b) + 1 || 999)) || a.localeCompare(b, 'fr'));
}

// Quand l'équipe décide de demander un financement : la piste passe dans le tableau de bord « Financements ».
export function toFunder(prospect) {
  const lines = (...pairs) => pairs.filter(([, value]) => value).map(([label, value]) => `${label} : ${value}`).join('\n');
  return {
    ...emptyFunder(), status: 'todo', name: prospect.name, type: prospect.nature, contact: prospect.contact, amount: prospect.requested || prospect.support,
    purpose: lines(['Thématiques', prospect.themes], ['Action recommandée', prospect.action]), links: prospect.link, notes: lines(['Points de vigilance', prospect.vigilance], ['Porteur éligible', prospect.eligible]),
    history: lines(['Venu de « Financeurs potentiels »', prospect.status], ['Dernier échange', prospect.lastExchange]),
  };
}

// Les chiffres du haut de la page.
export function counts(prospects, calls, today, europe = [], france = []) {
  const status = value => prospects.filter(row => row.status === value).length;
  const soon = [...calls, ...europe, ...france].filter(call => call.deadline && call.deadline >= today && (Date.parse(call.deadline) - Date.parse(today)) / 86400000 <= 45);
  soon.sort((a, b) => a.deadline.localeCompare(b.deadline));
  return { hot: prospects.filter(row => row.fit === 'Très élevée' && !['closed', 'won'].includes(tone(row.status))).length, toContact: status('À contacter'), inProgress: prospects.filter(row => ['active', 'contacted'].includes(tone(row.status))).length, soon };
}

// Pour l'export Excel : les colonnes dans l'ordre affiché, avec leur titre.
export function toSheet(sheet, rows, order) {
  const keys = order.filter(key => key !== 'card');
  const labels = Object.fromEntries(sheet.columns);
  return { title: sheet.tab === 'Répertoire' ? 'Répertoire financeurs' : sheet.title, columns: keys.map(key => labels[key]), rows: rows.map(row => keys.map(key => String(key === 'advice' ? adviceFor(sheet.id, row) : row[key] ?? ''))) };
}
