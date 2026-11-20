// « Bilans des structures » : un bilan par structure et par mois (bilans.py). Ici, ce qui se calcule sans écran.

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export const monthOf = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
export const monthLabel = month => `${MONTHS[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;

// Le mois d'avant (step = -1) ou d'après (+1).
export function shiftMonth(month, step) {
  const date = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + step, 1);
  return monthOf(date);
}

export const entryFor = (entries, structure, month) => entries.find(entry => entry.structure === structure && entry.month === month);

export const questionsOf = structure => structure.sections.flatMap(section => section.questions);

// Combien de questions ont une réponse.
export function progress(structure, answers = {}) {
  const all = questionsOf(structure);
  return { answered: all.filter(question => answers[question.id] !== undefined && answers[question.id] !== '').length, total: all.length };
}

// Les nombres communs à toutes les structures, additionnés sur les mois donnés.
export function commonTotals(structures, entries, months) {
  const common = structures[0]?.sections.find(section => section.title === 'Indicateurs communs')?.questions.filter(question => question.type === 'number') || [];
  const links = structures[0]?.sections.find(section => section.title === 'Liens entre les structures du lieu')?.questions.filter(question => question.type === 'number') || [];
  return [...common, ...links].map(question => ({
    ...question,
    value: entries.filter(entry => months.includes(entry.month)).reduce((sum, entry) => sum + (Number(entry.answers?.[question.id]) || 0), 0),
  }));
}

// Les réponses d'un formulaire avant envoi : nombres en nombres, cases vides retirées.
export function toAnswers(structure, form) {
  const answers = {};
  for (const question of questionsOf(structure)) {
    const value = form[question.id];
    if (value === undefined || value === null || String(value).trim() === '') continue;
    answers[question.id] = question.type === 'number' ? Number(String(value).replace(',', '.')) : String(value).trim();
  }
  return answers;
}

// Ce qui empêche d'envoyer, ou ''.
export function checkAnswers(structure, form) {
  for (const question of questionsOf(structure)) {
    const value = form[question.id];
    if (question.type !== 'number' || value === undefined || String(value).trim() === '') continue;
    const number = Number(String(value).replace(',', '.'));
    if (!Number.isFinite(number) || number < 0) return `« ${question.label} » : indiquez un nombre positif.`;
  }
  return '';
}

export async function loadBilans() {
  const response = await fetch('/api/bilans').catch(() => null);
  if (!response?.ok) throw new Error('Les bilans n’ont pas pu être chargés.');
  return response.json();
}

export async function saveBilan(structure, month, answers) {
  const response = await fetch(`/api/bilans/${structure}/${month}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers }) }).catch(() => null);
  const data = await response?.json().catch(() => ({}));
  if (!response?.ok) throw new Error(typeof data?.detail === 'string' ? data.detail : 'Le bilan n’a pas pu être enregistré.');
  return data;
}
