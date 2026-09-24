import Icon from './Icon.jsx';
import { navigation } from './Sidebar.jsx';

export default function Header({ page, onMenu, onNew }) {
  return <header className="topbar">
    <div className="breadcrumbs"><button className="icon-button mobile-menu" aria-label="Ouvrir le menu" onClick={onMenu}><Icon name="menu" /></button><span>Chez Marthe</span><span className="breadcrumb-slash">/</span><strong>{page === 'resident' ? 'Vue résidente' : navigation.find(item => item.id === page)?.label}</strong></div>
    <div className="header-actions"><span className="demo-label"><span />Données de démonstration</span><button className="button button-dark button-small" onClick={onNew}><Icon name="plus" size={16} /><span>Nouvelle demande</span></button></div>
  </header>;
}
