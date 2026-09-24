export const residentAnswers = { yes: 'Oui', no: 'Non', unknown: 'Je ne sais pas' };
export const logisticsAnswers = { ready: 'Tout était prêt', adjust: 'Quelques ajustements', issues: 'Des difficultés' };

// Errors keyed by field, so each message is shown under its question.
export function feedbackErrors(feedback) {
  const errors = {};
  if (!(Number.isInteger(feedback.rating) && feedback.rating >= 1 && feedback.rating <= 5)) errors.rating = 'Choisissez une note.';
  if (!(Number.isInteger(feedback.attendance) && feedback.attendance >= 0)) errors.attendance = 'Indiquez un nombre, même approximatif.';
  if (!residentAnswers[feedback.residents]) errors.residents = 'Choisissez une réponse.';
  return errors;
}

// Events whose organiser can give feedback: confirmed or done, and already held.
export const feedbackEvents = (events, today) => events.filter(event => ['confirmed', 'completed'].includes(event.status) && event.date <= today).sort((a, b) => b.date.localeCompare(a.date));
