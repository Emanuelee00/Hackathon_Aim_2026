import { satisfactionSummary } from '../../features/reports/satisfaction.js';
import { requestTypes, requestQuestions } from '../../features/requests/workflow.js';
import { spaceById, statuses } from '../data/spaces.js';
import { nextStepLabels } from '../../features/journeys/tracking.js';
import { dateLabel, money } from './format.js';

export function download(name, text, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportEvent(event) {
  const lines = ['MARTHE — FICHE ÉVÉNEMENT', 'Données de démonstration · Document de travail', '', event.title, `Organisateur : ${event.organizer}`, `Responsable : ${event.referent?.trim() || 'Non renseigné'}`, `Équipe / association du responsable : ${event.referentTeam?.trim() || 'Non renseignée'}`, `Contact : ${event.email || 'Non renseigné'}`, `Date : ${dateLabel(event.date)} · ${event.start}–${event.end}`, `Espace : ${spaceById[event.space].name}`, `Statut : ${statuses[event.status]}`, `Personnes prévues : ${event.participants}`, `Recettes prévues : ${money(event.revenue)} · Coûts prévus : ${money(event.costs)}`, '', 'Proposition de participation volontaire', event.opportunity || 'À définir avec l’équipe.'];
  lines.push('', `Type : ${requestTypes[event.requestType] || 'À préciser'}`, ...((requestQuestions[event.requestType] || []).map(([key, label]) => `${label} : ${event[key] || 'À renseigner'}`)));
  if (event.approval) lines.push(`Décision : ${event.approval.authority === 'committee' ? 'Comité' : 'Coordinatrice'} · ${event.approval.date} · ${event.approval.reviewer}`, event.approval.note);
  const survey = satisfactionSummary(event.satisfactionResponses);
  lines.push('', `Suivi : ${event.queueReason || 'Non renseigné'} · Priorité : ${event.priority || 'normal'}`, 'ASSOCIATIONS', ...(event.partners || []).map(partner => `${partner.name} : ${partner.role}`), 'TÂCHES', ...(event.partnerTasks || []).map(task => `${task.title} : ${(event.partners || []).find(partner => partner.id === task.assignee)?.name || ''} · ${task.status}`), `QUESTIONNAIRES : ${survey.count} · Satisfaction ${survey.satisfaction}/5 · Accueil ${survey.welcome}/5 · Utilité ${survey.usefulness}/5`, ...(event.satisfactionResponses || []).map(response => response.comment || '').filter(Boolean));
  if (event.report) lines.push('', 'BILAN SAISI', `Retour de : ${event.report.feedbackAuthor || 'À préciser'} · ${event.report.feedbackTeam || 'À préciser'}`, `Présences : ${event.report.attendance}, dont résidentes : ${event.report.residents}`, `Recettes : ${money(event.report.revenue)} · Coûts : ${money(event.report.costs)}`, event.report.feedback, event.report.outcomes);
  download(`marthe-${event.id}.txt`, lines.join('\n'));
}

export function exportAttestation(match, resident, event) {
  const journey = match.journey || {};
  const lines = ['MARTHE — ATTESTATION DE PARTICIPATION', 'Données de démonstration · Document fictif, sans valeur officielle', '', `Résidente : ${resident.first_name}`, `Événement : ${event.title}`, `Organisé par : ${event.organizer}`, `Date : ${dateLabel(event.date)} · ${spaceById[event.space].name}`, '', `Compétence exercée : ${journey.skills || 'Non renseignée'}`, `Contact établi : ${journey.contact || 'Non renseigné'}`, `Prochaine étape engagée : ${nextStepLabels[journey.nextStep] || nextStepLabels.none}`, '', 'Fait à Marseille, avec l’équipe Chez Marthe.'];
  download(`marthe-attestation-${resident.id}-${event.id}.txt`, lines.join('\n'));
}

export function exportEmploymentPlan(plan, resident, objective) {
  const lines = ['MARTHE — MON PLAN VERS L’EMPLOI', 'Document de travail à valider avec une accompagnatrice', '', `Prénom : ${resident.first_name}`, `Objectif : ${objective}`, '', 'SYNTHÈSE', plan.summary, '', 'POINTS D’APPUI', ...plan.strengths.map(item => `• ${item}`), '', 'POINTS À RENFORCER', ...plan.gaps.map(item => `• ${item}`), '', 'MON CV', ...plan.cv_suggestions.map(item => `• ${item}`), '', 'MES PROCHAINES ÉTAPES'];
  plan.steps.forEach((step, index) => lines.push(`${index + 1}. ${step.title} — ${step.timeframe}`, step.action));
  download(`marthe-plan-emploi-${resident.id}.txt`, lines.join('\n'));
}

export function exportReports(events) {
  const rows = [['Événement', 'Date', 'Présences', 'Présences résidentes', 'Recettes EUR', 'Coûts EUR', 'Résultats observés', 'Responsable du retour', 'Équipe du retour', 'Réponses satisfaction', 'Satisfaction sur 5']];
  events.filter(event => event.status === 'completed' && event.report).forEach(event => rows.push([event.title, event.date, event.report.attendance, event.report.residents, event.report.revenue, event.report.costs, event.report.outcomes, event.report.feedbackAuthor || '', event.report.feedbackTeam || '', satisfactionSummary(event.satisfactionResponses).count, satisfactionSummary(event.satisfactionResponses).satisfaction]));
  const csv = rows.map(row => row.map(value => `"${String(value).replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`).join(';')).join('\r\n');
  download('marthe-bilans-demo.csv', '\uFEFF' + csv, 'text/csv;charset=utf-8');
}
