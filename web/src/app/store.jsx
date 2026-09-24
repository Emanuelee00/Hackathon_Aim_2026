import { createContext, useContext, useEffect, useState } from 'react';
import { initialEvents } from '../shared/data/events.js';
import { spaceById, statuses } from '../shared/data/spaces.js';

const Store = createContext(null);
const KEY = 'marthe-demo-v1';
const MATCH_KEY = 'marthe-match-history-v1';

function loadEvents() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(saved) && saved.every(event => event.id && typeof event.title === 'string' && spaceById[event.space] && statuses[event.status] && Array.isArray(event.tasks))) return saved;
  } catch { /* Start with the demonstration when storage is unavailable. */ }
  return initialEvents;
}

function loadMatches() {
  try {
    const saved = JSON.parse(localStorage.getItem(MATCH_KEY));
    if (Array.isArray(saved)) return saved;
  } catch { /* Start without matching history when storage is unavailable. */ }
  return [];
}

export function StoreProvider({ children }) {
  const [events, setEvents] = useState(loadEvents);
  const [matches, setMatches] = useState(loadMatches);
  const [storageError, setStorageError] = useState('');
  const [toast, setToast] = useState('');
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(events)); }
    catch { setStorageError('La sauvegarde est indisponible : gardez cette page ouverte et exportez vos fiches.'); }
  }, [events]);
  useEffect(() => {
    try { localStorage.setItem(MATCH_KEY, JSON.stringify(matches)); }
    catch { setStorageError('La sauvegarde des parcours est indisponible pour cette session.'); }
  }, [matches]);
  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(''), 4500); return () => clearTimeout(timer); } }, [toast]);
  function saveEvent(event) {
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
  const updateMatchStatus = (id, status) => setMatches(current => current.map(match => match.id === id ? { ...match, status } : match));
  const saveJourney = (id, journey) => setMatches(current => current.map(match => match.id === id ? { ...match, journey } : match));
  return <Store.Provider value={{ events, saveEvent, matches, replaceSuggestions, updateMatchStatus, saveJourney, toast, notify: setToast, storageError }}>{children}</Store.Provider>;
}

export const useStore = () => useContext(Store);
