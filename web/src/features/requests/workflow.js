export const requestTypes = { programming: 'Programmation', rental: 'Location d’espace' };
export const requestQuestions = {
  programming: [
    ['audience', 'À quel public s’adresse l’activité ?'],
    ['missionFit', 'Comment le projet respecte-t-il la mission et la charte du lieu ?'],
    ['supportNeeds', 'Quel soutien attendez-vous des équipes ou associations ?'],
  ],
  rental: [
    ['rentalUse', 'Quel usage prévoyez-vous de l’espace ?'],
    ['equipmentNeeds', 'Quels équipements ou services sont nécessaires ?'],
    ['budgetDetails', 'Quel budget et quelles conditions de location sont envisagés ?'],
  ],
};

export function validateRequest(event, approving = false) {
  if (!requestTypes[event.requestType]) return 'Choisissez le type de demande : programmation ou location.';
  if (!approving) return '';
  if (requestQuestions[event.requestType].some(([key]) => !event[key]?.trim())) return 'Complétez les questions spécifiques à cette demande avant son approbation.';
  if (event.requestType === 'programming' && event.approval?.authority !== 'committee') return 'La programmation doit être validée par le comité de coordination.';
  if (event.requestType === 'programming' && event.reviewStage !== 'committee') return 'Présentez d’abord la demande au comité de coordination.';
  if (event.approval?.authority !== (event.requestType === 'programming' ? 'committee' : 'coordinator') || !event.approval?.reviewer?.trim() || !event.approval?.note?.trim() || !event.approval?.date) return 'Renseignez la personne qui consigne la décision, sa date et son motif.';
  return '';
}
