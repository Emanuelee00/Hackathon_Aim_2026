import Icon from './Icon.jsx';
import { navigation } from './Sidebar.jsx';
import { AccountMenu } from '../../features/auth/AuthGate.jsx';

export default function Header({ page, onMenu, expanded, onNew }) {
  return <header className="topbar">
    <div className="breadcrumbs"><button type="button" className="icon-button menu-toggle" aria-label={expanded ? 'Masquer le menu' : 'Afficher le menu'} title={expanded ? 'Masquer le menu' : 'Afficher le menu'} aria-expanded={expanded} aria-controls="sidebar" onClick={onMenu}><Icon name="menu" /></button><span>Chez Marthe</span><span className="breadcrumb-slash">/</span><strong>{navigation.find(item => item.id === page)?.label}</strong></div>
    <div className="header-actions"><AccountMenu />{page !== 'requests' && <button className="button button-dark button-small" onClick={onNew}><Icon name="plus" size={16} /><span>Nouvelle demande</span></button>}</div>
  </header>;
}
