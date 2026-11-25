// Each audience has its own subdomain; the bare domain (or www.) shows the landing page.
export const spaces = [
  { id: 'residents', label: 'Résidentes', icon: 'leaf', text: 'Vos propositions d’activités, votre parcours et votre plan emploi.' },
  { id: 'equipe', label: 'Équipe', icon: 'dashboard', text: 'Coordonner les demandes, le calendrier, les espaces et les bilans.' },
  { id: 'benevoles', label: 'Bénévoles', icon: 'heart', text: 'Donner un coup de main aux événements du lieu.' },
  { id: 'partenaires', label: 'Associations', icon: 'users', text: 'Associations hébergées : vos créneaux, votre agenda synchronisé, vos réservations.' },
];

// "equipe.marthe.fr" → "equipe"; "marthe.fr" → null. Works locally with equipe.localhost.
export function spaceFromHost(hostname) {
  const first = hostname.split('.')[0];
  return spaces.some(space => space.id === first) ? first : null;
}

function rootHost(hostname) {
  return spaceFromHost(hostname) || hostname.startsWith('www.') ? hostname.slice(hostname.indexOf('.') + 1) : hostname;
}

// A bare IP (127.0.0.1, [::1]) has no subdomains: links from it must switch to
// localhost, which browsers resolve to the loopback with any subdomain.
const LOOPBACK_IP = /^(127\.0\.0\.1|\[::1\])$/;

// Link to a space (or to the landing page when space is null), keeping protocol and port.
export function spaceUrl(space, { protocol, hostname, port } = window.location) {
  const base = LOOPBACK_IP.test(hostname) ? 'localhost' : hostname;
  const host = space ? `${space}.${rootHost(base)}` : rootHost(base);
  return `${protocol}//${host}${port ? `:${port}` : ''}/`;
}
