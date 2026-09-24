export const sites = [
  { id: 'marseille', name: 'Chez Marthe', city: 'Marseille', capacity: 150, real: true },
  { id: 'nice', name: 'Chez Marthe — Nice', city: 'Nice', capacity: 90, real: false },
];
export const siteById = Object.fromEntries(sites.map(site => [site.id, site]));
