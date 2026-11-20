import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// Carte du quartier : le dessin est séparé en deux calques (traits crème, murs du lieu en rose) + une flèche vers le lieu. Purement décoratif.
// La construction à points se joue à chaque chargement de la page (sauf si les animations sont désactivées).
function shouldBuildMap() {
  return typeof window !== 'undefined' && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export default function PlaceMap() {
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
      // Closed heart, hand-drawn path: starts at the tip, CLIMBS along the right side, passes over the two lobes and COMES BACK down the left side
      // until it closes on the tip, from which the arrow continues.
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
