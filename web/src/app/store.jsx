import { createContext, useContext, useEffect, useState } from 'react';
import { initialEvents } from '../shared/data/events.js';
import { spaceById, statuses } from '../shared/data/spaces.js';
import { demoMatches } from '../features/resident/demo.js';

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
    if (Array.isArray(saved)) return [...saved, ...demoMatches.filter(demo => !saved.some(match => match.eventId === demo.eventId && match.resident_id === demo.resident_id))];
  } catch { /* Start without matching history when storage is unavailable. */ }
  return demoMatches;
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
  const saveJourney = (id, journey) => setMatches(current => current.map(match => match.id === id ? { ...match, journey } : match));
  return <Store.Provider value={{ events, saveEvent, matches, replaceSuggestions, addResidentMatches, updateMatchStatus, saveJourney, toast, notify: setToast, storageError }}>{children}</Store.Provider>;
}

export const useStore = () => useContext(Store);
