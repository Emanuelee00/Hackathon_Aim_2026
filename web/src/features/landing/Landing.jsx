import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { spaceById } from '../../shared/data/spaces.js';
import { spaceUrl } from '../../shared/lib/spaces.js';
import PublicRequest from '../public-request/PublicRequest.jsx';
import { ContactForm } from '../site-pages/Contact.jsx';
import HomeShell, { LINKS, socials } from './HomeShell.jsx';

const cities = ['Marseille', 'Nice', 'Avignon', 'Paris', 'Angers', 'La Ciotat'];

// Types out each city, pauses, erases it, then moves to the next — skipped for reduced motion.
function useTypewriter(words, { typingMs = 90, deletingMs = 45, pauseMs = 1500 } = {}) {
  const [text, setText] = useState(words[0]);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    let index = 0;
    let current = words[0];
    let deleting = true;
    let timerId;
    function step() {
      const word = words[index];
      current = deleting ? current.slice(0, -1) : word.slice(0, current.length + 1);
      setText(current);
      let delay = deleting ? deletingMs : typingMs;
      if (!deleting && current === word) { delay = pauseMs; deleting = true; }
      else if (deleting && current === '') { deleting = false; index = (index + 1) % words.length; }
      timerId = setTimeout(step, delay);
    }
    timerId = setTimeout(step, pauseMs);
    return () => clearTimeout(timerId);
  }, []);
  return text;
}

const pillars = [
  { title: 'Se loger', photo: '/foto/facade.webp', text: 'Un toit sûr pour se poser et retrouver de la stabilité avant la prochaine étape.' },
  { title: 'Se reconstruire', photo: '/foto/sororite.webp', text: 'Un lieu d’écoute, sans jugement, pour prendre soin de soi à son rythme.' },
  { title: 'Se nourrir', photo: '/foto/cantine.webp', text: 'Des repas partagés à prix libre avec la cantine et le jardin.' },
  { title: 'Rayonner', photo: '/foto/jardin.webp', text: 'Des rencontres, des projets et des coups de main avec tout le quartier.' },
];

// Violet wave closing the band above and below (same as the platform's public site).
function Wave({ className }) {
  return <svg className={className} viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true"><path d="M0 48 C 240 8 480 8 720 40 S 1200 80 1440 30 V80 H0 Z" /></svg>;
}

// The spaces offered to the public, with the names, surfaces and prices of the « Espaces Chez Marthe » sheet.
// « reunion » is the Bureau; the Atelier is lent in exchange for free workshops.
const publicSpaces = [
  { id: 'chapelle', name: 'La Chapelle', photo: '/foto/chapelle.jpg', focus: 'center 14%', details: ['80 à 150 personnes', '114 m²', 'Concerts, spectacles, danse, yoga'], prices: [['2 heures', '40 €'], ['Demi-journée', '150 €'], ['Journée', '300 €']], note: 'Sonorisation (micro + enceinte) : 50 € en plus.' },
  { id: 'salon-collectif', name: 'Salon collectif / Séminaire', photo: '/foto/salon.jpg', focus: 'center 45%', details: ['Maximum 20 personnes', '28 m²', 'Séminaires et réunions'], prices: [['2 heures', '40 €'], ['Demi-journée', '100 €'], ['Journée', '200 €']] },
  { id: 'reunion', name: 'Le Bureau', photo: '/foto/bureau.jpg', focus: 'center 40%', details: ['Maximum 6 personnes', '16 m²', 'Réunions en petit comité'], prices: [['2 heures', '40 €'], ['Demi-journée', '100 €'], ['Journée', '200 €']] },
  { id: 'atelier', name: 'L’Atelier', photo: '/foto/atelier.jpg', focus: 'center 55%', details: ['Échange de services'], exchange: 'Vous utilisez l’Atelier et, en échange, vous animez un atelier gratuit pour Chez Marthe.' },
];
const requestSpaces = publicSpaces.map(space => ({ ...spaceById[space.id], name: space.id === 'atelier' ? 'L’Atelier (échange de services)' : space.name }));

const partners = [
  { name: 'Habitat Alternatif Social', logo: 'has.webp', url: 'https://www.has.asso.fr/' },
  { name: 'JUST', logo: 'just.webp', url: 'https://just.earth/' },
  { name: 'Les Petites Cantines Marseille', logo: 'petites-cantines.webp', url: 'https://marseille.lespetitescantines.org/' },
  { name: 'Sister4Good', logo: 'sista4good.webp', url: 'https://www.sista4good.com/' },
  { name: 'Benenova Marseille', logo: 'benenova.webp', url: 'https://www.benenova.fr/' },
];

