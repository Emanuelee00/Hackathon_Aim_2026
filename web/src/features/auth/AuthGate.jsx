import { createContext, useContext, useEffect, useState } from 'react';
import { fetchMe, signOut } from './api.js';
import SignIn from './SignIn.jsx';

const Auth = createContext(null);

// Shows the sign-in page until someone with the role of this space is signed in.
export default function AuthGate({ spaceId, children }) {
  const [user, setUser] = useState(undefined);
  const [error, setError] = useState('');
  useEffect(() => {
    fetchMe().then(setUser).catch(failure => { setError(failure.message); setUser(null); });
  }, []);
  const logout = () => signOut().catch(() => {}).then(() => setUser(null));

  if (user === undefined) return null;
  if (!user || user.role !== spaceId) return <>
    <SignIn spaceId={spaceId} onSignedIn={setUser} />
    {error && <p role="alert" className="notice">{error}</p>}
  </>;
  return <Auth.Provider value={{ user, logout }}>{children}</Auth.Provider>;
}

// The signed-in user, or null outside an AuthGate.
export const useAuth = () => useContext(Auth);

export function AccountMenu() {
  const auth = useAuth();
  if (!auth) return null;
  return <span className="account-menu"><strong>{auth.user.name}</strong><button className="text-link" onClick={auth.logout}>Se déconnecter</button></span>;
}
