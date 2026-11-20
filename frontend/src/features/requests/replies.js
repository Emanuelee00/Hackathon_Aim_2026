const signature = '\n\nBien à vous,\nL’équipe Chez Marthe';

// A first draft of the answer, to be read and adapted by the team before sending.
export function draftReply(event, analysis) {
  const title = `« ${event.title} »`;
  if (analysis.verdict === 'ok') return `Bonjour,\n\nMerci pour votre proposition ${title}. Elle correspond bien à l’esprit de Chez Marthe et sera présentée au comité de coordination de vendredi.\n\nPour préparer la suite, nous vous proposons une visite du lieu mardi ou jeudi prochain, entre 14 h et 17 h. Quel créneau vous conviendrait ?${signature}`;
  if (analysis.verdict === 'no') return `Bonjour,\n\nMerci d’avoir pensé à Chez Marthe pour ${title}.\n\nNotre lieu est avant tout un centre d’hébergement, et nous veillons au calme et à l’intimité des femmes que nous accueillons. Nous ne pouvons donc pas donner suite à votre demande sous cette forme.\n\nNous restons disponibles pour en discuter.${signature}`;
  const points = analysis.criteria.filter(criterion => criterion.level !== 'ok').map(criterion => `- ${criterion.detail}`).join('\n');
  return `Bonjour,\n\nMerci pour votre proposition ${title}, qui nous intéresse.\n\nAvant de la présenter au comité de vendredi, nous aimerions en discuter avec vous :\n${points}\n\nSeriez-vous disponible pour une visite la semaine prochaine ?${signature}`;
}

export function mailtoLink(event, body) {
  return `mailto:${event.email || ''}?subject=${encodeURIComponent(`Votre demande Chez Marthe : ${event.title}`)}&body=${encodeURIComponent(body)}`;
}
