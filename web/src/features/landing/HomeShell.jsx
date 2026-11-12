import { useEffect, useRef, useState } from 'react';
import './home.css';

// Shared frame of the public site (home, Nos espaces, Notre équipe): violet bar with a pink wave,
// side menu, "Suivez-nous" footer. Everything is scoped under .cm-home.

export const LINKS = {
  donate: 'https://www.helloasso.com/associations/chez-marthe/formulaires/3',
  join: 'https://www.helloasso.com/associations/chez-marthe/adhesions/adhesion-chez-marthe',
  friends: 'https://chat.whatsapp.com/GCTH2IPPnraADelLbGxVzX?mode=gi_t',
};

export const socials = [
  { name: 'Instagram', className: 'ig', url: 'https://www.instagram.com/bienvenuechezmarthe/', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" /></svg> },
  { name: 'Facebook', className: 'fb', url: 'https://www.facebook.com/p/Bienvenue-Chez-Marthe-61589275254775/', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21z" /></svg> },
  { name: 'LinkedIn', className: 'li', url: 'https://www.linkedin.com/company/chezmarthe/', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.5 9h3v11h-3zM6 3.8a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6zM10 9h2.9v1.5c.4-.8 1.4-1.7 3-1.7 3.1 0 3.7 2 3.7 4.7V20h-3v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V20H10z" /></svg> },
  { name: 'YouTube', className: 'yt', url: 'https://www.youtube.com/@ChezMarthe-13', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3z" /></svg> },
  // TikTok: add it here once the account exists.
];

export function SocialLinks({ className }) {
  return <nav className={className} aria-label="Réseaux sociaux">
    {socials.map(s => <a key={s.name} className={s.className} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.name}>{s.icon}</a>)}
  </nav>;
}

const chevron = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>;

function MenuLink({ href, title, text, onPick }) {
  return <a className="menu-link" href={href} onClick={onPick}><span><strong>{title}</strong><small>{text}</small></span>{chevron}</a>;
}

// `home` is true on the home page: its sections are reached with #anchors, elsewhere with /#anchors.
export default function HomeShell({ home = false, children }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const at = home ? '' : '/';

  useEffect(() => {
    if (!open) return undefined;
    menuRef.current?.querySelector('a')?.focus({ preventScroll: true });
    const onKey = e => { if (e.key === 'Escape') { setOpen(false); buttonRef.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const close = () => setOpen(false);
  return <div className="cm-home">
    <header className={`bar${open ? ' menu-open' : ''}`}>
      {!home && <a className="home-button" href="/" aria-label="Retour à l’accueil" title="Retour à l’accueil">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 11.2 12 4l8.5 7.2" /><path d="M5.8 9.8V19a1.2 1.2 0 0 0 1.2 1.2h10a1.2 1.2 0 0 0 1.2-1.2V9.8" /><path d="M10 20.2v-5a2 2 0 0 1 4 0v5" /></svg>
        <span>Accueil</span>
      </a>}
      <a className="logo" href="/"><img src="/logo-chez-marthe.png" alt="Chez Marthe" /></a>
      <a className="login-button" href="/connexion" aria-label="Connexion à nos espaces">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
        <span>Connexion</span>
      </a>
      <button ref={buttonRef} className="menu-button" type="button" aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={open} aria-controls="menu" onClick={() => setOpen(!open)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path className="line l1" d="M4 7h16" /><path className="line l2" d="M4 12h16" /><path className="line l3" d="M4 17h16" /></svg>
      </button>
    </header>
    <div className={`scrim${open ? ' open' : ''}`} aria-hidden="true" onClick={close} />
    <nav id="menu" ref={menuRef} className={`menu${open ? ' open' : ''}`} aria-label="Menu">
      <div className="menu-scroll">
        <div className="menu-section">
          <p className="menu-group">Découvrir</p>
          <MenuLink href={`${at}#le-lieu`} title="Notre premier lieu" text="Chez Marthe, Saint-Savournin" onPick={close} />
          <MenuLink href="/equipe" title="Notre équipe" text="Les visages de Chez Marthe et notre manifeste" onPick={close} />
          <MenuLink href={`${at}#evenements`} title="Nos évènements" text="La programmation" onPick={close} />
          <MenuLink href="/on-parle-de-nous" title="On parle de nous" text="Articles de presse et reportages" onPick={close} />
        </div>
        <div className="menu-section">
          <p className="menu-group">Participer</p>
          <MenuLink href={`${at}#espaces`} title="Louer un espace" text="Chapelle, salon, atelier, bureau" onPick={close} />
          <MenuLink href={`${at}#partenaires`} title="Nos partenaires" text="Soutiens et partenaires" onPick={close} />
          <MenuLink href={`${at}#s-impliquer`} title="Rejoindre le mouvement" text="Don, adhésion, communauté" onPick={close} />
        </div>
      </div>
      <div className="menu-fixed">
        
        <div className="menu-section">
          <p className="menu-group">Soutenir</p>
          <div className="menu-support">
            <a className="don" href={LINKS.donate}>Faire un don</a>
            <a className="adherer" href={LINKS.join}>Adhérer</a>
          </div>
        </div>
        <div className="menu-info"><a href="/contact">Contact</a><a href="/mentions-legales">Mentions légales</a><a href="/politique-de-confidentialite">Confidentialité</a></div>
      </div>
    </nav>
    {children}
    <footer>
      <div className="follow">
        <p>Toute la programmation et la vie du lieu sur nos réseaux.</p>
        <SocialLinks className="social footer-social" />
      </div>
      <nav aria-label="Informations"><a href="/contact">Contact</a><a href="/mentions-legales">Mentions légales</a><a href="/politique-de-confidentialite">Confidentialité</a></nav>
      <p>Chez Marthe · Un réseau de lieux tremplins pour les femmes</p>
    </footer>
  </div>;
}