// Villes, écoles et programmes qui accompagnent le projet (logos recadrés depuis la capture fournie par l'équipe).
const supporters = [
  { name: 'Ville de Marseille', logo: 'ville-de-marseille.webp', url: 'https://www.marseille.fr/' },
  { name: 'KEDGE Entrepreneurship', logo: 'kedge-entrepreneurship.webp', url: 'https://kedge.edu/' },
  { name: 'Gagnante Be a Boss Women Tour 2025', logo: 'be-a-boss-women-tour.webp', url: 'https://www.beaboss-womentour.com/e/sud-2027' },
  { name: 'HEC Paris – Stand Up', logo: 'hec-paris-stand-up.webp', url: 'https://www.hec.edu/' },
];

// Financeurs publics : le logo vient de la page Wikipédia de la Métropole.
const funders = [
  { name: 'Métropole Aix-Marseille-Provence', logo: 'metropole-aix-marseille-provence.svg', url: 'https://www.ampmetropole.fr/' },
  { name: 'Fondation de France', logo: 'fondation-de-france.webp', url: 'https://www.fondationdefrance.org/fr/' },
];

const involvement = [
  { title: 'Proposer un lieu d’accueil', photo: '/foto/facade.webp', text: 'Vous connaissez un lieu qui pourrait accueillir le projet ? Parlons-en.', url: '#contact' },
  { title: 'Faire un don', photo: '/foto/jardin.webp', text: 'Aménager les espaces et faire durer le lieu.', url: LINKS.donate },
  { title: 'Adhérer', photo: '/foto/sororite.webp', text: 'Rejoindre l’association et porter le projet avec nous.', url: LINKS.join },
  { title: 'Les amies de Chez Marthe', photo: '/foto/cantine.webp', text: 'La communauté qui suit la vie du lieu au quotidien.', url: LINKS.friends },
];

// Rangée de logos qui défile de droite à gauche en boucle : l'ensemble est répété pour remplir la largeur,
// puis le tout est doublé pour que la boucle soit continue. Seule la première série est lue par les lecteurs d'écran.
function PartnerRow({ items }) {
  // Moins de 4 logos : pas de défilement, ils restent fixes et centrés.
  if (items.length < 4) return <div className="marquee marquee-still">
    <ul className="home-partners marquee-track">{items.map(p => <li key={p.name}>
      <a href={p.url} target={p.url ? '_blank' : undefined} rel={p.url ? 'noreferrer' : undefined}><img src={`/foto/partenaires/${p.logo}`} alt={p.name} title={p.name} loading="lazy" /></a>
    </li>)}</ul>
  </div>;
  const set = Array.from({ length: Math.max(1, Math.ceil(8 / items.length)) }, () => items).flat();
  return <div className="marquee" style={{ '--duration': `${set.length * 6}s` }}>
    <ul className="home-partners marquee-track">{[0, 1].flatMap(round => set.map((p, i) => {
      const copy = round === 1 || i >= items.length;
      return <li key={`${round}-${i}`} aria-hidden={copy ? 'true' : undefined}>
        <a href={p.url} tabIndex={copy ? -1 : undefined} target={p.url ? '_blank' : undefined} rel={p.url ? 'noreferrer' : undefined}><img src={`/foto/partenaires/${p.logo}`} alt={copy ? '' : p.name} title={p.name} loading="lazy" /></a>
      </li>;
    }))}</ul>
  </div>;
}

export function Brand() {
  return <a href={spaceUrl(null)} className="landing-brand"><img src="/logo-chez-marthe.png" alt="Chez Marthe" /></a>;
}

// Still used by the legal and contact pages (SitePage).
export function SiteFooter() {
  return <footer className="site-footer">
    <div className="landing-wrap">
      <img src="/logo-chez-marthe.png" alt="Chez Marthe" />
      <p>Habiter &amp; rayonner.</p>
      <nav aria-label="Informations"><a href="/contact">Contact</a><a href="/mentions-legales">Mentions légales</a><a href="/politique-de-confidentialite">Confidentialité</a></nav>
    </div>
  </footer>;
}

