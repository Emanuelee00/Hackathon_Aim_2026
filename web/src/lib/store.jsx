import { createContext, useContext, useEffect, useState } from 'react';
import { initialEvents } from '../data/events.js';
import { spaceById, statuses } from '../data/spaces.js';

const Store = createContext(null);
const KEY = 'marthe-demo-v1';

function loadEvents() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(saved) && saved.every(event => event.id && typeof event.title === 'string' && spaceById[event.space] && statuses[event.status] && Array.isArray(event.tasks))) return saved;
  } catch { /* Start with the demonstration when storage is unavailable. */ }
  return initialEvents;
}

export function StoreProvider({ children }) {
  const [events, setEvents] = useState(loadEvents);
  const [storageError, setStorageError] = useState('');
  const [toast, setToast] = useState('');
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(events)); }
    catch { setStorageError('La sauvegarde est indisponible : gardez cette page ouverte et exportez vos fiches.'); }
  }, [events]);
  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(''), 4500); return () => clearTimeout(timer); } }, [toast]);
  function saveEvent(event) {
    setEvents(current => current.some(item => item.id === event.id) ? current.map(item => item.id === event.id ? event : item) : [...current, event]);
  }
  return <Store.Provider value={{ events, saveEvent, toast, notify: setToast, storageError }}>{children}</Store.Provider>;
}

export const useStore = () => useContext(Store);
