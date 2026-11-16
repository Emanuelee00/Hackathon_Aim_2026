// Les lignes de « Financeurs potentiels » qui sont déjà des pistes de « Financements » (fichier AAP retroplanning, 57 pistes),
// relevées à la main le 16 novembre 2026 : identifiant de la ligne → nom(s) de la piste dans Financements.
// Toutes ont des informations en plus (e-mail, LinkedIn, vigilances, échéances…) : elles restent, en rouge.
// Une ligne est aussi reconnue quand une piste de Financements porte exactement son nom (par ex. après « Demander un financement »).

const KNOWN = {
  r40: ["Femmes des Territoires"],
  w12: ["Fonds L'Oréal pour les Femmes", "L’Oréal (fonds l’Oréal pour les Femmes)"],
  m01: ["DAPAT - Soutenir les femmes en détresse"],
  r14: ["la fondation des femmes"],
  a07: ["la fondation des femmes"],
  f06: ["la fondation des femmes"],
  w18: ["la fondation Kering"],
  r20: ["Fondation RAJA - Danièle Marcovici"],
  w08: ["DRDFE (Direction régionale aux droits des femmes et à l'égalité)", "DRDFE PACA", "La direction régionale aux droits des femmes et à l’égalité (DRDFE) PACA"],
  x008: ["DRDFE (Direction régionale aux droits des femmes et à l'égalité)", "DRDFE PACA", "La direction régionale aux droits des femmes et à l’égalité (DRDFE) PACA"],
  f09: ["DRDFE (Direction régionale aux droits des femmes et à l'égalité)", "DRDFE PACA", "La direction régionale aux droits des femmes et à l’égalité (DRDFE) PACA"],
  f10: ["DRDFE (Direction régionale aux droits des femmes et à l'égalité)", "DRDFE PACA", "La direction régionale aux droits des femmes et à l’égalité (DRDFE) PACA"],
  r06: ["La fondation Nexity"],
  x041: ["Fondation Castorama"],
  f20: ["Fondation Castorama"],
  r03: ["Fondation Vinci"],
  w05: ["Fondation Monoprix"],
  x045: ["Fondation l’Occitane"],
  e15: ["Fonds FEDER (Europe)"],
  r28: ["Fonds FSE"],
  a08: ["Fonds FSE"],
  e10: ["Fonds FSE"],
  r26: ["Fonds de la région SUD"],
  w11: ["BNP", "fondation BNP Paribas"],
  r27: ["La métropole Aix-Marseille", "Ville de Marseille / Métropole Aix-Marseille-Provence"],
  a10: ["La métropole Aix-Marseille", "Ville de Marseille / Métropole Aix-Marseille-Provence"],
  x001: ["Ville de Marseille / Métropole Aix-Marseille-Provence"],
  x002: ["Ville de Marseille / Métropole Aix-Marseille-Provence"],
  f08: ["Ville de Marseille / Métropole Aix-Marseille-Provence"],
  r21: ["Banques des territoires"],
  r11: ["Fondation groupe EDF"],
  w03: ["Fondation Laforêt"],
  f23: ["Fondation Laforêt"],
  w01: ["Fondation logement", "Fondation pour le logement"],
  r12: ["Fondation Brico dépôt"],
  a05: ["Fondation Brico dépôt"],
  f21: ["Fondation Brico dépôt"],
  w07: ["BPMed"],
  w04: ["Les Petites Pierres"],
  f26: ["Les Petites Pierres"],
  w06: ["CMA/CGN"],
  f27: ["CMA/CGN"],
  e01: ["AAP DAPHNE du programme CERV"],
  e02: ["AAP DAPHNE du programme CERV"],
  m19: ["Fondation Chanel"],
  x070: ["Fondation Elle"],
  x038: ["Fondation de France — pôle Droits des femmes"],
  r04: ["Fondation de France — pôle Droits des femmes"],
  r02: ["Fondation MACIF"],
  w09: ["FDVA (Fonds de développement de la vie associative)"],
  f12: ["FDVA (Fonds de développement de la vie associative)"],
  x027: ["DLA (Dispositif Local d'Accompagnement)"],
  w17: ["CAF / Département des Bouches-du-Rhône"],
  x019: ["CAF / Département des Bouches-du-Rhône"],
  r42: ["La France s'engage"],
  a01: ["La France s'engage"],
  r05: ["Fondation Caritas"],
};

export const normalName = text => (text || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’'"“”«»().,/:;–—-]/g, ' ').replace(/\s+/g, ' ').trim();

// Une fonction : ligne → nom de la piste de Financements qui lui correspond, ou ''.
export function fundingMatcher(funders) {
  const byName = new Map(funders.filter(funder => funder.name).map(funder => [normalName(funder.name), funder.name]));
  return row => {
    const exact = byName.get(normalName(row.name));
    if (exact) return exact;
    for (const name of KNOWN[row.id] || []) {
      const found = byName.get(normalName(name));
      if (found) return found;
    }
    return '';
  };
}
