import { Fragment, useEffect } from 'react';

import HomeShell from './HomeShell.jsx';
import { sectionAnchors, useSite } from './siteContent.js';
import Hero from './sections/hero/Hero.jsx';
import LieuSection from './sections/lieu/LieuSection.jsx';
import TeamSection from './sections/equipe/TeamSection.jsx';
import PillarsSection from './sections/equipe/PillarsSection.jsx';
import EvenementsSection from './sections/evenements/EvenementsSection.jsx';
import EspacesSection from './sections/espaces/EspacesSection.jsx';
import PartenairesSection from './sections/partenaires/PartenairesSection.jsx';
import InvolveSection from './sections/impliquer/InvolveSection.jsx';
import ContactSection from './sections/contact/ContactSection.jsx';

// Seconds before the first screen slides by itself to the second one.
const AUTO_SCROLL_SECONDS = 10;

export default function Landing() {
  const { content, cards: publicSpaces, order, ready } = useSite();
  const show = Object.fromEntries(Object.entries(content).map(([section, values]) => [section, values.visible !== false]));

  // Start of the page. A reload always starts at the first section, even when the address still carries the #section of an earlier menu click
  // (the browser would otherwise jump there or bring back the old scroll position). Arriving from another page with /#section goes to that
  // section: the sections are drawn by React after the browser has looked for the anchor, so go to it once the page exists and again when
  // the images have settled the layout.
  useEffect(() => {
    if (!ready) return undefined;
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    const reloaded = window.performance?.getEntriesByType?.('navigation')?.[0]?.type === 'reload';
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (reloaded && id) window.history.replaceState(null, '', window.location.pathname + window.location.search);
    if (!id || reloaded) { window.scrollTo(0, 0); return undefined; }
    const go = () => document.getElementById(id)?.scrollIntoView();
    const timers = [setTimeout(go, 150), setTimeout(go, 900)];
    return () => timers.forEach(clearTimeout);
  }, [ready]);

  // After AUTO_SCROLL_SECONDS on the first screen without any move, the page slides to the second section (the same as the arrow).
  // Any scroll, touch, key or click cancels it, and so does a reduced-motion preference or an address with a #section.
  useEffect(() => {
    if (!ready || !show.hero || window.location.hash || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const cancel = () => clearTimeout(timer);
    const timer = setTimeout(() => {
      if (window.scrollY < 10) document.querySelector('.home-hero + *')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, AUTO_SCROLL_SECONDS * 1000);
    const events = ['wheel', 'touchstart', 'keydown', 'pointerdown', 'scroll'];
    events.forEach(name => window.addEventListener(name, cancel, { passive: true, once: true }));
    return () => { clearTimeout(timer); events.forEach(name => window.removeEventListener(name, cancel)); };
  }, [ready]);
  const hidden = Object.entries(sectionAnchors).filter(([section]) => !show[section]).map(([, anchor]) => anchor);
  // Tant que le contenu n'est pas arrivé, la page reste vide (pas d'ancien texte remplacé sous les yeux).
  if (!ready) return <HomeShell home><main className="home-loading" /></HomeShell>;
  const { place, team, pillars, spaces, partners, involve, contact } = content;
  // Chaque section de la page, dans l'ordre choisi par l'équipe dans « Site » (les sections cachées ne sont pas dessinées).
  const sections = {
    hero: () => <Hero content={content.hero} show={show} />,
    place: () => <LieuSection place={place} />,
    team: () => <TeamSection team={team} />,
    pillars: () => <PillarsSection pillars={pillars} />,
    events: () => <EvenementsSection title={content.events.title} />,
    spaces: () => <EspacesSection spaces={spaces} publicSpaces={publicSpaces} />,
    partners: () => <PartenairesSection partners={partners} />,
    involve: () => <InvolveSection involve={involve} />,
    contact: () => <ContactSection contact={contact} />,
  };
  return <HomeShell home hidden={hidden}>
    <main>{order.filter(id => show[id]).map(id => <Fragment key={id}>{sections[id]()}</Fragment>)}</main>
  </HomeShell>;
}
