import { useMemo, useState } from 'react';
import { useStore } from '../../app/store.jsx';
import Icon from '../../shared/components/Icon.jsx';
import { PageIntro } from '../../shared/components/Primitives.jsx';
import { dateLabel } from '../../shared/lib/format.js';
import { residents, residentById } from './data/residents.js';
import { eligibleEvents, eligibleResidents, sortForReview, workflowCounts } from './matching.js';
import ProgressBar from '../../shared/components/ProgressBar.jsx';
import SuggestionCard from './components/SuggestionCard.jsx';

export default function Opportunities() {
  const { events, matches, replaceSuggestions, updateMatchStatus } = useStore();
  const candidates = useMemo(() => eligibleEvents(events), [events]);
  const profiles = eligibleResidents(residents);
  const [eventId, setEventId] = useState(candidates[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const selected = candidates.find(event => event.id === eventId);
  const suggestions = sortForReview(matches.filter(match => match.eventId === eventId));
  const applicationsFor = id => matches.filter(match => match.eventId === id && match.status === 'applied').length;
  const counts = workflowCounts(matches);

  const runMatching = async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/match', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: { title: selected.title, category: selected.category || '', description: selected.description, opportunity: selected.opportunity }, residents: profiles.map(({ id, first_name, goals, skills, languages, availability, consent }) => ({ id, first_name, goals, skills, languages, availability, consent })) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Le matching est indisponible.');
      replaceSuggestions(eventId, data.matches);
    } catch (exception) { setError(exception.message); }
    finally { setLoading(false); }
  };

  return <>
    <PageIntro eyebrow="DES RENCONTRES QUI OUVRENT DES PORTES" title="Opportunités & parcours" description="L’IA suggère, l’équipe décide, chaque résidente choisit."><span className="ethical-ai"><Icon name="sparkles" size={16} />Copilote local · supervision humaine</span></PageIntro>
    <section className="journey-metrics"><div><strong>{profiles.length}</strong><span>profils consentants</span></div><div><strong>{counts.proposed}</strong><span>propositions en attente</span></div><div><strong>{counts.applied}</strong><span>candidatures à traiter</span></div><div><strong>{counts.accepted}</strong><span>accords enregistrés</span></div><p><Icon name="heart" size={18} />Aucune décision n’est automatisée.</p></section>
    <div className="opportunity-layout"><aside className="panel opportunity-context"><p className="eyebrow">1 · CHOISIR UNE OPPORTUNITÉ</p><label><span>Événement à analyser</span><select value={eventId} onChange={event => setEventId(event.target.value)}>{candidates.map(event => <option value={event.id} key={event.id}>{event.title} · {dateLabel(event.date)}{applicationsFor(event.id) ? ` · ${applicationsFor(event.id)} candidature${applicationsFor(event.id) > 1 ? 's' : ''}` : ''}</option>)}</select></label>{selected && <div className="selected-opportunity"><small>OPPORTUNITÉ IDENTIFIÉE</small><p>{selected.opportunity}</p><span>{selected.organizer}</span></div>}<div className="consent-list"><div><strong>Profils disponibles</strong><small>Seulement avec accord de traitement</small></div>{residents.map(resident => <div className={!resident.consent ? 'no-consent' : ''} key={resident.id}><span className={`resident-avatar ${resident.color}`}>{resident.initials}</span><span><strong>{resident.first_name}</strong><small>{resident.goals[0]}</small></span><i>{resident.consent ? 'Consentement actif' : 'Non utilisé'}</i></div>)}</div><button className="button button-dark matching-button" disabled={!selected || loading} onClick={runMatching}><Icon name="sparkles" size={17} />{loading ? 'Analyse en cours…' : suggestions.length ? 'Relancer le matching' : 'Lancer le matching'}</button><p className="ai-caption">Le modèle reçoit uniquement les informations affichées et ne prend aucune décision.</p></aside>
      <section className="matching-results"><div className="matching-heading"><div><p className="eyebrow">2 · EXAMINER ET DÉCIDER</p><h2>Suggestions et candidatures</h2></div>{suggestions.length > 0 && <span>{suggestions.length} proposition{suggestions.length > 1 ? 's' : ''}</span>}</div>{error && <div className="matching-error" role="alert"><Icon name="help" /><div><strong>Le copilote n’a pas répondu</strong><p>{error}</p></div></div>}{loading && <div className="matching-progress" role="status"><div><Icon name="sparkles" size={18} /><strong>Le copilote analyse les profils consentants…</strong><small>moins de 10 secondes</small></div><ProgressBar label="Analyse en cours" /></div>}{!loading && !suggestions.length && !error && <div className="matching-empty"><span><Icon name="sparkles" size={30} /></span><h3>Une possibilité peut se cacher ici</h3><p>Choisissez un événement puis lancez l’analyse. Les suggestions devront être vérifiées par l’équipe.</p></div>}<div className="match-list">{suggestions.map(match => residentById[match.resident_id] && <SuggestionCard key={match.id} match={match} resident={residentById[match.resident_id]} event={selected} onStatus={updateMatchStatus} />)}</div></section></div>
  </>;
}
