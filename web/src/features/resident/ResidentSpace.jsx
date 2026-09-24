import { useState } from 'react';
import { useStore } from '../../app/store.jsx';
import Icon from '../../shared/components/Icon.jsx';
import { residents, residentById } from '../opportunities/data/residents.js';
import { residentContacts, residentSkills } from '../journeys/tracking.js';
import { eligibleEvents } from '../opportunities/matching.js';
import { cvMatches, groupProposals } from './proposals.js';
import ProposalCard from './components/ProposalCard.jsx';
import ApplicationList from './components/ApplicationList.jsx';
import MyJourneyCard from './components/MyJourneyCard.jsx';
import CvSkillsPanel from './components/CvSkillsPanel.jsx';
import ContactsPanel from './components/ContactsPanel.jsx';
import JobPlanForm from './components/JobPlanForm.jsx';

function Tabs({ tab, setTab, counts }) {
  const items = [['proposals', 'Propositions', counts.proposals ? `${counts.proposals} à examiner` : 'Rien de nouveau', 'inbox'], ['journey', 'Mon parcours', `${counts.journey} activité${counts.journey > 1 ? 's' : ''}`, 'leaf'], ['plan', 'Mon plan emploi', 'CV + métier = étapes', 'file']];
  return <div className="resident-tabs" role="tablist" aria-label="Mon espace">{items.map(([id, label, hint, icon]) => <button key={id} id={`tab-${id}`} role="tab" aria-selected={tab === id} aria-controls={`panel-${id}`} className={id === 'proposals' && counts.news ? 'has-news' : ''} onClick={() => setTab(id)}><Icon name={icon} size={20} /><span><strong>{label}</strong><small>{hint}</small></span></button>)}</div>;
}

function ProposalGroup({ title, hint, icon, items, eventById, onDecide, limit, apply }) {
  const [expanded, setExpanded] = useState(false);
  if (!items.length) return null;
  const shown = expanded || !limit ? items : items.slice(0, limit);
  return <section className="proposal-group"><h2><Icon name={icon} size={19} />{title}<small>{hint}</small></h2>
    {shown.map(match => <ProposalCard key={match.id} match={match} event={eventById[match.eventId]} onDecide={onDecide} apply={apply} />)}
    {shown.length < items.length && <button className="button button-quiet" onClick={() => setExpanded(true)}>{items.length - shown.length > 1 ? `Voir les ${items.length - shown.length} autres activités` : 'Voir 1 autre activité'}</button>}
  </section>;
}

function Decision({ decision, onUndo }) {
  const messages = { accepted: ['C’est noté, vous participez !', ` « ${decision.title} » est ajouté à votre parcours. L’équipe vous confirmera les détails.`], applied: ['Candidature envoyée !', ` L’équipe vous répondra pour « ${decision.title} » selon les places et le budget.`], declined: ['C’est noté.', ' Aucune conséquence : d’autres propositions viendront.'] };
  const [title, text] = messages[decision.status];
  return <div className={`decision ${decision.status}`} role="status"><Icon name={decision.status === 'declined' ? 'close' : 'check'} size={20} /><p><strong>{title}</strong>{text}</p><button className="text-link" onClick={onUndo}>Annuler</button></div>;
}

