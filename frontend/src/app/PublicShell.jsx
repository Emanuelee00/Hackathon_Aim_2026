import { Brand } from '../features/public/landing/shell/Brand.jsx';
import { AccountMenu } from '../features/auth/AuthGate.jsx';
import { useStore } from './store.jsx';
import { SHOW_DEMO_DATA } from '../shared/lib/demo.js';

// Shell of the audience subdomains; the account menu shows when the space is behind an AuthGate.
// mainClassName: the resident space keeps its own layout (no `public-space` grid).
export default function PublicShell({ children, mainClassName = 'public-space' }) {
  // The bilan page has no store: it only sends one form.
  const { storageError, toast } = useStore() || {};
  return <div className="resident-app">
    <header className="resident-topbar"><Brand /><div className="header-actions">{SHOW_DEMO_DATA && <span className="demo-label"><span />Données de démonstration</span>}<AccountMenu /></div></header>
    <main className={mainClassName}>{children}</main>
    {storageError && <p role="alert" className="notice">{storageError}</p>}
    {toast && <p role="status" className="notice">{toast}</p>}
  </div>;
}