// Carte du quartier : le dessin est séparé en deux calques (traits crème, murs du lieu en rose) + une flèche vers le lieu. Purement décoratif.
// La construction à points se joue à chaque chargement de la page (sauf si les animations sont désactivées).
function shouldBuildMap() {
  return typeof window !== 'undefined' && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function PlaceMap() {
  const ref = useRef(null);
  const [titleArrow, setTitleArrow] = useState(null);
  // Grand écran : une flèche à boucles part du titre « Chez Marthe, Saint-Savournin » et arrive sur le lieu en rose.
  // Ses points sont calculés d'après la position réelle du titre et de la carte ; en dessous de 1300 px (carte sous le texte), c'est la flèche du dessin qui sert.
  useLayoutEffect(() => {
    const stage = ref.current;
    const section = stage?.closest('section');
    const title = section?.querySelector('h2');
    if (!stage || !title) return undefined;
    const compute = () => {
      if (window.innerWidth < 1300) { setTitleArrow(null); return; }
      const frame = section.getBoundingClientRect();
      const st = stage.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(title);
      const rects = range.getClientRects();
      const last = rects[rects.length - 1];
      if (!last) return;
      // Départ : fin de la dernière ligne du titre (« Savournin »). Arrivée : bord gauche du lieu en rose.
      const sx = last.right - frame.left + 12;
      const sy = last.top + last.height * 0.55 - frame.top;
      const tx = st.left + st.width * 0.178 - frame.left;
      const ty = st.top + st.height * 0.545 - frame.top;
      const dx = tx - sx;
      const dy = ty - sy;
      // La flèche descend derrière le texte, dessine un cœur, puis file vers le lieu.
      const hx = sx + dx * 0.56;
      const hy = sy + dy * 0.5;
      const k = 1.5;
      const bx = hx;
      const by = hy + 26 * k;
      const heart = [
        `C ${hx - 14 * k} ${hy + 16 * k}, ${hx - 34 * k} ${hy + 4 * k}, ${hx - 30 * k} ${hy - 10 * k}`,
        `C ${hx - 27 * k} ${hy - 26 * k}, ${hx - 8 * k} ${hy - 26 * k}, ${hx} ${hy - 10 * k}`,
        `C ${hx + 8 * k} ${hy - 26 * k}, ${hx + 27 * k} ${hy - 26 * k}, ${hx + 30 * k} ${hy - 10 * k}`,
        `C ${hx + 34 * k} ${hy + 4 * k}, ${hx + 14 * k} ${hy + 16 * k}, ${bx} ${by}`,
      ].join(' ');
      const c2x = tx - 46;
      const c2y = ty - 16;
      const d = `M ${sx} ${sy} C ${sx + 8} ${sy + 56}, ${bx - 90} ${by + 8}, ${bx - 6} ${by + 1} ${heart} C ${bx + 36} ${by + 14}, ${c2x} ${c2y}, ${tx} ${ty}`;
      const angle = Math.atan2(ty - c2y, tx - c2x);
      const wing = turn => `${tx - 22 * Math.cos(angle + turn)} ${ty - 22 * Math.sin(angle + turn)}`;
      const head = `M ${wing(0.5)} L ${tx} ${ty} L ${wing(-0.5)}`;
      setTitleArrow({ d, head, width: frame.width, height: frame.height });
    };
    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(section);
    document.fonts?.ready.then(compute);
    return () => observer.disconnect();
  }, []);
  // À chaque chargement : la carte se construit en points, de la maison de Chez Marthe jusqu'à la cathédrale.
  const [phase, setPhase] = useState(() => (shouldBuildMap() ? 'build' : 'done'));
  const [houseOn, setHouseOn] = useState(false);
  const building = phase === 'build';
  const canvasRef = useRef(null);
  useEffect(() => {
    if (phase !== 'build') return undefined;
    const stage = ref.current;
    const canvas = canvasRef.current;
    const section = stage?.closest('section');
    if (!stage || !canvas || !section) return undefined;
    let frame; let observer; let cancelled = false; let revealed = false;
    const image = new Image();
    image.src = '/foto/carte-lignes.webp?v=8';
    const houseImage = new Image();
    houseImage.src = '/foto/carte-lieu-lignes.webp?v=8';
    const play = () => {
      // Points = pixels du dessin (un sur trois). Chaque point apparaît selon sa distance à la maison, la cathédrale est la dernière.
      const W = 1600; const H = 1024; const STEP = 3;
      const sample = document.createElement('canvas'); sample.width = W; sample.height = H;
      const sctx = sample.getContext('2d', { willReadFrequently: true });
      const xs = []; const ys = []; const delay = []; const angle = []; const spread = []; const house = [];
      const hx = 522; const hy = 538; const maxD = 1010;
      [[image, false], [houseImage, true]].forEach(([source, isHouse]) => {
        sctx.clearRect(0, 0, W, H); sctx.drawImage(source, 0, 0, W, H);
        const data = sctx.getImageData(0, 0, W, H).data;
        for (let y = 0; y < H; y += STEP) for (let x = 0; x < W; x += STEP) {
          if (data[(y * W + x) * 4 + 3] < 70) continue;
          xs.push(x); ys.push(y); house.push(isHouse);
          delay.push(Math.min(1, Math.hypot(x - hx, (y - hy) * 1.3) / maxD) * 0.92 + Math.random() * 0.04);
          angle.push(Math.random() * Math.PI * 2); spread.push(10 + Math.random() * 26);
        }
      });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const box = stage.getBoundingClientRect();
      canvas.width = Math.round(box.width * dpr); canvas.height = Math.round(box.height * dpr);
      const ctx = canvas.getContext('2d');
      const k = canvas.width / W;
      const DURATION = 6500;
      const start = performance.now();
      const draw = now => {
        if (cancelled) return;
        const p = (now - start) / DURATION;
        if (p > 0.03) setHouseOn(true);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Fin de l'animation : le vrai dessin apparaît pendant que les points rétrécissent et s'éteignent (pas de changement brusque).
        const melt = Math.min(1, Math.max(0, (p - 0.88) / 0.24));
        if (melt > 0 && !revealed) { revealed = true; setPhase('reveal'); }
        ctx.globalAlpha = 1 - melt;
        for (let pass = 0; pass < 3; pass += 1) {
          ctx.fillStyle = ['#FFC2CD', 'rgba(250, 228, 238, 0.8)', '#FF86A8'][pass];
          for (let i = 0; i < xs.length; i += 1) {
            const t = Math.min(1, Math.max(0, (p - delay[i] * 0.74) / 0.26));
            if (t <= 0) continue;
            const group = house[i] ? 2 : (t < 0.55 ? 0 : 1);
            if (group !== pass) continue;
            const e = 1 - (1 - t) ** 3;
            const off = (1 - e) * spread[i];
            const size = (1.7 + 0.8 * e) * k * 1.25 * (1 - 0.55 * melt);
            ctx.fillRect((xs[i] + Math.cos(angle[i]) * off) * k - size / 2, (ys[i] + Math.sin(angle[i]) * off) * k - size / 2, size, size);
          }
        }
        if (p < 1.12) frame = requestAnimationFrame(draw); else setPhase('done');
      };
      frame = requestAnimationFrame(draw);
    };
    const start = () => {
      const ready = () => (image.complete && houseImage.complete ? play() : undefined);
      image.onload = ready; houseImage.onload = ready; ready();
    };
    observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); start(); }
    }, { threshold: 0.4 });
    observer.observe(section);
    return () => { cancelled = true; cancelAnimationFrame(frame); observer?.disconnect(); };
  }, []);
  return <>
    <div className="place-map" aria-hidden="true">
    <div className={`map-stage${building ? ' is-building' : ''}${houseOn ? ' house-on' : ''}`} ref={ref}>
      <div className="map-float">
        <img className="map-lines" src="/foto/carte-lignes.webp?v=8" alt="" loading="lazy" />
        <img className="map-spot-lines" src="/foto/carte-lieu-lignes.webp?v=8" alt="" loading="lazy" />
        {phase !== 'done' && <canvas className="map-dots" ref={canvasRef} />}
        {/* Flèche à boucles, dessinée dans le repère de la carte (1600 × 1024) : de « Rue Saint-Savournin » jusqu'au lieu en rose. */}
        <svg className="map-arrow" viewBox="0 0 1600 1024" fill="none" aria-hidden="true">
          <path className="map-arrow-line" pathLength="1" d="M 518 754 C 468 806 382 794 374 738 C 368 692 434 688 430 726 C 426 762 372 750 360 704 C 352 672 344 648 336 630" />
          <path className="map-arrow-head" d="M 321 648 L 334 624 L 354 640" />
        </svg>
      </div>
    </div>
    </div>
    {titleArrow && <svg className="map-title-arrow" width={titleArrow.width} height={titleArrow.height} viewBox={`0 0 ${titleArrow.width} ${titleArrow.height}`} fill="none" aria-hidden="true">
      <path className="map-arrow-line" pathLength="1" d={titleArrow.d} />
      <path className="map-arrow-head" d={titleArrow.head} />
    </svg>}
  </>;
}

