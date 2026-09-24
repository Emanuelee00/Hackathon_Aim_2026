import { useState } from 'react';
import { useStore } from '../../app/store.jsx';
import Icon from '../../shared/components/Icon.jsx';
import { residents, residentById } from '../opportunities/data/residents.js';
import { residentContacts, residentSkills } from '../journeys/tracking.js';
import ProposalCard from './components/ProposalCard.jsx';
import MyJourneyCard from './components/MyJourneyCard.jsx';
import CvSkillsPanel from './components/CvSkillsPanel.jsx';
import ContactsPanel from './components/ContactsPanel.jsx';
import JobPlanForm from './components/JobPlanForm.jsx';

function Tabs({ tab, setTab, counts }) {
  const items = [['proposals', 'Propositions', counts.proposals ? `${counts.proposals} à examiner` : 'Rien de nouveau', 'inbox'], ['journey', 'Mon parcours', `${counts.journey} activité${counts.journey > 1 ? 's' : ''}`, 'leaf'], ['plan', 'Mon plan emploi', 'CV + métier = étapes', 'file']];
  return <div className="resident-tabs" role="tablist" aria-label="Mon espace">{items.map(([id, label, hint, icon]) => <button key={id} id={`tab-${id}`} role="tab" aria-selected={tab === id} aria-controls={`panel-${id}`} className={id === 'proposals' && counts.proposals ? 'has-news' : ''} onClick={() => setTab(id)}><Icon name={icon} size={20} /><span><strong>{label}</strong><small>{hint}</small></span></button>)}</div>;
}

function Decision({ decision, onUndo }) {
  const accepted = decision.status === 'accepted';
  return <div className={`decision ${decision.status}`} role="status"><Icon name={accepted ? 'check' : 'close'} size={20} /><p><strong>{accepted ? 'C’est noté, vous participez !' : 'Proposition refusée.'}</strong>{accepted ? ` « ${decision.title} » est ajouté à votre parcours. L’équipe vous confirmera les détails.` : ` Aucune conséquence : d’autres propositions viendront.`}</p><button className="text-link" onClick={onUndo}>Annuler</button></div>;
}

export default function ResidentSpace({ navigate }) {
  const { events, matches, updateMatchStatus } = useStore();
  const consenting = residents.filter(item => item.consent);
  const [residentId, setResidentId] = useState(consenting[0]?.id || '');
  const [decisions, setDecisions] = useState([]);
  const resident = residentById[residentId];
  const eventById = Object.fromEntries(events.map(event => [event.id, event]));
  const mine = status => matches.filter(match => match.resident_id === residentId && match.status === status && eventById[match.eventId]);
  const proposed = mine('proposed'), accepted = mine('accepted');
  const [tab, setTab] = useState(proposed.length ? 'proposals' : 'plan');
  const skills = residentSkills(matches, eventById, residentId);
  const decide = (match, status) => { updateMatchStatus(match.id, status); setDecisions(current => [{ id: match.id, status, title: eventById[match.eventId].title }, ...current]); };
  const undo = decision => { updateMatchStatus(decision.id, 'proposed'); setDecisions(current => current.filter(item => item !== decision)); };
  const switchResident = id => { setResidentId(id); setDecisions([]); setTab(matches.some(match => match.resident_id === id && match.status === 'proposed') ? 'proposals' : 'plan'); };

  return <div className="resident-space">
    <div className="demo-bar"><label>Démonstration · espace de <select value={residentId} onChange={event => switchResident(event.target.value)}>{consenting.map(item => <option value={item.id} key={item.id}>{item.first_name}</option>)}</select></label><button className="text-link" onClick={() => navigate('dashboard')}><Icon name="back" size={15} />Espace coordination</button></div>
    <header className="resident-hello"><span className={`resident-avatar ${resident.color}`}>{resident.initials}</span><div><h1>Bonjour {resident.first_name}</h1><p>Ici, vous choisissez librement. Rien n’est obligatoire.</p></div></header>
    <Tabs tab={tab} setTab={setTab} counts={{ proposals: proposed.length, journey: accepted.length }} />

    <section id="panel-proposals" role="tabpanel" aria-labelledby="tab-proposals" hidden={tab !== 'proposals'} className="resident-panel">
      {decisions.map(decision => <Decision key={decision.id} decision={decision} onUndo={() => undo(decision)} />)}
      {proposed.map(match => <ProposalCard key={match.id} match={match} event={eventById[match.eventId]} onDecide={decide} />)}
      {!proposed.length && <div className="resident-empty"><h2>Pas de nouvelle proposition</h2><p>L’équipe vous proposera des activités selon vos envies. En attendant, préparez votre plan emploi.</p><button className="button button-dark" onClick={() => setTab('plan')}>Préparer mon plan emploi<Icon name="arrow" size={17} /></button></div>}
    </section>

    <section id="panel-journey" role="tabpanel" aria-labelledby="tab-journey" hidden={tab !== 'journey'} className="resident-panel resident-journey">
      <div className="activity-list">
        {accepted.map(match => <MyJourneyCard key={match.id} match={match} resident={resident} event={eventById[match.eventId]} />)}
        {!accepted.length && <div className="resident-empty"><h2>Votre parcours commence ici</h2><p>Acceptez une proposition : l’activité et ce qu’elle vous apporte apparaîtront ici.</p><button className="button button-dark" onClick={() => setTab('proposals')}>Voir les propositions</button></div>}
      </div>
      <aside className="side-lists"><CvSkillsPanel skills={skills} /><ContactsPanel contacts={residentContacts(matches, eventById, residentId)} /></aside>
    </section>

    <section id="panel-plan" role="tabpanel" aria-labelledby="tab-plan" hidden={tab !== 'plan'} className="resident-panel">
      <JobPlanForm key={resident.id} resident={resident} skills={skills} />
    </section>
  </div>;
}