export default function ResidentSpace({ navigate }) {
  const { events, matches, addResidentMatches, updateMatchStatus } = useStore();
  const consenting = residents.filter(item => item.consent);
  const [residentId, setResidentId] = useState(consenting[0]?.id || '');
  const [decisions, setDecisions] = useState([]);
  const resident = residentById[residentId];
  const eventById = Object.fromEntries(events.map(event => [event.id, event]));
  const mine = matches.filter(match => match.resident_id === residentId && eventById[match.eventId]);
  const accepted = mine.filter(match => match.status === 'accepted');
  const available = eligibleEvents(events);
  const { fromTeam, fromCv, open, applications } = groupProposals(mine, available, residentId);
  const [tab, setTab] = useState('proposals');
  const skills = residentSkills(matches, eventById, residentId);
  const decide = (match, status) => {
    if (match.isNew) addResidentMatches(residentId, [{ eventId: match.eventId, source: 'open', status, rationale: match.rationale, benefit: match.benefit, vigilance: match.vigilance }]);
    else updateMatchStatus(match.id, status);
    setDecisions(current => [{ id: match.id, status, title: eventById[match.eventId].title }, ...current]);
  };
  const undo = decision => { updateMatchStatus(decision.id, 'proposed'); setDecisions(current => current.filter(item => item !== decision)); };
  const addCvProposals = items => addResidentMatches(residentId, cvMatches(items));
  const switchResident = id => { setResidentId(id); setDecisions([]); setTab('proposals'); };

  return <div className="resident-space">
    <div className="demo-bar"><label>Démonstration · espace de <select value={residentId} onChange={event => switchResident(event.target.value)}>{consenting.map(item => <option value={item.id} key={item.id}>{item.first_name}</option>)}</select></label><button className="text-link" onClick={() => navigate('dashboard')}><Icon name="back" size={15} />Espace coordination</button></div>
    <header className="resident-hello"><span className={`resident-avatar ${resident.color}`}>{resident.initials}</span><div><h1>Bonjour {resident.first_name}</h1><p>Ici, vous choisissez librement. Rien n’est obligatoire.</p></div></header>
    <Tabs tab={tab} setTab={setTab} counts={{ proposals: fromTeam.length + fromCv.length + open.length, news: fromTeam.length + fromCv.length, journey: accepted.length }} />

    <section id="panel-proposals" role="tabpanel" aria-labelledby="tab-proposals" hidden={tab !== 'proposals'} className="resident-panel">
      {decisions.map(decision => <Decision key={decision.id} decision={decision} onUndo={() => undo(decision)} />)}
      <ProposalGroup title="Proposées par l’équipe" hint="Choisies pour vous par la coordination" icon="users" items={fromTeam} eventById={eventById} onDecide={decide} />
      <ProposalGroup title="Grâce à votre CV" hint="Trouvées en lisant votre CV" icon="sparkles" items={fromCv} eventById={eventById} onDecide={decide} apply />
      <ProposalGroup title="Ouvertes à toutes" hint="Vous pouvez candidater à toutes les activités" icon="calendar" items={open} eventById={eventById} onDecide={decide} limit={2} apply />
      <ApplicationList applications={applications} eventById={eventById} onWithdraw={match => updateMatchStatus(match.id, 'declined')} />
      {!fromTeam.length && !fromCv.length && !open.length && !applications.length && <div className="resident-empty"><h2>Pas de nouvelle proposition</h2><p>L’équipe vous proposera des activités selon vos envies. En attendant, préparez votre plan emploi.</p><button className="button button-dark" onClick={() => setTab('plan')}>Préparer mon plan emploi<Icon name="arrow" size={17} /></button></div>}
    </section>

    <section id="panel-journey" role="tabpanel" aria-labelledby="tab-journey" hidden={tab !== 'journey'} className="resident-panel resident-journey">
      <div className="activity-list">
        {accepted.map(match => <MyJourneyCard key={match.id} match={match} resident={resident} event={eventById[match.eventId]} />)}
        {!accepted.length && <div className="resident-empty"><h2>Votre parcours commence ici</h2><p>Acceptez une proposition : l’activité et ce qu’elle vous apporte apparaîtront ici.</p><button className="button button-dark" onClick={() => setTab('proposals')}>Voir les propositions</button></div>}
      </div>
      <aside className="side-lists"><CvSkillsPanel key={residentId} skills={skills} residentId={residentId} /><ContactsPanel contacts={residentContacts(matches, eventById, residentId)} /></aside>
    </section>

    <section id="panel-plan" role="tabpanel" aria-labelledby="tab-plan" hidden={tab !== 'plan'} className="resident-panel">
      <JobPlanForm key={resident.id} resident={resident} skills={skills} events={available} onProposals={addCvProposals} onShowProposals={() => setTab('proposals')} />
    </section>
  </div>;
}
