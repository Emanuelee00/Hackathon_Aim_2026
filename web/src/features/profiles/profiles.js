// Les espaces personnels de l'équipe (profils.py) : ce qui se calcule sans écran, et les échanges avec le serveur.
import { shrinkPhoto } from '../site/rentalCards.js';

export const CURRENT_KEY = 'marthe-profile';

// Un identifiant lisible tiré du prénom, différent de ceux qui existent (« lea », « lea-2 »…).
export function profileId(name, existing = []) {
  const base = (name || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'personne';
  let id = base;
  for (let n = 2; existing.includes(id); n += 1) id = `${base}-${n}`;
  return id;
}

export const blankProfile = (name, role = '', photo = '', existing = []) => ({
  id: profileId(name, existing), name: name.trim(), role: role.trim(), photo, menuOrder: [], starred: [],
  pageBackground: { kind: 'none', value: '' }, menuBackground: { kind: 'none', value: '' }, theme: 'light',
});

// La première fois : les personnes de l'équipe présentées sur le site.
export const seedProfiles = members => members.reduce((list, member) => [...list, blankProfile(member.name, member.role, member.photo, list.map(item => item.id))], []);

// Le menu dans l'ordre de la personne ; les rubriques qu'elle n'a pas encore rangées (nouvelles) suivent dans l'ordre d'origine.
export function orderedNavigation(navigation, profile) {
  const byId = Object.fromEntries(navigation.map(item => [item.id, item]));
  const chosen = (profile?.menuOrder || []).filter(id => byId[id]);
  return [...new Set([...chosen, ...navigation.map(item => item.id)])].map(id => byId[id]);
}

export const toggleStar = (profile, id) => ({ ...profile, starred: profile.starred.includes(id) ? profile.starred.filter(item => item !== id) : [...profile.starred, id] });

export const initials = name => (name || '?').split(/[\s-]+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('');

// Une couleur claire demande un texte foncé (menu sur fond clair).
export function isLight(hex) {
  const [r, g, b] = [1, 3, 5].map(at => parseInt(hex.slice(at, at + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.6;
}

// Le fond de la page : la couleur, ou l'image adoucie pour que les textes restent lisibles.
// En mode sombre ou violet, une couleur claire choisie avant est laissée de côté et l'image est assombrie.
export function pageStyle(background, theme = 'light') {
  const dark = theme !== 'light';
  if (background?.kind === 'color') return dark ? undefined : { background: background.value };
  const veil = theme === 'violet' ? 'rgba(36,14,48,.82)' : dark ? 'rgba(20,16,23,.84)' : 'rgba(250,246,247,.72)';
  if (background?.kind === 'image') return { background: `linear-gradient(${veil}, ${veil}), url("${background.value}") center / cover fixed` };
  return undefined;
}

// ☀ et M : un clic met le thème, un second revient au clair.
export const nextTheme = (current, wanted) => (current === wanted ? 'light' : wanted);

// Le fond du menu : la couleur, ou l'image assombrie (le texte du menu est clair).
export function menuStyle(background) {
  if (background?.kind === 'color') return { background: background.value };
  if (background?.kind === 'image') return { background: `linear-gradient(rgba(52,18,66,.78), rgba(52,18,66,.86)), url("${background.value}") center / cover` };
  return undefined;
}

export const PAGE_COLORS = ['#f6f5f4', '#fbeff3', '#f3e9f7', '#e8f1ea', '#e6f0f7', '#fbf3dc', '#fdebe0', '#ececec'];
export const MENU_COLORS = ['#662b80', '#3f1d4f', '#8a2f5c', '#1f4e5f', '#2f5d3a', '#7a4a16', '#2b2b38', '#b5476b'];

async function call(path, method = 'GET', body) {
  const response = await fetch(`/api/profils${path}`, body === undefined ? { method } : { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
  const data = await response?.json().catch(() => ({}));
  if (!response?.ok) throw new Error(typeof data?.detail === 'string' ? data.detail : 'L’enregistrement a échoué : vérifiez la connexion.');
  return data.profiles;
}

export const loadProfiles = () => call('');
export const saveAllProfiles = list => call('', 'PUT', list);
export const saveProfile = profile => call(`/${profile.id}`, 'PUT', profile);
export const removeProfile = id => call(`/${id}`, 'DELETE');

export async function uploadPhoto(file) {
  const data = await shrinkPhoto(file, 1800);
  const response = await fetch('/api/espaces-a-louer/photos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) }).catch(() => null);
  const answer = await response?.json().catch(() => ({}));
  if (!response?.ok) throw new Error(typeof answer?.detail === 'string' ? answer.detail : 'La photo n’a pas pu être envoyée.');
  return answer.url;
}
