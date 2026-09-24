import { Brand } from '../features/landing/Landing.jsx';
import { AccountMenu } from '../features/auth/AuthGate.jsx';
import { useStore } from './store.jsx';

// Shell of the audience subdomains; the account menu shows when the space is behind an AuthGate.
export default function PublicShell({ children }) {
  // The bilan page has no store: it only sends one form.
  const { storageError, toast } = useStore() || {};
  return <div className="resident-app">
    <header className="resident-topbar"><Brand /><div className="header-actions"><span className="demo-label"><span />Données de démonstration</span><AccountMenu /></div></header>
    <main className="public-space">{children}</main>
    {storageError && <p role="alert" className="notice">{storageError}</p>}
    {toast && <p role="status" className="notice">{toast}</p>}
  </div>;
}
