import { useState } from 'react';
import { useStore } from '../../app/store.jsx';
import { useAuth } from '../auth/AuthGate.jsx';
import { associations, onboardingSteps } from '../../shared/data/associations.js';
import { spaceById, TODAY } from '../../shared/data/spaces.js';
import { shortDate } from '../../shared/lib/format.js';
import { slotConflicts } from '../calendar/week.js';
import BookingForm from './BookingForm.jsx';
import SyncPanel from './SyncPanel.jsx';

const dayNames = ['', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];

function Slots({ association, conflicts }) {
  return <div className="panel partner-panel"><h3>Vos créneaux Chez Marthe</h3>
    <ul className="partner-slots">{association.slots.map(slot => {
      const clashes = conflicts.filter(item => item.slot.slotId === slot.id);
      return <li key={slot.id}><span><strong>{slot.title}</strong><small>{slot.weekdays.map(day => dayNames[day]).join(', ')} · {slot.start} – {slot.end} · {spaceById[slot.space].name}</small>{clashes.map(({ event, slot: clash }) => <small key={`${event.id}-${clash.date}`} className="partner-clash">Conflit le {shortDate(clash.date)} : {event.title}</small>)}</span><span className={`verdict ${clashes.length ? 'no' : 'ok'}`}>{clashes.length ? 'À arbitrer' : 'Confirmé'}</span></li>;
    })}</ul></div>;
}

function Onboarding({ state, onToggle }) {
  return <div className="panel partner-panel"><h3>Votre arrivée sur l’outil commun</h3>
    <ul className="partner-steps">{onboardingSteps.map(([key, label]) => <li key={key}><label><input type="checkbox" checked={Boolean(state[key])} disabled={key === 'synced'} onChange={() => onToggle(key)} />{label}</label></li>)}</ul></div>;
}

export default function PartnerSpace() {
  const { events, partners, savePartner } = useStore();
  // An association account is named after its association and only sees it; other accounts (demo) switch between them.
  const accountName = useAuth().user.name.toLowerCase();
  const own = associations.find(item => item.name.toLowerCase() === accountName);
  const [currentId, setCurrentId] = useState((own || associations[0]).id);
  const association = associations.find(item => item.id === currentId);
  const state = partners.find(partner => partner.id === currentId) || { id: currentId };
  const conflicts = slotConflicts(association, events, TODAY);
  return <div className="partner-space">
    <header className="landing-hero"><p className="eyebrow">ESPACE ASSOCIATIONS</p><h1>Un seul agenda pour tout le lieu</h1><p>Gardez vos outils : l’outil commun se synchronise avec eux.</p></header>
    {!own && <div className="site-tabs" role="tablist" aria-label="Association">{associations.map(item => <button key={item.id} className="chip" role="tab" aria-pressed={item.id === currentId} onClick={() => setCurrentId(item.id)}>{item.name}</button>)}</div>}
    <div className="partner-layout">
      <div className="partner-column"><div className="panel partner-panel"><h2>{association.name}</h2><p>{association.role}</p></div><Slots association={association} conflicts={conflicts} /><BookingForm association={association} /></div>
      <div className="partner-column"><SyncPanel key={association.id} association={association} state={state} conflicts={conflicts} /><Onboarding state={state} onToggle={key => savePartner({ ...state, [key]: !state[key] })} /></div>
    </div>
  </div>;
}
