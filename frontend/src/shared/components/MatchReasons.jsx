const labels = { team: { goal: 'Son objectif', skill: 'Sa compétence', cv: 'Dans son CV' }, resident: { goal: 'Votre objectif', skill: 'Votre compétence', cv: 'Votre CV parle de' } };

// Shows the facts behind a match; an empty list means the activity is simply open to everyone.
export default function MatchReasons({ reasons, forResident = false }) {
  if (!reasons) return null;
  const kind = forResident ? 'resident' : 'team';
  return <div className="match-reasons"><strong>{forResident ? 'Pourquoi pour vous' : 'Pourquoi ce match'}</strong>
    {reasons.length ? <ul>{reasons.map((reason, index) => <li key={index}><small>{labels[kind][reason.kind]}</small>{reason.text}</li>)}</ul> : <p>Aucun lien direct avec le profil : activité ouverte à toutes.</p>}
  </div>;
}
