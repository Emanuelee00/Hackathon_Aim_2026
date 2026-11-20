import { useCallback, useEffect, useState } from 'react';
import { errorMessage } from '../auth/api.js';

// Questions the chatbot agents handed off; only a signed-in team account can read them.
export default function useQuestions() {
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const load = useCallback(() => fetch('/api/questions')
    .then(async response => { if (!response.ok) throw new Error(await errorMessage(response)); return response.json(); })
    .then(list => { setQuestions(list); setError(''); })
    .catch(failure => setError(failure.message)), []);
  useEffect(() => {
    load();
    // New questions arrive from the public site: refresh when coming back to the tab.
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, [load]);
  const setStatus = (id, status) => fetch(`/api/questions/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    .then(async response => { if (!response.ok) throw new Error(await errorMessage(response)); return response.json(); })
    .then(saved => setQuestions(current => current.map(question => question.id === saved.id ? saved : question)))
    .catch(failure => setError(failure.message));
  return { questions, error, setStatus };
}
