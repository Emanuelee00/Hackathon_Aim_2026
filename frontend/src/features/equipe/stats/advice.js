// Rule-based advice for the team: each rule reads the figures and suggests one concrete action.
// Thresholds are demo hypotheses, to adjust with the association.
export const BUSY_RATE = 60;
export const QUIET_RATE = 15;

const names = rows => rows.map(row => row.space.name).join(', ');

// Occupancy rows come from occupancy(): [{ space, hours, rate }].
export function spaceAdvice(rows) {
  const empty = rows.filter(row => row.rate === 0);
  const quiet = rows.filter(row => row.rate > 0 && row.rate < QUIET_RATE);
  const busy = rows.filter(row => row.rate >= BUSY_RATE);
  const quietest = [...rows].sort((a, b) => a.rate - b.rate)[0];
  return [
    ...busy.map(row => ({ tone: 'warn', title: `${row.space.name} est très demandé (${row.rate} %)`, text: `Gardez des créneaux libres pour le calme des résidentes et orientez certaines demandes vers ${quietest.space.name}.` })),
    empty.length && { tone: 'idea', title: `Aucune réservation : ${names(empty)}`, text: 'Proposez ces espaces aux associations hébergées ou en location à l’heure : ce sont des recettes possibles sans surcharger le lieu.' },
    quiet.length && { tone: 'idea', title: `Peu utilisés : ${names(quiet)}`, text: `Moins de ${QUIET_RATE} % d’occupation. Un créneau régulier (cours hebdomadaire, permanence) les ferait vivre.` },
  ].filter(Boolean);
}

// figures: { requests, events, satisfaction, community, delay, toReport } from the stats page.
export function followUpAdvice({ requests, events, satisfaction, community, delay, toReport }) {
  const rules = [
    [requests.waiting > 0, 'warn', `${requests.waiting} demande${requests.waiting > 1 ? 's' : ''} en attente de réponse`, 'Préparez-les pour le comité du vendredi : une réponse rapide évite que les porteurs de projet aillent ailleurs.'],
    [delay != null && delay > 3, 'warn', `Délai de réponse moyen : ${delay} jours`, 'Envoyez un accusé de réception dès la demande, même si la décision attend le comité.'],
    [toReport > 0, 'warn', `${toReport} bilan${toReport > 1 ? 's' : ''} à saisir`, 'Sans bilan, la fréquentation et la venue des résidentes manquent aux chiffres d’impact pour les financeurs.'],
    [satisfaction.ratings === 0, 'idea', 'Aucun questionnaire de satisfaction reçu', 'Envoyez le lien du questionnaire aux participantes et aux organisateurs le lendemain de chaque événement.'],
    [satisfaction.satisfiedRate != null && satisfaction.satisfiedRate < 80, 'warn', `Satisfaction à ${satisfaction.satisfiedRate} %`, 'Relisez les commentaires des notes basses et parlez-en au prochain comité.'],
    [satisfaction.logisticsReady != null && satisfaction.logisticsReady < 70, 'warn', 'Logistique à améliorer', 'Moins de 70 % des organisateurs ont trouvé tout prêt : vérifiez la checklist d’arrivée.'],
    [community.coverage != null && community.coverage < 70, 'warn', `${community.places - community.filled} poste${community.places - community.filled > 1 ? 's' : ''} bénévole à pourvoir`, 'Relayez les missions auprès de Benenova et sur la page bénévoles.'],
    [community.residentShare != null && community.residentShare < 20, 'idea', `Résidentes : ${community.residentShare} % des participations`, 'Réservez quelques places gratuites et présentez les activités en réunion de maison, sans obligation.'],
    [events.fillRate != null && events.fillRate < 70, 'idea', `Taux de remplissage : ${events.fillRate} %`, 'Les jauges annoncées sont souvent surestimées : proposez un espace plus petit ou relayez l’événement dans le quartier.'],
    [requests.acceptance != null && requests.acceptance < 50, 'idea', `Seules ${requests.acceptance} % des demandes sont acceptées`, 'Rendez la charte de programmation visible sur le formulaire pour recevoir des demandes mieux ciblées.'],
  ];
  return rules.filter(([applies]) => applies).map(([, tone, title, text]) => ({ tone, title, text }));
}
