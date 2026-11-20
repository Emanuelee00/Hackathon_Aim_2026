import { useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { useStore } from '../../app/store.jsx';
import { sites } from '../data/sites.js';
import { navigation } from '../data/navigation.js';
import { spaceUrl } from '../lib/spaces.js';
import { useProfile } from '../../features/equipe/profiles/ProfileProvider.jsx';
import { isLight, menuStyle, orderedNavigation, toggleStar } from '../../features/equipe/profiles/profiles.js';
import usePointerSort from '../lib/usePointerSort.js';
import { moveTo } from '../../features/equipe/site/rentalCards.js';

export default function Sidebar({ page, navigate, mobile, close, onCollapse, expanded, help, newQuestions, accessRequests }) {
  const { events, siteId, setSiteId } = useStore();
  const pending = events.filter(event => event.status === 'pending').length;
  const [siteMenuOpen, setSiteMenuOpen] = useState(false);
  const site = sites.find(candidate => candidate.id === siteId) ?? sites[0];
  // Le menu de la personne : son ordre, ses rubriques mises en avant (★), son fond. « Ranger mon menu » : glisser-déposer.
  const { profile, update } = useProfile() || {};
  const [editing, setEditing] = useState(false);
  const items = orderedNavigation(navigation, profile);
  const starred = profile?.starred || [];
  const aside = useRef(null);
  const sort = usePointerSort((from, to) => update({ ...profile, menuOrder: moveTo(items, from, to).map(item => item.id) }), aside);
  const background = profile?.menuBackground;
  const light = background?.kind === 'color' && isLight(background.value);
  return <>
    {mobile && <button className="nav-scrim" aria-label="Fermer le menu" onClick={close} />}
    <aside ref={aside} id="sidebar" className={`sidebar ${mobile ? 'is-open' : ''}${light ? ' is-light-menu' : ''}`} style={menuStyle(background)}>
      <a href="#dashboard" className="brand" onClick={close}><img src="/logo-chez-marthe.png" alt="Chez Marthe" /></a>
      <p className="brand-caption">Le compagnon des lieux vivants</p>
      <div className="place-switch-wrap" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setSiteMenuOpen(false); }} onKeyDown={event => { if (event.key === 'Escape') { setSiteMenuOpen(false); event.currentTarget.querySelector('.place-switch').focus(); } }}>
        <button type="button" className="place-switch" aria-label={`Changer de siège : ${site.city}`} aria-controls="site-options" aria-expanded={siteMenuOpen} onClick={() => setSiteMenuOpen(open => !open)}>
          <span className="place-mark"><Icon name="space" /></span><div><strong>Chez Marthe</strong><small>{site.city} · {site.neighborhood}</small><small>Changer de siège</small></div><Icon name={siteMenuOpen ? 'left' : 'right'} size={14} />
        </button>
        {siteMenuOpen && <ul id="site-options" className="place-menu" aria-label="Choisir un siège">{sites.map(candidate => <li key={candidate.id}><button type="button" aria-pressed={candidate.id === siteId} className={candidate.id === siteId ? 'active' : ''} onClick={() => { setSiteId(candidate.id); setSiteMenuOpen(false); navigate('spaces'); }}>{candidate.city}{!candidate.real && <small>exemple</small>}</button></li>)}</ul>}
      </div>
      <div className="nav-caption-row"><p className="nav-caption">{profile ? `LE MENU DE ${profile.name.toUpperCase()}` : 'VOTRE QUOTIDIEN'}</p>
        {profile && <button type="button" className="nav-arrange" aria-pressed={editing} onClick={() => setEditing(current => !current)}>{editing ? 'Terminé' : 'Ranger mon menu'}</button>}</div>
      {editing && <p className="nav-edit-hint">Attrapez une rubrique et déplacez-la : les autres se poussent pour lui faire de la place. ⇡ la met tout en haut, ★ la met en avant.{profile.menuOrder.length > 0 && <> <button type="button" className="nav-reset" onClick={() => update({ ...profile, menuOrder: [] })}>Ordre d’origine</button></>}</p>}
      <nav aria-label="Navigation principale" className={editing ? `nav-editing${sort.dragging ? ' is-sorting' : ''}` : undefined}>{items.map((item, index) => editing
        ? <div key={item.id} className={`nav-item nav-edit-row${starred.includes(item.id) ? ' is-starred' : ''}`} title="Attrapez la rubrique et déplacez-la" {...sort.row(index)}>
          <span className="nav-grip" aria-hidden="true"><Icon name="grip" size={16} /></span><Icon name={item.icon} /><span>{item.label}</span>
          <button type="button" className="nav-top" disabled={index === 0} aria-label={`Mettre « ${item.label} » tout en haut`} title="Mettre tout en haut" onClick={() => update({ ...profile, menuOrder: moveTo(items, index, 0).map(entry => entry.id) })}>⇡</button>
          <button type="button" className="nav-star" aria-pressed={starred.includes(item.id)} aria-label={`${starred.includes(item.id) ? 'Ne plus mettre en avant' : 'Mettre en avant'} « ${item.label} »`} onClick={() => update(toggleStar(profile, item.id))}>{starred.includes(item.id) ? '★' : '☆'}</button>
        </div>
        : <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}${starred.includes(item.id) ? ' is-starred' : ''}`} aria-current={page === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}><Icon name={item.icon} /><span>{item.label}</span>{item.id === 'requests' && pending > 0 && <b className="nav-count">{pending}</b>}{item.id === 'questions' && newQuestions > 0 && <b className="nav-count">{newQuestions}</b>}{item.id === 'access' && accessRequests > 0 && <b className="nav-count">{accessRequests}</b>}{starred.includes(item.id) && <i className="nav-star-mark" aria-label="mise en avant">★</i>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><span className="sun-mark">✳</span><p>Chaque rencontre<br />ouvre des possibles.</p><small>Et si on les faisait grandir ?</small></div>
        <a className="nav-item help-link" href={spaceUrl('residents')}><Icon name="users" />Vue résidente (démo)</a>
        <button className="nav-item help-link" onClick={help}><Icon name="help" />À propos de cette démo</button>
        <div className="profile"><span className="avatar">{profile?.photo ? <img src={profile.photo} alt="" /> : 'CM'}</span><div><strong>{profile ? profile.name : 'L’équipe Chez Marthe'}</strong><small>{profile?.role || 'Espace coordination'}</small></div><span className="live-dot" /></div>
      </div>
    </aside>
    <button type="button" className="sidebar-handle" aria-controls="sidebar" aria-expanded={expanded} aria-label={expanded ? 'Masquer le menu' : 'Afficher le menu'} title={expanded ? 'Masquer le menu' : 'Afficher le menu'} onClick={onCollapse}><Icon name={expanded ? 'left' : 'right'} size={18} /></button>
  </>;
}
