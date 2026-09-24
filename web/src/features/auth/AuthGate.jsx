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

export function AccountMenu() {
  const { user, logout } = useContext(Auth);
  return <span className="account-menu"><span>{user.name}</span><button className="text-link" onClick={logout}>Se déconnecter</button></span>;
}
