import { cancelVisit } from '../features/requests/visits.js';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { initialEvents } from '../shared/data/events.js';
import { spaceById, statuses } from '../shared/data/spaces.js';
import { sites } from '../shared/data/sites.js';
import { demoMatches } from '../features/resident/demo.js';
import { SHOW_DEMO_DATA } from '../shared/lib/demo.js';

const Store = createContext(null);

// Shared through the backend: every subdomain (équipe, résidentes) sees the same data.
async function fetchStored(key) {
  const response = await fetch(`/api/store/${key}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(key);
  return (await response.json()).value;
}

function validEvents(saved) {
  return Array.isArray(saved) && saved.every(event => event.id && typeof event.title === 'string' && spaceById[event.space] && statuses[event.status] && Array.isArray(event.tasks)) ? saved : SHOW_DEMO_DATA ? initialEvents : [];
}

function withDemoMatches(saved) {
  if (!Array.isArray(saved)) return SHOW_DEMO_DATA ? demoMatches : [];
  if (!SHOW_DEMO_DATA) return saved;
  return [...saved, ...demoMatches.filter(demo => !saved.some(match => match.eventId === demo.eventId && match.resident_id === demo.resident_id))];
}

function validVisitSlots(saved) {
  return Array.isArray(saved) && saved.every(slot => slot.id && typeof slot.guide === 'string' && slot.date && slot.start && slot.end && sites.some(site => site.id === slot.site)) ? saved : [];
}

// Saves only what changed since the last load or save, so reloading never writes back.
function useSync(key, value, ready, synced, onError) {
  useEffect(() => {
    const body = JSON.stringify(value);
    if (!ready || synced.current === body) return;
    synced.current = body;
    fetch(`/api/store/${key}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body })
      .then(response => { if (!response.ok) throw new Error(key); })
      .catch(onError);
  }, [key, value, ready]);
}

// One server-backed piece of state: validate what the server returns, keep the
// saved copy aside so unchanged data is never written back, and expose adopt()
// for the provider's load effect. Every store key uses exactly this.
function useStored(key, fallback, validate, ready, onError) {
  const [value, setValue] = useState(fallback);
  const synced = useRef('');
  useSync(key, value, ready, synced, onError);
  const adopt = saved => {
    const next = validate(saved);
    if (saved != null) synced.current = JSON.stringify(next);
    setValue(next);
  };
  return [value, setValue, adopt];
}

