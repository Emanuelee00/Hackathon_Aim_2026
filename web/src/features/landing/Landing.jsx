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
  { title: 'Proposer un lieu d’accueil', photo: '/foto/facade.webp', text: 'Vous avez les murs, elles ont l’avenir. Vous nous le confiez ?', url: '#contact' },
  { title: 'Faire un don', photo: '/foto/jardin.webp', text: '1 500 m² de vide ou 1 500 m² d’avenir ? À vous de voir : aidez-nous à les aménager.', url: LINKS.donate },
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
  // Ses points sont calculés d'après la position réelle du titre et de la carte (à gauche du lieu sur grand écran, par le haut quand la carte est sous le texte).
  useLayoutEffect(() => {
    const stage = ref.current;
    const section = stage?.closest('section');
    const title = section?.querySelector('h2');
    if (!stage || !title) return undefined;
    const compute = () => {
      const stacked = window.innerWidth < 1300; // carte sous le texte (tablette, téléphone)
      const frame = section.getBoundingClientRect();
      const st = stage.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(title);
      const rects = range.getClientRects();
      if (!rects.length) return;
      // Arrivée : bord haut du lieu (grand écran) ou toit du lieu, par le haut (carte sous le texte).
      const tx = st.left + st.width * (stacked ? 0.3 : 0.285) - frame.left;
      const ty = st.top + st.height * (stacked ? 0.405 : 0.452) - frame.top;
      // Le cœur : incliné vers la droite, tracé en partant du côté DROIT (la ligne passe au-dessus, tourne autour du lobe droit et y rentre),
      // puis vers la gauche en haut, et il redescend à gauche jusqu'à la pointe. La dernière ligne repart de la pointe en courbe douce.
      const tilt = (14 * Math.PI) / 180;
      const cos = Math.cos(tilt);
      const sin = Math.sin(tilt);
      const heartAt = (hx, hy, k) => (lx, ly) => [hx + (lx * cos - ly * sin) * k, hy + (lx * sin + ly * cos) * k];
      const str = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;
      // Cuore chiuso, tracciato a mano : parte dalla punta, SALE lungo il lato destro, passa sopra i due lobi e RITORNA scendendo dal lato sinistro
      // fino a richiudersi sulla punta, da cui la freccia prosegue.
      const heartStroke = L => [
        `C ${str(L(7, 12))}, ${str(L(34, 4))}, ${str(L(30, -10))}`,
        `C ${str(L(27, -26))}, ${str(L(8, -26))}, ${str(L(0, -10))}`,
        `C ${str(L(-8, -26))}, ${str(L(-27, -26))}, ${str(L(-30, -10))}`,
        `C ${str(L(-34, 4))}, ${str(L(-7, 12))}, ${str(L(0, 26))}`,
      ].join(' ');
      let d;
      let c2x;
      let c2y;
      let endY = ty;
      if (stacked) {
        // Téléphone / tablette : la ligne naît juste sous la carte « 30 femmes hébergées », un peu en retrait du bord gauche (le point rouge
        // demandé), descend en courbe douce, passe au-dessus du cœur et le trace.
        const facts = section.querySelector('.place-facts');
        const fact = facts?.querySelector('li')?.getBoundingClientRect();
        const last = rects[rects.length - 1];
        const sx = fact ? fact.left - frame.left + Math.min(52, fact.width * 0.2) : Math.max(6, (title.parentElement || title).getBoundingClientRect().left - frame.left - 10);
        // Le bouton « On parle de nous » est sous les cartes : la ligne naît sous lui, avec un peu d'espace.
        const press = section.querySelector('.place-press-text');
        const pressRect = press?.offsetParent ? press.getBoundingClientRect() : null;
        const sy = fact ? (pressRect ? pressRect.bottom - frame.top + 26 : fact.bottom - frame.top + 42) : last.top + last.height * 0.55 - frame.top;
        const textBottom = (facts ? (pressRect || facts.getBoundingClientRect()).bottom - frame.top : ty - 150) + 14;
        const k = Math.max(1, Math.min(1.3, (ty - textBottom) / 170)); // le cœur s'agrandit un peu quand il y a de la place
        const hx = tx + 6;
        const hy = Math.max(ty - 78, textBottom + 26 * k + 14);
        const L = heartAt(hx, hy, k);
        const B = L(0, 26);
        c2x = tx;
        c2y = ty - 40;
        endY = ty - 4;
        d = `M ${sx} ${sy} C ${sx + 6} ${sy + Math.min(80, Math.max(24, (B[1] - sy) * 0.4))}, ${B[0] - Math.min(70, (B[0] - sx) * 0.6)} ${B[1] + 30}, ${str(B)} ${heartStroke(L)} C ${B[0] + 8} ${B[1] + 26}, ${c2x} ${c2y}, ${tx} ${endY}`;
      } else {
        // Grand écran : la flèche part un peu au-dessus de la fin de la PREMIÈRE ligne du titre et file vers la droite (elle ne traverse jamais
        // le texte) ; le cœur est au bout de la ligne, à sa hauteur ; enfin la ligne descend en courbe sur le bord du lieu.
        const first = rects[0];
        const fx = first.right - frame.left + 36;
        const fy = first.top - frame.top - 34;
        const k = 1.2;
        const L = heartAt(fx + 150, fy + 4, k);
        const B = L(0, 26);
        // La ligne arrive sur le lieu dans la continuité de sa courbe (le dernier point de contrôle est sur la droite vers la pointe) :
        // pas de crochet, et la pointe est tournée dans le sens du trait.
        const p1x = B[0] + 14;
        const p1y = B[1] + 30;
        c2x = tx + (p1x - tx) * 0.4;
        c2y = ty + (p1y - ty) * 0.4;
        // Départ prolongé : le trait naît juste au-dessus du « t » de « Saint- » (hors du dessin), monte puis rejoint le début d'origine, dans sa direction.
        let sx = first.right - frame.left - 14;
        let sy = first.top - frame.top + first.height * 0.12;
        const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const at = node.data.indexOf('Saint-');
          if (at < 0) continue;
          const one = document.createRange();
          one.setStart(node, at + 4);
          one.setEnd(node, at + 5);
          const tr = one.getBoundingClientRect();
          if (tr.width) { sx = tr.left + tr.width * 0.55 - frame.left + 4; sy = tr.top + tr.height * 0.2 - frame.top - 18; }
          break;
        }
        d = `M ${sx} ${sy} C ${sx + 10 + (fx - sx) * 0.12} ${sy - (sy - fy) * 0.6}, ${fx - (fx - sx) * 0.55} ${fy + 3}, ${fx} ${fy} C ${fx + 70} ${fy + 4}, ${B[0] - 56} ${B[1] + 34}, ${str(B)} ${heartStroke(L)} C ${p1x} ${p1y}, ${c2x} ${c2y}, ${tx} ${ty}`;
      }
      const angle = Math.atan2(endY - c2y, tx - c2x);
      const wing = turn => `${tx - 22 * Math.cos(angle + turn)} ${endY - 22 * Math.sin(angle + turn)}`;
      const head = `M ${wing(0.5)} L ${tx} ${endY} L ${wing(-0.5)}`;
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
  // La flèche démarre quand la section apparaît à l'écran (une seule fois par chargement de page).
  const [arrowOn, setArrowOn] = useState(() => !shouldBuildMap());
  useEffect(() => {
    if (arrowOn) return undefined;
    const section = ref.current?.closest('section');
    if (!section) { setArrowOn(true); return undefined; }
    const watcher = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setArrowOn(true); watcher.disconnect(); }
    }, { threshold: 0.4 });
    watcher.observe(section);
    return () => watcher.disconnect();
  }, [arrowOn]);
  useEffect(() => {
    if (phase !== 'build') return undefined;
    const stage = ref.current;
    const canvas = canvasRef.current;
    const section = stage?.closest('section');
    if (!stage || !canvas || !section) return undefined;
    let frame; let observer; let cancelled = false; let revealed = false;
    const image = new Image();
    image.src = '/foto/carte-lignes.webp?v=10';
    const houseImage = new Image();
    houseImage.src = '/foto/carte-lieu-lignes.webp?v=10';
    const play = () => {
      // Points = pixels du dessin (un sur deux, de la taille d'un trait). Chaque point apparaît selon sa distance à la maison,
      // la cathédrale est la dernière. Les points déjà posés sont gardés dans un calque (un seul drawImage par image).
      const W = 1600; const H = 1024; const STEP = 2;
      const sample = document.createElement('canvas'); sample.width = W; sample.height = H;
      const sctx = sample.getContext('2d', { willReadFrequently: true });
      const raw = [];
      const hx = 522; const hy = 538; const maxD = 1010;
      [[image, 0], [houseImage, 1]].forEach(([source, isHouse]) => {
        sctx.clearRect(0, 0, W, H); sctx.drawImage(source, 0, 0, W, H);
        const data = sctx.getImageData(0, 0, W, H).data;
        for (let y = 0; y < H; y += STEP) for (let x = 0; x < W; x += STEP) {
          if (data[(y * W + x) * 4 + 3] < 70) continue;
          raw.push([x, y, isHouse, Math.min(1, Math.hypot(x - hx, (y - hy) * 1.3) / maxD) * 0.92 + Math.random() * 0.04, Math.random() * Math.PI * 2, 10 + Math.random() * 26]);
        }
      });
      raw.sort((a, b) => a[3] - b[3]);
      const n = raw.length;
      const xs = new Float32Array(n); const ys = new Float32Array(n); const delay = new Float32Array(n);
      const angle = new Float32Array(n); const spread = new Float32Array(n); const house = new Uint8Array(n);
      raw.forEach(([x, y, isHouse, d, a, sp], i) => { xs[i] = x; ys[i] = y; house[i] = isHouse; delay[i] = d; angle[i] = a; spread[i] = sp; });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const box = stage.getBoundingClientRect();
      canvas.width = Math.round(box.width * dpr); canvas.height = Math.round(box.height * dpr);
      const ctx = canvas.getContext('2d');
      const layer = document.createElement('canvas'); layer.width = canvas.width; layer.height = canvas.height;
      const lctx = layer.getContext('2d');
      const k = canvas.width / W;
      const full = (1.15 + 0.55) * k * 1.25;
      const COLORS = ['#FFC2CD', 'rgba(250, 228, 238, 0.7)', '#FF86A8'];
      const DURATION = 6500;
      const start = performance.now();
      let started = 0; let settled = 0;
      const draw = now => {
        if (cancelled) return;
        const p = (now - start) / DURATION;
        if (p > 0.03) setHouseOn(true);
        // Fin de l'animation : le vrai dessin apparaît pendant que les points s'éteignent (pas de changement brusque).
        const melt = Math.min(1, Math.max(0, (p - 0.88) / 0.24));
        if (melt > 0 && !revealed) { revealed = true; setPhase('reveal'); }
        while (started < n && delay[started] * 0.74 <= p) started += 1;
        while (settled < started && (p - delay[settled] * 0.74) / 0.26 >= 1) {
          lctx.fillStyle = COLORS[house[settled] ? 2 : 1];
          lctx.fillRect(xs[settled] * k - full / 2, ys[settled] * k - full / 2, full, full);
          settled += 1;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1 - melt;
        ctx.drawImage(layer, 0, 0);
        for (let pass = 0; pass < 3; pass += 1) {
          ctx.fillStyle = COLORS[pass];
          for (let i = settled; i < started; i += 1) {
            const t = Math.min(1, (p - delay[i] * 0.74) / 0.26);
            const group = house[i] ? 2 : (t < 0.55 ? 0 : 1);
            if (group !== pass) continue;
            const e = 1 - (1 - t) ** 3;
            const off = (1 - e) * spread[i];
            const size = (1.15 + 0.55 * e) * k * 1.25;
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
        <img className="map-lines" src="/foto/carte-lignes.webp?v=10" alt="" loading="lazy" />
        <img className="map-spot-lines" src="/foto/carte-lieu-lignes.webp?v=10" alt="" loading="lazy" />
        {phase !== 'done' && <canvas className="map-dots" ref={canvasRef} />}
      </div>
    </div>
    </div>
    {titleArrow && <svg className={`map-title-arrow${arrowOn ? ' is-on' : ''}`} width={titleArrow.width} height={titleArrow.height} viewBox={`0 0 ${titleArrow.width} ${titleArrow.height}`} fill="none" aria-hidden="true">
      <path className="map-arrow-line" pathLength="1" d={titleArrow.d} />
      <path className="map-arrow-head" d={titleArrow.head} />
    </svg>}
  </>;
}

function Hero() {
  const city = useTypewriter(cities);
  return <section className="home-hero">
    <div className="hero-inner">
      <div className="hero-media" aria-hidden="true"><img className="clip is-on" src="/foto/haut-de-page-hd.webp" srcSet="/foto/haut-de-page.jpg 1200w, /foto/haut-de-page-hd.webp 2400w" sizes="100vw" alt="" fetchPriority="high" decoding="async" /></div>
      <div className="hero-text">
        <div className="hero-headline">
          <p className="hero-eyebrow">Chez Marthe · {/* Every city is laid out invisibly in the same cell: the widest one sets the width, so the line never moves. */}
            <span className="city" aria-hidden="true">
              <span className="city-sizer">{cities.map(c => <span key={c}>{c}|</span>)}</span>
              <span className="city-now">{city}<span className="city-cursor">|</span></span>
            </span>
            <span className="sr-only">{cities.join(', ')}.</span>
          </p>
          <h1 className="hero-title">
            <span className="ht" style={{ '--n': 0 }}><span>Des lieux</span></span>
            <span className="ht" style={{ '--n': 1 }}><span><mark className="ht-mark" style={{ '--ink': '0.9s' }}>Tremplins</mark></span></span>
            <span className="ht" style={{ '--n': 2 }}><span>pour les</span></span>
            <span className="ht" style={{ '--n': 3 }}><span><mark className="ht-mark" style={{ '--ink': '1.5s' }}>Femmes</mark></span></span>
          </h1>
          <p className="hero-sub">Habiter, travailler, vivre ensemble, créer du lien et rayonner.</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#s-impliquer">Nous soutenir</a>
            <a className="btn btn-rent" href="#espaces">Louer un espace</a>
          </div>
        </div>
      </div>
    </div>
    <button type="button" className="scroll-cue" aria-label="Découvrir la suite" onClick={() => document.getElementById('le-lieu')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 9l7 7 7-7" /></svg>
    </button>
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
// Chaque activité garde toujours la même couleur (d'après le premier mot de son titre).
// Couleurs des activités : gradations de rose et de violet (et un peu d'orange), aux couleurs de Chez Marthe.
const eventColors = [['#FFB3C1', '#E0527C'], ['#FFC98A', '#F28C38'], ['#D2B4FF', '#8A4FD8'], ['#EDB0DC', '#B1479A'], ['#C8A6EC', '#662B80']];
const fullMonths = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const keyOf = title => title.toLowerCase().replace(/[^a-zàâçéèêëîïôûùüÿ]+/g, ' ').trim().split(' ')[0] || title.toLowerCase();
function colorOf(title) {
  let hash = 0;
  for (const ch of keyOf(title)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return eventColors[hash % eventColors.length];
}

// ÉVÈNEMENTS DE TEST (en dur) : tant que Google Agenda n'est pas relié en ligne, des évènements factices sur 12 semaines permettent de voir la mise
// en page et le bouton « Voir la suite ». Ils ne s'affichent que si l'agenda ne renvoie rien ; à supprimer une fois l'agenda relié.
const DEMO_WEEK = [
  [0, 'Afrovibe avec Imen', '18:00', '19:00', 'La chapelle'],
  [1, 'Jardinage', '18:00', '19:00', 'Le jardin'],
  [1, 'Permanence d’accueil', '14:00', '17:00', 'Le bureau'],
  [2, 'Atelier cuisine du monde', '12:00', '14:00', 'La cantine'],
  [3, 'Soirée jeux de société', '19:00', '22:00', 'Le salon'],
  [4, 'Danse immersive', '18:00', '21:00', 'La chapelle'],
  [5, 'Marché solidaire', '10:00', '13:00', 'La cour'],
];
function demoEvents(weeks, base) {
  const out = [];
  for (let w = 0; w < weeks; w += 1) {
    for (const [dow, title, start, end, place] of DEMO_WEEK) {
      if (w % 2 && dow === 5) continue; // le marché : une semaine sur deux
      const day = new Date(base);
      day.setDate(base.getDate() + w * 7 + dow);
      out.push({ title, date: isoDate(day), start, end, place, ...(title === 'Danse immersive' ? { featured: true } : {}) });
    }
  }
  return out;
}

// « La programmation » : agenda des prochains évènements (Google Agenda via /api/programmation), sans jours vides,
// groupés par jour et par mois, filtrables par activité. « Voir la suite » charge 4 semaines de plus.
const isFeatured = event => Boolean(event.featured) || /^\s*[★⭐]/.test(event.title);
const cleanTitle = title => title.replace(/^\s*[★⭐]\s*/, '');

// L'évènement mis en avant : une grande carte au-dessus des jours.
function FeaturedEvent({ event }) {
  const day = new Date(`${event.date}T12:00:00`);
  const time = event.start ? `${event.start}${event.end ? `–${event.end}` : ''}` : 'Toute la journée';
  return <article className="pg-featured" aria-label="Évènement à la une">
    <div className="pg-feat-date"><span>{dayNames[(day.getDay() + 6) % 7].slice(0, 3)}</span><strong>{day.getDate()}</strong><small>{monthNames[day.getMonth()]}</small></div>
    <div className="pg-feat-body">
      <p className="pg-feat-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" /></svg>À la une</p>
      <h3>{cleanTitle(event.title)}</h3>
      <p className="pg-feat-meta">{dayNames[(day.getDay() + 6) % 7]} {day.getDate()} {fullMonths[day.getMonth()]} · {time}{event.place ? ` · ${event.place}` : ''}</p>
    </div>
  </article>;
}

function WeekProgramme() {
  const [weeks, setWeeks] = useState(4);
  const [events, setEvents] = useState(null); // null = chargement, false = indisponible
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(5); // évènements montrés : 5 au plus, puis 5 de plus à chaque « Voir la suite » (la page s'allonge)
  const [base] = useState(() => mondayOf(new Date()));
  useEffect(() => {
    let current = true;
    Promise.all(Array.from({ length: weeks }, (_, n) => {
      const monday = new Date(base);
      monday.setDate(base.getDate() + n * 7);
      return fetch(`/api/programmation?semaine=${isoDate(monday)}`).then(r => (r.ok ? r.json() : Promise.reject(new Error('indisponible')))).then(d => d.events);
    }))
      .then(lists => { const all = lists.flat(); if (current) setEvents(all.length ? all : demoEvents(weeks, base)); })
      .catch(() => current && setEvents(demoEvents(weeks, base)));
    return () => { current = false; };
  }, [weeks, base]);

  const today = isoDate(new Date());
  const upcoming = (events || []).filter(event => event.date >= today).sort((x, y) => (x.date + (x.start || '')).localeCompare(y.date + (y.start || '')));
  const plain = text => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const needle = plain(query.trim());
  const shown = needle ? upcoming.filter(event => plain(`${event.title} ${event.place || ''}`).includes(needle)) : upcoming;
  // Un évènement peut être mis en avant : « ★ » au début de son titre dans Google Agenda (ou featured: true). Il s'affiche en premier, en grand.
  const featured = shown.find(isFeatured);
  const rest = featured ? shown.filter(event => event !== featured) : shown;
  const groups = [];
  for (const event of rest) {
    const last = groups[groups.length - 1];
    if (last && last.date === event.date) last.list.push(event); else groups.push({ date: event.date, list: [event] });
  }
  const hasMore = rest.length > limit || weeks < 12;
  const more = () => { setLimit(limit + 5); if (rest.length <= limit + 5) setWeeks(weeks + 4); };
  const items = [];
  let month = '';
  let left = limit;
  for (const group of groups) {
    if (left <= 0) break;
    const list = group.list.slice(0, left);
    left -= list.length;
    const day = new Date(`${group.date}T12:00:00`);
    const name = `${fullMonths[day.getMonth()]} ${day.getFullYear()}`;
    if (name !== month) { month = name; items.push(<li key={`m-${name}`} className="pg-month">{name}</li>); }
    items.push(<li key={group.date} className={`pg-day has${group.date === today ? ' is-today' : ''}${[0, 6].includes(day.getDay()) ? ' is-weekend' : ''}`}>
      <div className="pg-date">
        <span className="pg-name">{dayNames[(day.getDay() + 6) % 7].slice(0, 3)}</span>
        <strong className="pg-num">{day.getDate()}</strong>
        {group.date === today && <em className="pg-badge">Aujourd’hui</em>}
      </div>
      <div className="pg-events">{list.map(event => {
        const [c1, c2] = colorOf(cleanTitle(event.title));
        return <p key={event.title + event.start} className="pg-event" style={{ '--c1': c1, '--c2': c2 }}>
          <time>{event.start ? `${event.start}${event.end ? `–${event.end}` : ''}` : 'Toute la journée'}</time>
          <strong>{cleanTitle(event.title)}</strong>
          {event.place && <small>{event.place}</small>}
        </p>;
      })}</div>
    </li>);
  }
  return <div className="pg">
    <div className="pg-top">
      <div>
        <h2 id="evenements-titre">Nos évènements</h2>
      </div>
      <label className="pg-search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
        <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Chercher une activité, un lieu…" aria-label="Chercher dans la programmation" />
      </label>
    </div>
    {events === false && <p className="pg-alert">La programmation n’est pas disponible pour le moment. Retrouvez-la sur notre Instagram.</p>}
    {events === null && <p className="pg-alert" aria-live="polite">Chargement de la programmation…</p>}
    {events && !shown.length && <p className="pg-alert">{needle ? 'Aucune activité ne correspond à votre recherche.' : 'Rien de prévu pour le moment : revenez bientôt ou suivez-nous sur Instagram.'}</p>}
    {featured && <FeaturedEvent event={featured} />}
    <ol className="pg-days pg-agenda">{items}</ol>
    {events && hasMore && <button type="button" className="pg-more" onClick={more}>Voir la suite</button>}
    <p className="pg-note">Toute la programmation et les inscriptions sur notre <a href={socials[0].url} target="_blank" rel="noopener noreferrer">Instagram</a>.</p>
  </div>;
}

// Seconds before the first screen slides by itself to the second one.
const AUTO_SCROLL_SECONDS = 10;

export default function Landing() {
  const [picked, setPicked] = useState(null);
  const spacesRef = useRef(null);
  const [spaceActive, setSpaceActive] = useState(0);
  // Téléphone : les espaces se font défiler de côté, un à la fois ; les points montrent lequel est devant.
  const onSpacesScroll = () => {
    const el = spacesRef.current;
    const first = el?.children[0];
    if (first) setSpaceActive(Math.min(publicSpaces.length - 1, Math.round(el.scrollLeft / (first.offsetWidth + parseFloat(getComputedStyle(el).columnGap || 0)))));
  };

  // Start of the page. A reload always starts at the first section, even when the address still carries the #section of an earlier menu click
  // (the browser would otherwise jump there or bring back the old scroll position). Arriving from another page with /#section goes to that
  // section: the sections are drawn by React after the browser has looked for the anchor, so go to it once the page exists and again when
  // the images have settled the layout.
  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    const reloaded = window.performance?.getEntriesByType?.('navigation')?.[0]?.type === 'reload';
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (reloaded && id) window.history.replaceState(null, '', window.location.pathname + window.location.search);
    if (!id || reloaded) { window.scrollTo(0, 0); return undefined; }
    const go = () => document.getElementById(id)?.scrollIntoView();
    const timers = [setTimeout(go, 150), setTimeout(go, 900)];
    return () => timers.forEach(clearTimeout);
  }, []);

  // After AUTO_SCROLL_SECONDS on the first screen without any move, the page slides to the second section (the same as the arrow).
  // Any scroll, touch, key or click cancels it, and so does a reduced-motion preference or an address with a #section.
  useEffect(() => {
    if (window.location.hash || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const cancel = () => clearTimeout(timer);
    const timer = setTimeout(() => {
      if (window.scrollY < 10) document.getElementById('le-lieu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, AUTO_SCROLL_SECONDS * 1000);
    const events = ['wheel', 'touchstart', 'keydown', 'pointerdown', 'scroll'];
    events.forEach(name => window.addEventListener(name, cancel, { passive: true, once: true }));
    return () => { clearTimeout(timer); events.forEach(name => window.removeEventListener(name, cancel)); };
  }, []);
  return <HomeShell home>
    <main>
      <Hero />

      {/* Le fond de la section est la carte dessinée du quartier (PlaceMap) : voir home.css. */}
      <section id="le-lieu" className="landing-section landing-wrap place place-bg">
        <PlaceMap />
        <div>
          <p className="eyebrow">NOTRE PREMIER LIEU</p>
          <h2>Chez Marthe, Saint-Savournin</h2>
          <p>Un lieu vacant devient un lieu innovant : un ancien couvent de 1 500 m² dans le quartier des Réformés, trois bâtiments, une chapelle néogothique et un jardin, réveillés pour devenir la première Maison Tremplin.</p>
          <ul className="place-facts">
            <li><strong>30</strong><span>femmes hébergées, avec ou sans enfants</span></li>
            <li><strong>6</strong><span>espaces partagés avec le quartier</span></li>
          </ul>
          <a className="place-press place-press-text" href="/on-parle-de-nous">On parle de nous</a>
        </div>
      </section>

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

      <section id="evenements" className="block block-wall prog" aria-labelledby="evenements-titre">
        <WeekProgramme />
      </section>

      <section id="espaces" className="block" aria-labelledby="espaces-titre">
        <p className="kicker">LOUER UN ESPACE</p>
        <h2 id="espaces-titre">Un lieu pour votre activité</h2>
        <div className="home-spaces" ref={spacesRef} onScroll={onSpacesScroll}>{publicSpaces.map(space => <a key={space.id} className="space" href="#demande" onClick={() => setPicked({ space: space.id, at: Date.now() })}>
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
        <div className="team-dots" aria-hidden="true">{publicSpaces.map((space, i) => <span key={space.id} className={i === spaceActive ? 'on' : ''} />)}</div>
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
        <p>Un bâtiment vide ne change aucune vie. Don, adhésion, communauté ou lieu à nous confier : chaque soutien fait vivre Chez Marthe.</p>
        <div className="involve-grid">{involvement.map(item => <a key={item.title} className="home-involve" href={item.url} target={item.url.startsWith('http') ? '_blank' : undefined} rel={item.url.startsWith('http') ? 'noreferrer' : undefined} style={{ '--photo': `url(${item.photo})` }}><strong>{item.title}</strong><span>{item.text}</span></a>)}</div>
      </section>

      <section id="contact" className="block" aria-labelledby="contact-titre">
        <p className="kicker">CONTACT</p>
        <h2 id="contact-titre">Contactez-nous</h2>
        <p>Vos clés peuvent ouvrir bien plus que des portes. Écrivez-nous : nous répondons généralement sous 1 à 2 jours ouvrables.</p>
        <ContactForm />
      </section>
    </main>
  </HomeShell>;
}
