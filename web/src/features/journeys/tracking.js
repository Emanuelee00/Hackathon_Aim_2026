export const emptyJourney = { participation: 'pending', skills: '', contact: '', nextStep: 'none', followUp30: 'pending', followUp90: 'pending', notes: '' };

export function journeyProgress(journey = emptyJourney) {
  const current = { ...emptyJourney, ...journey };
  return (current.participation !== 'pending' ? 25 : 0) + (current.skills.trim() ? 15 : 0) + (current.contact.trim() ? 15 : 0) + (current.nextStep !== 'none' ? 25 : 0) + (current.followUp30 !== 'pending' ? 10 : 0) + (current.followUp90 !== 'pending' ? 10 : 0);
}

export function journeyStage(journey = emptyJourney) {
  const current = { ...emptyJourney, ...journey };
  if (current.followUp90 !== 'pending') return 'Suivi à 90 jours réalisé';
  if (current.followUp30 !== 'pending') return 'Suivi à 30 jours réalisé';
  if (current.nextStep !== 'none') return 'Prochaine étape engagée';
  if (current.participation === 'participated') return 'Participation réalisée';
  if (current.participation === 'not_participated') return 'Participation non réalisée';
  return 'Participation à confirmer';
}

export function journeyStats(matches) {
  const accepted = matches.filter(match => match.status === 'accepted');
  return { active: accepted.length, participated: accepted.filter(match => match.journey?.participation === 'participated').length, nextSteps: accepted.filter(match => match.journey?.nextStep && match.journey.nextStep !== 'none').length, followed: accepted.filter(match => match.journey?.followUp30 !== undefined && match.journey.followUp30 !== 'pending').length };
}
