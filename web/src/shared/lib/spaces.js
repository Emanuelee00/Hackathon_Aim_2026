// Each audience has its own subdomain; the bare domain (or www.) shows the landing page.
export const spaces = [
  { id: 'residents', label: 'Résidentes', icon: 'leaf', text: 'Vos propositions d’activités, votre parcours et votre plan emploi.' },
  { id: 'equipe', label: 'Équipe', icon: 'dashboard', text: 'Coordonner les demandes, le calendrier, les espaces et les bilans.' },
  { id: 'benevoles', label: 'Bénévoles', icon: 'heart', text: 'Donner un coup de main aux événements du lieu.' },
  { id: 'partenaires', label: 'Associations', icon: 'users', text: 'Associations hébergées : vos créneaux, votre agenda synchronisé, vos réservations.' },
  // Reached through the link sent to organisers after their event, not listed on the landing page.
  { id: 'bilan', label: 'Bilan', icon: 'checks', text: 'Le bilan de votre événement, en deux minutes.', hidden: true },
];

// "equipe.marthe.fr" → "equipe"; "marthe.fr" → null. Works locally with equipe.localhost.
export function spaceFromHost(hostname) {
  const first = hostname.split('.')[0];
  return spaces.some(space => space.id === first) ? first : null;
}

function rootHost(hostname) {
  return spaceFromHost(hostname) || hostname.startsWith('www.') ? hostname.slice(hostname.indexOf('.') + 1) : hostname;
}

// Link to a space (or to the landing page when space is null), keeping protocol and port.
export function spaceUrl(space, { protocol, hostname, port } = window.location) {
  const host = space ? `${space}.${rootHost(hostname)}` : rootHost(hostname);
  return `${protocol}//${host}${port ? `:${port}` : ''}/`;
}
