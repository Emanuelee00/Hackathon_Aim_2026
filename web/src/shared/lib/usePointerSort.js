import { useRef, useState } from 'react';

// Ranger une liste verticale « à la main » : on attrape un élément (souris ou doigt), il se soulève et suit le pointeur,
// les autres glissent pour lui faire de la place, et il se pose là où on le lâche. Près du haut ou du bas de `scrollBox`
// (la zone qui défile ; sans elle, la page), la liste défile toute seule.
// Les boutons, liens et champs ne servent pas à attraper, sauf un bouton marqué `data-sort-grab` (par ex. un titre
// qu'on clique pour ouvrir) : un clic l'ouvre, un glissé déplace.
// `row(index)` : à mettre sur chaque élément ; `onReorder(from, to)` reçoit les positions au moment où on lâche.
const THRESHOLD = 5;
const EDGE = 56;

export default function usePointerSort(onReorder, scrollBox) {
  const elements = useRef([]);
  const [drag, setDrag] = useState(null);
  const [settling, setSettling] = useState(false);

  const begin = index => event => {
    if (event.button !== 0 || event.target.closest('button:not([data-sort-grab]), a, input, select, textarea')) return;
    const box = scrollBox?.current;
    const scrolled = () => (box ? box.scrollTop : window.scrollY);
    const rects = elements.current.map(element => element?.getBoundingClientRect());
    if (!rects[index]) return;
    const start = { index, y: event.clientY, lastY: event.clientY, scroll: scrolled(), rects, moved: false, to: index, frame: 0 };
    const gap = rects.length > 1 && rects[1] && rects[0] ? Math.max(0, rects[1].top - rects[0].bottom) : 0;
    const update = () => {
      const delta = scrolled() - start.scroll;
      const dy = start.lastY - start.y + delta;
      const center = rects[index].top + rects[index].height / 2 + dy;
      let to = index;
      rects.forEach((rect, at) => {
        if (!rect) return;
        const middle = rect.top + rect.height / 2;
        if (at < index && center < middle) to = Math.min(to, at);
        if (at > index && center > middle) to = Math.max(to, at);
      });
      start.to = to;
      setDrag({ from: index, to, dy, shift: rects[index].height + gap });
    };
    // Près du bord de la zone qui défile, on la fait défiler tant que le pointeur y reste.
    const scrollNearEdges = () => {
      if (!start.moved) return;
      const area = box ? box.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
      const step = start.lastY < area.top + EDGE ? -10 : start.lastY > area.bottom - EDGE ? 10 : 0;
      if (step) {
        if (box) box.scrollTop += step; else window.scrollBy(0, step);
        update();
      }
      start.frame = requestAnimationFrame(scrollNearEdges);
    };
    const move = moveEvent => {
      start.lastY = moveEvent.clientY;
      if (!start.moved) {
        if (Math.abs(moveEvent.clientY - start.y) < THRESHOLD) return;
        start.moved = true;
        start.frame = requestAnimationFrame(scrollNearEdges);
      }
      moveEvent.preventDefault();
      update();
    };
    const end = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      cancelAnimationFrame(start.frame);
      if (!start.moved) return;
      // Un glissé n'est pas un clic : le bouton attrapé ne s'ouvre pas en plus.
      const swallow = click => { click.stopPropagation(); click.preventDefault(); };
      window.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0);
      // Les éléments changent de place : pas d'animation à cet instant, sinon ils repartiraient de leur ancien décalage.
      setSettling(true);
      setDrag(null);
      if (start.to !== index) onReorder(index, start.to);
      requestAnimationFrame(() => requestAnimationFrame(() => setSettling(false)));
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  const style = index => {
    if (!drag) return settling ? { transition: 'none' } : undefined;
    if (index === drag.from) return { transform: `translate(6px, ${drag.dy}px) scale(1.02)`, transition: 'box-shadow .15s ease', zIndex: 3, position: 'relative' };
    if (index > drag.from && index <= drag.to) return { transform: `translateY(${-drag.shift}px)` };
    if (index < drag.from && index >= drag.to) return { transform: `translateY(${drag.shift}px)` };
    return undefined;
  };

  return {
    dragging: Boolean(drag),
    row: index => ({
      ref: element => { elements.current[index] = element; },
      onPointerDown: begin(index),
      style: style(index),
      'data-lifted': drag?.from === index ? 'true' : undefined,
    }),
  };
}
