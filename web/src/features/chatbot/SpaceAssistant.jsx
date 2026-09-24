import ChatBubble from './ChatBubble.jsx';

// One agent per signed-in space; the backend checks the account's role and scopes its data.
const assistants = {
  equipe: { title: 'Assistant de l’équipe', subtitle: 'Demandes, calendrier, questions reçues et parcours', greeting: 'Bonjour ! Je peux retrouver une demande, préparer le comité du vendredi, lister les questions en attente ou faire le point sur un parcours.' },
  residents: { title: 'Votre assistante', subtitle: 'Vos propositions, votre parcours, les activités', greeting: 'Bonjour ! Je peux vous expliquer vos propositions, votre parcours ou les activités ouvertes. Je peux aussi transmettre un message à l’équipe.' },
  partenaires: { title: 'Assistant associations', subtitle: 'Vos réservations et les créneaux libres', greeting: 'Bonjour ! Je peux vous dire où en sont vos réservations, quand les espaces sont déjà pris, et transmettre une demande à l’équipe.' },
  benevoles: { title: 'Assistant bénévoles', subtitle: 'Missions ouvertes et vos inscriptions', greeting: 'Bonjour ! Je peux vous aider à trouver une mission, retrouver vos inscriptions ou transmettre une question à l’équipe.' },
};

export default function SpaceAssistant({ spaceId }) {
  return <ChatBubble agentId={spaceId} {...assistants[spaceId]} />;
}
