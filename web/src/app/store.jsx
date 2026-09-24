import { cancelVisit } from '../features/requests/visits.js';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { initialEvents } from '../shared/data/events.js';
import { spaceById, statuses } from '../shared/data/spaces.js';
import { sites } from '../shared/data/sites.js';
import { demoMatches } from '../features/resident/demo.js';

const Store = createContext(null);

// Shared through the backend: every subdomain (équipe, résidentes) sees the same data.
async function fetchStored(key) {
  const response = await fetch(`/api/store/${key}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(key);
  return (await response.json()).value;
}

function validEvents(saved) {
  return Array.isArray(saved) && saved.every(event => event.id && typeof event.title === 'string' && spaceById[event.space] && statuses[event.status] && Array.isArray(event.tasks)) ? saved : initialEvents;
}

function withDemoMatches(saved) {
  if (!Array.isArray(saved)) return demoMatches;
  return [...saved, ...demoMatches.filter(demo => !saved.some(match => match.eventId === demo.eventId && match.resident_id === demo.resident_id))];
}

function validVisitSlots(saved) {
  return Array.isArray(saved) && saved.every(slot => slot.id && typeof slot.guide === 'string' && slot.date && slot.start && slot.end && sites.some(site => site.id === slot.site)) ? saved : [];
}

// Saves only what changed since the last load or save, so reloading never writes back.
function useSync(key, value, ready, synced, onError) {
  useEffect(() => {
    const body = JSON.stringify(value);
    if (!ready || synced.current[key] === body) return;
    synced.current[key] = body;
    fetch(`/api/store/${key}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body })
      .then(response => { if (!response.ok) throw new Error(key); })
      .catch(onError);
  }, [key, value, ready]);
}

export function StoreProvider({ children }) {
  const [events, setEvents] = useState(initialEvents);
  const [matches, setMatches] = useState(demoMatches);
  const [partners, setPartners] = useState([]);
  const [visitSlots, saveVisitSlots] = useState([]);
  // Each person's own laughs: the server only returns and keeps the signed-in account's.
  const [laughs, setLaughs] = useState([]);
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
  const [status, setStatus] = useState('loading');
  const [storageError, setStorageError] = useState('');
  const [toast, setToast] = useState('');
  const synced = useRef({});
  useEffect(() => {
    const load = () => Promise.all([fetchStored('events'), fetchStored('matches'), fetchStored('partners'), fetchStored('visitSlots'), fetchStored('laughs')]).then(([savedEvents, savedMatches, savedPartners, savedVisitSlots, savedLaughs]) => {
      const nextEvents = validEvents(savedEvents);
      const nextMatches = withDemoMatches(savedMatches);
      const nextVisitSlots = validVisitSlots(savedVisitSlots);
      if (savedEvents) synced.current.events = JSON.stringify(nextEvents);
      if (savedMatches) synced.current.matches = JSON.stringify(nextMatches);
      if (savedPartners) synced.current.partners = JSON.stringify(savedPartners);
      if (savedVisitSlots) synced.current.visitSlots = JSON.stringify(nextVisitSlots);
      if (savedLaughs) synced.current.laughs = JSON.stringify(savedLaughs);
      setPartners(savedPartners || []);
      setLaughs(savedLaughs || []);
      setEvents(nextEvents); setMatches(nextMatches); saveVisitSlots(nextVisitSlots); setStorageError(''); setStatus('ready');
    }).catch(() => {
      setStorageError('Le serveur est injoignable : vos modifications ne seront pas enregistrées.');
      setStatus(current => current === 'loading' ? 'offline' : current);
    });
    load();
    // Picks up what was changed on another subdomain when coming back to this tab.
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, []);
  const saveFailed = () => setStorageError('La sauvegarde est indisponible : gardez cette page ouverte et exportez vos fiches.');
  useSync('events', events, status === 'ready', synced, saveFailed);
  useSync('matches', matches, status === 'ready', synced, saveFailed);
  useSync('partners', partners, status === 'ready', synced, saveFailed);
  useSync('visitSlots', visitSlots, status === 'ready', synced, saveFailed);
  useSync('laughs', laughs, status === 'ready', synced, saveFailed);
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
  const addLaugh = date => setLaughs(current => [...current, { id: crypto.randomUUID(), date }]);
  const removeLastLaugh = () => setLaughs(current => current.slice(0, -1));
  const saveJourney = (id, journey) => setMatches(current => current.map(match => match.id === id ? { ...match, journey } : match));
  if (status === 'loading') return null;
  return <Store.Provider value={{ events, saveEvent, partners, savePartner, visitSlots, saveVisitSlots, matches, replaceSuggestions, laughs, addLaugh, removeLastLaugh, addResidentMatches, updateMatchStatus, saveJourney, siteId, setSiteId, toast, notify: setToast, storageError }}>{children}</Store.Provider>;
}

export const useStore = () => useContext(Store);
