import { useCallback, useEffect, useState } from 'react';
import { errorMessage } from '../auth/api.js';

async function call(path, options) {
  const response = await fetch(`/api/auth/requests${path}`, options);
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.status === 204 ? null : response.json();
}

// Resident and association sign-ups waiting for a team member to open their access.
export default function useAccessRequests() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const load = useCallback(() => call('').then(list => { setRequests(list); setError(''); }).catch(failure => setError(failure.message)), []);
  useEffect(() => {
    load();
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, [load]);
  const decide = (id, approve) => (approve ? call(`/${id}/approve`, { method: 'POST' }) : call(`/${id}`, { method: 'DELETE' }))
    .then(() => setRequests(current => current.filter(request => request.id !== id)))
    .catch(failure => setError(failure.message));
  return { requests, error, decide };
}
