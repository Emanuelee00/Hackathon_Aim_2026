export const sites = [
  { id: 'marseille', label: 'Chez Marthe', displayName: 'Chez Marthe', city: 'Marseille', neighborhood: 'La Plaine', capacity: 150, real: true },
  { id: 'nice', label: 'Nice (exemple)', displayName: 'Chez Marthe — Nice', city: 'Nice', neighborhood: 'Libération', capacity: 90, real: false },
  { id: 'avignon', label: 'Avignon (exemple)', displayName: 'Chez Marthe — Avignon', city: 'Avignon', neighborhood: 'Intra-muros', capacity: 70, real: false },
];
export const siteById = Object.fromEntries(sites.map(site => [site.id, site]));
