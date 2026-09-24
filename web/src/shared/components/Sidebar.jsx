import { useState } from 'react';
import Icon from './Icon.jsx';
import { useStore } from '../../app/store.jsx';
import { sites } from '../data/sites.js';
import { spaceUrl } from '../lib/spaces.js';

export const navigation = [
  { id: 'dashboard', label: 'Vue d’ensemble', icon: 'dashboard' },
  { id: 'requests', label: 'Les demandes', icon: 'inbox' },
  { id: 'questions', label: 'Questions reçues', icon: 'chat' },
  { id: 'access', label: 'Demandes d’accès', icon: 'users' },
  { id: 'committee', label: 'Comité du vendredi', icon: 'checks' },
  { id: 'opportunities', label: 'Opportunités & parcours', icon: 'sparkles' },
  { id: 'residents', label: 'Nos résidentes', icon: 'users' },
  { id: 'journeys', label: 'Suivi des parcours', icon: 'leaf' },
  { id: 'calendar', label: 'Le calendrier', icon: 'calendar' },
  { id: 'spaces', label: 'Nos espaces', icon: 'space' },
  { id: 'reports', label: 'Bilans & impact', icon: 'heart' },
  { id: 'stats', label: 'Statistiques & conseils', icon: 'dashboard' },
];

export default function Sidebar({ page, navigate, mobile, close, help, newQuestions, accessRequests }) {
  const { events, siteId, setSiteId } = useStore();
  const pending = events.filter(event => event.status === 'pending').length;
  const [siteMenuOpen, setSiteMenuOpen] = useState(false);
  const site = sites.find(candidate => candidate.id === siteId) ?? sites[0];
  return <>
    {mobile && <button className="nav-scrim" aria-label="Fermer le menu" onClick={close} />}
    <aside className={`sidebar ${mobile ? 'is-open' : ''}`}>
      <a href="#dashboard" className="brand" onClick={close}><img src="/logo-chez-marthe.png" alt="Chez Marthe" /></a>
      <p className="brand-caption">Le compagnon des lieux vivants</p>
      <div className="place-switch-wrap" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setSiteMenuOpen(false); }} onKeyDown={event => { if (event.key === 'Escape') { setSiteMenuOpen(false); event.currentTarget.querySelector('.place-switch').focus(); } }}>
        <button type="button" className="place-switch" aria-label={`Changer de siège : ${site.city}`} aria-controls="site-options" aria-expanded={siteMenuOpen} onClick={() => setSiteMenuOpen(open => !open)}>
          <span className="place-mark"><Icon name="space" /></span><div><strong>Chez Marthe</strong><small>{site.city} · {site.neighborhood}</small><small>Changer de siège</small></div><Icon name={siteMenuOpen ? 'left' : 'right'} size={14} />
        </button>
        {siteMenuOpen && <ul id="site-options" className="place-menu" aria-label="Choisir un siège">{sites.map(candidate => <li key={candidate.id}><button type="button" aria-pressed={candidate.id === siteId} className={candidate.id === siteId ? 'active' : ''} onClick={() => { setSiteId(candidate.id); setSiteMenuOpen(false); navigate('spaces'); }}>{candidate.city}{!candidate.real && <small>exemple</small>}</button></li>)}</ul>}
      </div>
      <p className="nav-caption">VOTRE QUOTIDIEN</p>
      <nav aria-label="Navigation principale">{navigation.map(item => <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} aria-current={page === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}><Icon name={item.icon} /><span>{item.label}</span>{item.id === 'requests' && pending > 0 && <b className="nav-count">{pending}</b>}{item.id === 'questions' && newQuestions > 0 && <b className="nav-count">{newQuestions}</b>}{item.id === 'access' && accessRequests > 0 && <b className="nav-count">{accessRequests}</b>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><span className="sun-mark">✳</span><p>Chaque rencontre<br />ouvre des possibles.</p><small>Et si on les faisait grandir ?</small></div>
        <a className="nav-item help-link" href={spaceUrl('residents')}><Icon name="users" />Vue résidente (démo)</a>
        <button className="nav-item help-link" onClick={help}><Icon name="help" />À propos de cette démo</button>
        <div className="profile"><span className="avatar">CM</span><div><strong>L’équipe Chez Marthe</strong><small>Espace coordination</small></div><span className="live-dot" /></div>
      </div>
    </aside>
  </>;
}
