import { useEffect, useRef, useState } from 'react';

// Une barre de défilement horizontale collée en bas de l'écran tant que le tableau est visible :
// plus besoin de descendre au bout du tableau pour le faire glisser. On attrape le curseur, ou on clique dans la barre.
// Dessinée à la main (pas la barre du système, invisible sur Mac tant qu'on ne défile pas). Elle suit le tableau.
// À placer juste après le conteneur qui défile (`target`, une ref) ; la barre d'origine de ce conteneur est cachée en CSS.
export default function StickyScrollbar({ target }) {
  const track = useRef(null);
  const [view, setView] = useState({ left: 0, size: 1 });
  useEffect(() => {
    const box = target.current;
    if (!box) return undefined;
    const measure = () => setView({ left: box.scrollWidth ? box.scrollLeft / box.scrollWidth : 0, size: box.scrollWidth ? box.clientWidth / box.scrollWidth : 1 });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    if (box.firstElementChild) observer.observe(box.firstElementChild);
    box.addEventListener('scroll', measure, { passive: true });
    return () => { observer.disconnect(); box.removeEventListener('scroll', measure); };
  }, [target]);
  const scrollTo = ratio => { const box = target.current; box.scrollLeft = ratio * box.scrollWidth; };
  const grab = event => {
    event.preventDefault();
    const rect = track.current.getBoundingClientRect();
    const startX = event.clientX;
    const startLeft = view.left;
    const onMove = move => scrollTo(startLeft + (move.clientX - startX) / rect.width);
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };
  // Un clic dans la barre (hors du curseur) y amène le milieu du curseur.
  const jump = event => {
    if (event.target !== track.current) return;
    const rect = track.current.getBoundingClientRect();
    scrollTo((event.clientX - rect.left) / rect.width - view.size / 2);
  };
  const idle = view.size >= 0.999;
  return <div className={`sticky-scrollbar${idle ? ' is-idle' : ''}`} aria-hidden="true">
    <div ref={track} className="sticky-scrollbar-track" onPointerDown={jump}>
      <div className="sticky-scrollbar-thumb" style={{ left: `${view.left * 100}%`, width: `${Math.max(view.size * 100, 6)}%` }} onPointerDown={grab} />
    </div>
  </div>;
}