function Hero() {
  const city = useTypewriter(cities);
  return <section className="home-hero">
    <div className="hero-inner">
      <div className="hero-media" aria-hidden="true"><img className="clip is-on" src="/foto/haut-de-page.jpg" alt="" /></div>
      <div className="hero-text">
        <div className="hero-headline">
          <h1>Rejoignez l’aventure</h1>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#s-impliquer">Nous soutenir</a>
            <a className="btn btn-rent" href="#espaces">Louer un espace</a>
          </div>
          <p>Soutenez un lieu tremplin pour les femmes,<br /><span className="keep">au cœur de{' '}
            {/* Every city is laid out invisibly in the same cell: the widest one sets the width, so « au cœur de » never moves. */}
            <span className="city" aria-hidden="true">
              <span className="city-sizer">{cities.map(c => <span key={c}>{c}|.</span>)}</span>
              <span className="city-now">{city}<span className="city-cursor">|</span>.</span>
            </span></span>
            <span className="sr-only">{cities.join(', ')}.</span>
          </p>
        </div>
      </div>
    </div>
  </section>;
}

const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const monthNames = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const isoDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
function mondayOf(date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

// Programmation : une semaine du Google Agenda de l'association (via /api/programmation), avec une flèche pour la semaine suivante.
function WeekProgramme() {
  const [monday, setMonday] = useState(() => mondayOf(new Date()));
  const [events, setEvents] = useState(null);
  const start = isoDate(monday);
  useEffect(() => {
    let current = true;
    setEvents(null);
    fetch(`/api/programmation?semaine=${start}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('indisponible'))))
      .then(data => current && setEvents(data.events))
      .catch(() => current && setEvents(false));
    return () => { current = false; };
  }, [start]);
  const days = Array.from({ length: 7 }, (_, n) => { const day = new Date(monday); day.setDate(monday.getDate() + n); return day; });
  const shift = weeks => { const next = new Date(monday); next.setDate(monday.getDate() + weeks * 7); setMonday(next); };
  const thisWeek = start === isoDate(mondayOf(new Date()));
  const last = days[6];
  const label = `${monday.getDate()}${monday.getMonth() === last.getMonth() ? '' : ` ${monthNames[monday.getMonth()]}`} – ${last.getDate()} ${monthNames[last.getMonth()]}`;
  return <div className="week">
    <div className="week-head">
      <button type="button" className="week-arrow" onClick={() => shift(-1)} disabled={thisWeek} aria-label="Semaine précédente">‹</button>
      <p className="week-label" aria-live="polite">Semaine du {label}</p>
      <button type="button" className="week-arrow" onClick={() => shift(1)} aria-label="Semaine suivante">›</button>
    </div>
    {events === false && <p className="week-note">La programmation n’est pas disponible pour le moment. Retrouvez-la sur notre Instagram.</p>}
    <ol className="week-days">{days.map((day, n) => {
      const dayEvents = (events || []).filter(event => event.date === isoDate(day));
      return <li key={isoDate(day)} className={`week-day${dayEvents.length ? ' has-events' : ''}`}>
        <span className="event-date"><strong>{day.getDate()}</strong>{dayNames[n].slice(0, 3)}</span>
        <div className="week-events">
          {dayEvents.length
            ? dayEvents.map((event, index) => <p key={event.title + event.start} className={`week-event shade-${Math.min(index, 3)}`}><strong>{event.title}</strong><small>{[event.start && `${event.start}${event.end ? `–${event.end}` : ''}`, event.place].filter(Boolean).join(' · ') || 'Toute la journée'}</small></p>)
            : <p className="week-empty">{events === null ? '…' : 'Rien de prévu'}</p>}
        </div>
      </li>;
    })}</ol>
  </div>;
}

export default function Landing() {
  const [picked, setPicked] = useState(null);
  return <HomeShell home>
    <main>
      <Hero />

      <section className="landing-band" aria-labelledby="pillars-title">
        <div className="landing-wrap">
          <h2 id="pillars-title" className="sr-only">Ce que l’on vit Chez Marthe</h2>
          <div className="pillars">{pillars.map(pillar => <article key={pillar.title} className="pillar">
            <img src={pillar.photo} alt="" loading="lazy" />
            <h3>{pillar.title}</h3>
            <p>{pillar.text}</p>
          </article>)}</div>
        </div>
        <Wave className="wave wave-bottom" />
      </section>

      {/* Le fond de la section est la carte dessinée du quartier (PlaceMap) : voir home.css. */}
      <section id="le-lieu" className="landing-section landing-wrap place place-bg">
        <PlaceMap />
        <div>
          <p className="eyebrow">NOTRE PREMIER LIEU</p>
          <h2>Chez Marthe, Saint-Savournin</h2>
          <p>Un ancien couvent de 1 500 m² dans le quartier des Réformés : trois bâtiments, une chapelle néogothique et un jardin, réveillés pour devenir la première Maison Tremplin.</p>
          <ul className="place-facts">
            <li><strong>30</strong><span>femmes hébergées, avec ou sans enfants</span></li>
            <li><strong>6</strong><span>espaces partagés avec le quartier</span></li>
          </ul>
        </div>
      </section>

      <section id="evenements" className="block block-wall" aria-labelledby="evenements-titre">
        <p className="kicker">NOS ÉVÈNEMENTS</p>
        <h2 id="evenements-titre">La programmation</h2>
        <WeekProgramme />
        <p className="small">Toute la programmation et les inscriptions sur notre <a className="insta-link" href={socials[0].url} target="_blank" rel="noopener noreferrer">Instagram</a>.</p>
      </section>

      <section id="espaces" className="block" aria-labelledby="espaces-titre">
        <p className="kicker">LOUER UN ESPACE</p>
        <h2 id="espaces-titre">Un lieu pour votre activité</h2>
        <div className="home-spaces">{publicSpaces.map(space => <a key={space.id} className="space" href="#demande" onClick={() => setPicked({ space: space.id, at: Date.now() })}>
          <img src={space.photo} alt="" loading="lazy" style={{ objectPosition: space.focus }} />
          <h3 className="space-title">{space.name}</h3>
          <div className="space-body">
            <ul className="space-details">{space.details.map(detail => <li key={detail}>{detail}</li>)}</ul>
            {space.prices && <dl className="space-prices">{space.prices.map(([label, amount]) => <div key={label}><dt>{label}</dt><dd>{amount}</dd></div>)}</dl>}
            {space.note && <p>{space.note}</p>}
            {space.exchange && <p className="space-exchange">{space.exchange}</p>}
            <span className="space-cta">Faire une demande →</span>
          </div>
        </a>)}</div>
      </section>

      <div id="demande" className="block request-block"><PublicRequest spaces={requestSpaces} hidePicker picked={picked} /></div>

      <section id="partenaires" className="block" aria-labelledby="partenaires-titre">
        <p className="kicker">ILS FONT VIVRE LE LIEU</p>
        <h2 id="partenaires-titre">Nos partenaires</h2>
        <PartnerRow items={partners} />
        <h3 className="partners-subtitle">Nos partenaires financiers</h3>
        <PartnerRow items={funders} />
        <h3 className="partners-subtitle">Ils nous accompagnent</h3>
        <PartnerRow items={supporters} />
      </section>

      <section id="s-impliquer" className="block" aria-labelledby="impliquer-titre">
        <p className="kicker">REJOINDRE LE MOUVEMENT</p>
        <h2 id="impliquer-titre">Nous soutenir</h2>
        <p>Faites un don, adhérez à l’association ou rejoignez la communauté : chaque soutien fait vivre Chez Marthe.</p>
        <div className="involve-grid">{involvement.map(item => <a key={item.title} className="home-involve" href={item.url} target={item.url.startsWith('http') ? '_blank' : undefined} rel={item.url.startsWith('http') ? 'noreferrer' : undefined} style={{ '--photo': `url(${item.photo})` }}><strong>{item.title}</strong><span>{item.text}</span></a>)}</div>
      </section>

      <section id="contact" className="block" aria-labelledby="contact-titre">
        <p className="kicker">CONTACT</p>
        <h2 id="contact-titre">Contactez-nous</h2>
        <p>Une question, une idée, l’envie de vous impliquer ? Écrivez-nous : nous répondons généralement sous 1 à 2 jours ouvrables.</p>
        <ContactForm />
      </section>
    </main>
  </HomeShell>;
}
