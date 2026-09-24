import { errorMessage } from '../auth/api.js';

// The backend accepts up to 30 turns: older ones are dropped, the page keeps them visible.
export const MAX_TURNS = 30;

export function toHistory(messages) {
  return messages.slice(-MAX_TURNS).map(({ role, content }) => ({ role, content }));
}

// Resolves to { reply, handoff }: handoff is the team reference when the question was passed on.
export async function askAgent(agentId, messages) {
  const response = await fetch(`/api/agents/${agentId}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: toHistory(messages) }) }).catch(() => null);
  if (!response) throw new Error('Le serveur est injoignable. Réessayez dans un instant.');
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.json();
}
