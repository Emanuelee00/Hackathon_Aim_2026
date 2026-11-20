// Accounts live in the backend; the session is an httpOnly cookie set by /api/auth.
const offline = 'Le serveur est injoignable. Réessayez dans un instant.';

async function post(path, body) {
  const response = await fetch(`/api/auth/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
  if (!response) throw new Error(offline);
  if (response.ok) return response.status === 204 ? null : response.json();
  throw new Error(await errorMessage(response));
}

// FastAPI sends { detail: "…" } for our errors and { detail: [...] } for invalid fields.
export async function errorMessage(response) {
  const detail = (await response.json().catch(() => ({}))).detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.some(error => error.loc?.includes('password'))) return 'Le mot de passe doit contenir au moins 8 caractères.';
  if (Array.isArray(detail) && detail.some(error => error.loc?.includes('email'))) return 'Cette adresse e-mail n’est pas valide.';
  return offline;
}

// Resolves to the signed-in user, or null when nobody is signed in on this subdomain.
export async function fetchMe() {
  const response = await fetch('/api/auth/me');
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(offline);
  return response.json();
}

export const signIn = (space, { email, password }) => post('login', { space, email, password });
export const signUp = (space, { name, email, password }) => post('register', { space, name, email, password });
export const signOut = () => post('logout', {});