export function StoreProvider({ children }) {
  const [status, setStatus] = useState('loading');
  const [storageError, setStorageError] = useState('');
  const [toast, setToast] = useState('');
  const ready = status === 'ready';
  const saveFailed = () => setStorageError('La sauvegarde est indisponible : gardez cette page ouverte et exportez vos fiches.');
  const [events, setEvents, adoptEvents] = useStored('events', SHOW_DEMO_DATA ? initialEvents : [], validEvents, ready, saveFailed);
  const [matches, setMatches, adoptMatches] = useStored('matches', SHOW_DEMO_DATA ? demoMatches : [], withDemoMatches, ready, saveFailed);
  const [partners, setPartners, adoptPartners] = useStored('partners', [], saved => saved ?? [], ready, saveFailed);
  const [visitSlots, saveVisitSlots, adoptVisitSlots] = useStored('visitSlots', [], validVisitSlots, ready, saveFailed);
  const [laughs, setLaughs, adoptLaughs] = useStored('laughs', [], saved => saved ?? [], ready, saveFailed);
  // The team's funding tracker; the other spaces always receive an empty list.
  const [funders, setFunders, adoptFunders] = useStored('funders', [], saved => (Array.isArray(saved) ? saved : []), ready, saveFailed);
  const [siteId, setSiteId] = useState(() => {
    try {
      const saved = localStorage.getItem('marthe-site-v1');
      if (sites.some(site => site.id === saved)) return saved;
    } catch { /* Use the main site when storage is unavailable. */ }
    return sites.find(site => site.real)?.id ?? sites[0].id;
  });
  useEffect(() => {
    try { localStorage.setItem('marthe-site-v1', siteId); }
    catch { /* The site selection remains available for this session. */ }
  }, [siteId]);
  useEffect(() => {
    const load = () => Promise.all([fetchStored('events'), fetchStored('matches'), fetchStored('partners'), fetchStored('visitSlots'), fetchStored('laughs'), fetchStored('funders')]).then(([savedEvents, savedMatches, savedPartners, savedVisitSlots, savedLaughs, savedFunders]) => {
      adoptEvents(savedEvents);
      adoptMatches(savedMatches);
      adoptPartners(savedPartners);
      adoptVisitSlots(savedVisitSlots);
      adoptLaughs(savedLaughs);
      adoptFunders(savedFunders);
      setStorageError(''); setStatus('ready');
    }).catch(() => {
      setStorageError('Le serveur est injoignable : vos modifications ne seront pas enregistrées.');
      setStatus(current => current === 'loading' ? 'offline' : current);
    });
    load();
    // Picks up what was changed on another subdomain when coming back to this tab.
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, []);
  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(''), 4500); return () => clearTimeout(timer); } }, [toast]);
  function saveEvent(event) {
    if (event.status === 'cancelled') saveVisitSlots(current => current.reduce((slots, slot) => slot.booking?.eventId === event.id && !slot.outcome ? cancelVisit(slots, slot.id, 'Demande refusée ou annulée') : slots, current));
    setEvents(current => current.some(item => item.id === event.id) ? current.map(item => item.id === event.id ? event : item) : [...current, event]);
  }
  function replaceSuggestions(eventId, suggestions) {
    setMatches(current => {
      const preserved = current.filter(match => match.eventId !== eventId || !['suggested', 'dismissed'].includes(match.status));
      const decided = new Set(preserved.filter(match => match.eventId === eventId).map(match => match.resident_id));
      const fresh = suggestions.filter(match => !decided.has(match.resident_id)).map(match => ({ ...match, id: `${eventId}-${match.resident_id}`, eventId, status: 'suggested' }));
      return [...preserved, ...fresh];
    });
  }
  // Adds CV-based proposals or activities a resident chose; an existing proposal only gets the CV link.
  function addResidentMatches(residentId, items) {
    setMatches(current => items.reduce((list, item) => {
      const id = `${item.eventId}-${residentId}`;
      const existing = list.find(match => match.id === id);
      if (!existing) return [...list, { ...item, id, resident_id: residentId }];
      if (['suggested', 'dismissed'].includes(existing.status)) return list.map(match => match.id === id ? { ...match, ...item } : match);
      return list.map(match => match.id === id ? { ...match, cv: match.cv || item.source === 'cv' } : match);
    }, current));
  }
  const updateMatchStatus = (id, status) => setMatches(current => current.map(match => match.id === id ? { ...match, status } : match));
  // Hosted associations: agenda sync and onboarding steps, one entry per association.
  const savePartner = partner => setPartners(current => [...current.filter(item => item.id !== partner.id), partner]);
  const saveFunder = funder => setFunders(current => current.some(item => item.id === funder.id) ? current.map(item => item.id === funder.id ? funder : item) : [...current, funder]);
  const removeFunder = id => setFunders(current => current.filter(funder => funder.id !== id));
  // Each person's own laughs: the server only returns and keeps the signed-in account's.
  const addLaugh = date => setLaughs(current => [...current, { id: crypto.randomUUID(), date }]);
  const removeLastLaugh = () => setLaughs(current => current.slice(0, -1));
  const saveJourney = (id, journey) => setMatches(current => current.map(match => match.id === id ? { ...match, journey } : match));
  if (status === 'loading') return null;
  return <Store.Provider value={{ events, saveEvent, partners, savePartner, visitSlots, saveVisitSlots, matches, replaceSuggestions, laughs, addLaugh, removeLastLaugh, addResidentMatches, updateMatchStatus, saveJourney, funders, saveFunder, removeFunder, replaceFunders: setFunders, siteId, setSiteId, toast, notify: setToast, storageError }}>{children}</Store.Provider>;
}

export const useStore = () => useContext(Store);
