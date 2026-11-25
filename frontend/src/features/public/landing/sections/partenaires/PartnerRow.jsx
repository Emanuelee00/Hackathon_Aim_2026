import { useEffect, useRef } from 'react';


// Fait avancer la rangée toute seule (une moitié de la piste en `duration` secondes). Au doigt ou au pavé tactile
// on peut la faire glisser dans les deux sens ; elle repart 1,5 s après, de là où on l'a laissée. La piste contient
// deux fois la même série : arrivé au bout d'une moitié on revient d'autant en arrière, sans que cela se voie.
function useAutoScroll(duration) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof requestAnimationFrame !== 'function') return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    let pos = el.scrollLeft, lastSet = pos, last = performance.now(), frame = 0;
    let holding = false, hover = false, resumeAt = 0;
    const half = () => el.scrollWidth / 2;
    const put = value => { pos = value; el.scrollLeft = value; lastSet = el.scrollLeft; };
    const tick = now => {
      const dt = Math.min(now - last, 100);
      last = now;
      if (!holding && !hover && now >= resumeAt && !el.contains(document.activeElement) && half() > 0) {
        let next = pos + (half() / duration) * (dt / 1000);
        if (next >= half()) next -= half();
        put(next);
      }
      frame = requestAnimationFrame(tick);
    };
    const onScroll = () => {
      if (Math.abs(el.scrollLeft - lastSet) < 2) return; // c'est nous qui avons bougé la rangée
      resumeAt = performance.now() + 1500;
      const x = el.scrollLeft;
      if (x >= half()) put(x - half());
      else if (x <= 0) put(x + half());
      else { pos = x; lastSet = x; }
    };
    const press = () => { holding = true; };
    const release = () => { holding = false; resumeAt = performance.now() + 1500; };
    const enter = event => { if (event.pointerType === 'mouse') hover = true; };
    const leave = () => { hover = false; };
    const listeners = [['scroll', onScroll], ['touchstart', press], ['touchend', release], ['touchcancel', release], ['pointerenter', enter], ['pointerleave', leave]];
    listeners.forEach(([type, fn]) => el.addEventListener(type, fn, { passive: true }));
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      listeners.forEach(([type, fn]) => el.removeEventListener(type, fn));
    };
  }, [duration]);
  return ref;
}

// Rangée de logos qui défile de droite à gauche en boucle : l'ensemble est répété pour remplir la largeur,
// puis le tout est doublé pour que la boucle soit continue. Seule la première série est lue par les lecteurs d'écran.
export default function PartnerRow({ items }) {
  const set = Array.from({ length: Math.max(1, Math.ceil(8 / items.length)) }, () => items).flat();
  const scroller = useAutoScroll(set.length * 6);
  // Moins de 4 logos : pas de défilement, ils restent fixes et centrés.
  if (items.length < 4) return <div className="marquee marquee-still">
    <ul className="home-partners marquee-track">{items.map(p => <li key={p.name}>
      <a href={p.url} target={p.url ? '_blank' : undefined} rel={p.url ? 'noreferrer' : undefined}><img src={p.logo} alt={p.name} title={p.name} loading="lazy" /></a>
    </li>)}</ul>
  </div>;
  return <div className="marquee marquee-moving" ref={scroller}>
    <ul className="home-partners marquee-track">{[0, 1].flatMap(round => set.map((p, i) => {
      const copy = round === 1 || i >= items.length;
      return <li key={`${round}-${i}`} aria-hidden={copy ? 'true' : undefined}>
        <a href={p.url} tabIndex={copy ? -1 : undefined} target={p.url ? '_blank' : undefined} rel={p.url ? 'noreferrer' : undefined}><img src={p.logo} alt={copy ? '' : p.name} title={p.name} loading="lazy" /></a>
      </li>;
    }))}</ul>
  </div>;
}
