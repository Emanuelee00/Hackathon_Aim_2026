import { errorMessage } from '../../features/auth/api.js';

// The public pages (landing request, bilan) never read the shared store: they only add to it.
const offline = 'Le serveur est injoignable : votre envoi n’a pas été enregistré. Réessayez dans un instant.';

async function call(path, body) {
  const options = body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {};
  const response = await fetch(path, options).catch(() => null);
  if (!response) throw new Error(offline);
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.json();
}

// Resolves to { id }: the server gives the reference and puts the request in the team's queue.
export const submitRequest = request => call('/api/requests', request);
// Past events an organiser can review, without contacts or other answers.
export const fetchFeedbackEvents = () => call('/api/feedback/events');
export const submitFeedback = (eventId, feedback) => call(`/api/feedback/${encodeURIComponent(eventId)}`, feedback);
