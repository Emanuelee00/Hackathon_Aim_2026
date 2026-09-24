import Icon from './Icon.jsx';
import { useStore } from '../../app/store.jsx';

export const navigation = [
  { id: 'dashboard', label: 'Vue d’ensemble', icon: 'dashboard' },
  { id: 'requests', label: 'Les demandes', icon: 'inbox' },
  { id: 'opportunities', label: 'Opportunités & parcours', icon: 'sparkles' },
  { id: 'journeys', label: 'Suivi des parcours', icon: 'leaf' },
  { id: 'calendar', label: 'Le calendrier', icon: 'calendar' },
  { id: 'spaces', label: 'Nos espaces', icon: 'space' },
  { id: 'reports', label: 'Bilans & impact', icon: 'heart' },
];

export default function Sidebar({ page, navigate, mobile, close, help }) {
  const { events } = useStore();
  const pending = events.filter(event => event.status === 'pending').length;
  return <>
    {mobile && <button className="nav-scrim" aria-label="Fermer le menu" onClick={close} />}
    <aside className={`sidebar ${mobile ? 'is-open' : ''}`}>
      <a href="#dashboard" className="brand" onClick={close}><img src="/favicon.svg" alt="" /><span>marthe<span className="brand-dot">.</span></span></a>
      <p className="brand-caption">Le compagnon des lieux vivants</p>
      <div className="place-switch"><span className="place-mark"><Icon name="space" /></span><div><strong>Chez Marthe</strong><small>Marseille · La Plaine</small></div><span className="live-dot" /></div>
      <p className="nav-caption">VOTRE QUOTIDIEN</p>
      <nav aria-label="Navigation principale">{navigation.map(item => <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} aria-current={page === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}><Icon name={item.icon} /><span>{item.label}</span>{item.id === 'requests' && pending > 0 && <b className="nav-count">{pending}</b>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><span className="sun-mark">✳</span><p>Chaque rencontre<br />ouvre des possibles.</p><small>Et si on les faisait grandir ?</small></div>
        <button className="nav-item help-link" onClick={help}><Icon name="help" />À propos de cette démo</button>
        <div className="profile"><span className="avatar">CM</span><div><strong>L’équipe Chez Marthe</strong><small>Espace coordination</small></div><span className="live-dot" /></div>
      </div>
    </aside>
  </>;
}
