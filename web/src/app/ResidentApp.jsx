import ResidentSpace from '../features/resident/ResidentSpace.jsx';
import { Brand } from '../features/landing/Landing.jsx';
import { AccountMenu } from '../features/auth/AuthGate.jsx';
import { useStore } from './store.jsx';

export default function ResidentApp() {
  const { storageError, toast } = useStore();
  return <div className="resident-app">
    <header className="resident-topbar"><Brand /><div className="header-actions"><span className="demo-label"><span />Données de démonstration</span><AccountMenu /></div></header>
    <main><ResidentSpace /></main>
    {storageError && <p role="alert" className="notice">{storageError}</p>}
    {toast && <p role="status" className="notice">{toast}</p>}
  </div>;
}
