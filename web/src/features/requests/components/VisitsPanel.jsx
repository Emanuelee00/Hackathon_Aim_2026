import { useState } from 'react';
import { useStore } from '../../../app/store.jsx';
import { spaceById } from '../../../shared/data/spaces.js';
import { dateLabel } from '../../../shared/lib/format.js';
import { availableVisitSlots, bookVisit } from '../visits.js';
import VisitSlotForm from './VisitSlotForm.jsx';
import VisitBooking from './VisitBooking.jsx';

export default function VisitsPanel({ event }) {
  const { visitSlots, saveVisitSlots } = useStore();
  const [visitor, setVisitor] = useState('');
  const [error, setError] = useState('');
  const available = availableVisitSlots(visitSlots, event);
  const booked = visitSlots.filter(slot => slot.booking?.eventId === event.id);
  const active = booked.some(slot => !slot.outcome);
  const open = !['completed', 'cancelled'].includes(event.status);
  const reserve = slot => {
    try { saveVisitSlots(bookVisit(visitSlots, slot.id, event, visitor)); setError(''); }
    catch (failure) { setError(failure.message); }
  };
  return <section className="detail-copy request-module"><h3>Visite du lieu</h3><p>Les créneaux sont partagés entre les demandes de ce site. La visite doit précéder l’événement ; son résultat ne confirme pas la demande automatiquement.</p>
    {error && <p role="alert" className="form-error">{error}</p>}
    {booked.map(slot => <VisitBooking key={slot.id} slot={slot} slots={visitSlots} onSave={saveVisitSlots} />)}
    {open && !active && <><label className="field"><span>Nom de la personne qui visite</span><input value={visitor} onChange={e => setVisitor(e.target.value)} /></label>
      {available.length ? <ul className="visit-slots">{available.map(slot => <li key={slot.id}><span>{dateLabel(slot.date)} · {slot.start}–{slot.end} · {slot.guide}</span><button className="button button-quiet" onClick={() => reserve(slot)}>Réserver cette visite</button><button className="button button-quiet" onClick={() => saveVisitSlots(visitSlots.map(item => item.id === slot.id ? { ...item, closed: true } : item))}>Fermer ce créneau</button></li>)}</ul> : <p>Aucun créneau disponible avant l’événement. Ouvrez une plage horaire ci-dessous.</p>}
    </>}
    {open && <VisitSlotForm site={spaceById[event.space]?.site} guide={event.referent} slots={visitSlots} onSave={saveVisitSlots} />}
    {visitSlots.some(slot => slot.history?.some(item => item.eventId === event.id)) && <details><summary>Visites annulées</summary>{visitSlots.flatMap(slot => (slot.history || []).filter(item => item.eventId === event.id).map((item, index) => <p key={`${slot.id}-${index}`}>{slot.date} · {slot.start} · {item.visitor} — {item.reason}</p>))}</details>}
  </section>;
}
