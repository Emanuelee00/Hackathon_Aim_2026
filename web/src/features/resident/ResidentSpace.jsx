import { useState } from 'react';
import { useStore } from '../../app/store.jsx';
import Icon from '../../shared/components/Icon.jsx';
import { EmptyState, PageIntro } from '../../shared/components/Primitives.jsx';
import { residents, residentById } from '../opportunities/data/residents.js';
import { residentContacts, residentSkills } from '../journeys/tracking.js';
import ProposalCard from './components/ProposalCard.jsx';
import MyJourneyCard from './components/MyJourneyCard.jsx';
import CvSkillsPanel from './components/CvSkillsPanel.jsx';
import ContactsPanel from './components/ContactsPanel.jsx';
import JobPlanForm from './components/JobPlanForm.jsx';

export default function ResidentSpace({ navigate }) {
  const { events, matches, updateMatchStatus } = useStore();
  const consenting = residents.filter(item => item.consent);
  const [residentId, setResidentId] = useState(consenting[0]?.id || '');
  const resident = residentById[residentId];
  const eventById = Object.fromEntries(events.map(event => [event.id, event]));
  const proposed = matches.filter(match => match.resident_id === residentId && match.status === 'proposed' && eventById[match.eventId]);
  const accepted = matches.filter(match => match.resident_id === residentId && match.status === 'accepted' && eventById[match.eventId]);
  const skills = residentSkills(matches, eventById, residentId);
  const contacts = residentContacts(matches, eventById, residentId);

  return <>
    <div className="resident-switch"><span>Vous consultez l’espace de</span><select value={residentId} onChange={event => setResidentId(event.target.value)}>{consenting.map(item => <option value={item.id} key={item.id}>{item.first_name}</option>)}</select><button className="text-link" onClick={() => navigate('dashboard')}><Icon name="back" size={14} />Retour à l’espace coordination</button></div>
    <PageIntro eyebrow="ESPACE RÉSIDENTE · DÉMONSTRATION" title={`Bonjour, ${resident?.first_name || ''}`} description="Ce que Chez Marthe vous propose. À vous de choisir, sans obligation."><span className="ethical-ai"><Icon name="heart" size={16} />Vous décidez, sans pression</span></PageIntro>

    {residentId === 'marie' && <p className="cv-demo-tools">Profil de démonstration prérempli : proposition, parcours, contact et CV fictifs. Descendez jusqu’à « Mon plan » pour essayer l’analyse.</p>}
    <section className="reports-section"><div className="section-heading"><div><span className="eyebrow">1 · PROPOSITIONS À EXAMINER</span><h2>On a pensé à vous</h2><p>La coordination vous propose une rencontre. Vous pouvez accepter ou décliner librement.</p></div></div>
      <div className="match-list">
        {proposed.map(match => <ProposalCard key={match.id} match={match} event={eventById[match.eventId]} onStatus={updateMatchStatus} />)}
        {!proposed.length && <EmptyState title="Rien à examiner pour le moment" text="Dès qu’une proposition vous concerne, elle apparaîtra ici." />}
      </div>
    </section>

    <section className="reports-section"><div className="section-heading"><div><span className="eyebrow">2 · MON PARCOURS</span><h2>Ce que j’ai déjà accompli</h2><p>Vos rencontres acceptées et ce qu’elles vous ont apporté.</p></div></div>
      <div className="journeys-grid">
        {accepted.map(match => <MyJourneyCard key={match.id} match={match} resident={resident} event={eventById[match.eventId]} />)}
        {!accepted.length && <section className="panel journeys-empty"><EmptyState title="Aucun parcours pour le moment" text="Une fois une proposition acceptée, elle apparaîtra ici avec ce qu’elle vous a apporté." /></section>}
      </div>
    </section>

    <section className="reports-section"><div className="section-heading"><div><span className="eyebrow">3 · VERS L’EMPLOI</span><h2>Mon plan, mes atouts, mon réseau</h2><p>Ce qui peut vous aider concrètement à trouver un emploi.</p></div></div>
      <div className="job-plan-grid">
        <JobPlanForm key={resident.id} resident={resident} skills={skills} />
        <div className="job-plan-side">
          <p className="small-label">MES COMPÉTENCES POUR MON CV</p>
          <CvSkillsPanel skills={skills} />
          <p className="small-label">MES CONTACTS</p>
          <ContactsPanel contacts={contacts} />
        </div>
      </div>
    </section>
  </>;
}
