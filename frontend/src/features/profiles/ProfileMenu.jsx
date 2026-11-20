import { useState } from 'react';
import Icon from '../../shared/components/Icon.jsx';
import { Avatar } from './ProfilePicker.jsx';
import { useProfile } from './ProfileProvider.jsx';
import { nextTheme } from './profiles.js';
import ProfileSettings from './ProfileSettings.jsx';

// En haut à droite : la personne, avec « Personnaliser mon espace » et « Changer de personne ».
export default function ProfileMenu() {
  const { profile, leave, update } = useProfile();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  if (!profile) return null;
  const theme = profile.theme || 'light';
  const switchTo = wanted => update({ ...profile, theme: nextTheme(theme, wanted) });
  return <div className="profile-tools">
    <button type="button" className="theme-button" aria-pressed={theme === 'dark'} title={theme === 'dark' ? 'Revenir au mode clair' : 'Mode sombre'} aria-label="Mode sombre" onClick={() => switchTo('dark')}><Icon name="sun" size={17} /></button>
    <button type="button" className="theme-button theme-button-m" aria-pressed={theme === 'violet'} title={theme === 'violet' ? 'Revenir au mode clair' : 'Mode violet Chez Marthe'} aria-label="Mode violet Chez Marthe" onClick={() => switchTo('violet')}>M</button>
  <div className="profile-menu" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button type="button" className="profile-menu-button" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(current => !current)}><Avatar profile={profile} size="small" /><strong>{profile.name}</strong><Icon name="down" size={14} /></button>
    {open && <div className="profile-menu-list" role="menu">
      <button type="button" role="menuitem" onClick={() => { setOpen(false); setSettings(true); }}><Icon name="palette" size={16} />Personnaliser mon espace</button>
      <button type="button" role="menuitem" onClick={() => { setOpen(false); leave(); }}><Icon name="users" size={16} />Changer de personne</button>
    </div>}
    {settings && <ProfileSettings onClose={() => setSettings(false)} />}
  </div></div>;
}
