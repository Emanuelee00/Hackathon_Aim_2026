import { useState } from 'react';

// Ranger une liste en faisant glisser ses éléments (souris ; au clavier, les flèches restent).
// `handle(index)` va sur ce qu'on attrape, `target(index)` sur l'élément où l'on peut déposer ; `state(index)` dit lequel
// est attrapé ('from') ou survolé ('over'), pour le style. `onReorder(from, to)` reçoit les positions.
export default function useDragSort(onReorder) {
  const [from, setFrom] = useState(null);
  const [over, setOver] = useState(null);
  const end = () => { setFrom(null); setOver(null); };
  return {
    handle: index => ({
      draggable: true,
      onDragStart: event => { setFrom(index); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(index)); },
      onDragEnd: end,
    }),
    target: index => ({
      onDragOver: event => { if (from === null) return; event.preventDefault(); event.dataTransfer.dropEffect = 'move'; if (over !== index) setOver(index); },
      onDrop: event => { event.preventDefault(); if (from !== null && from !== index) onReorder(from, index); end(); },
    }),
    state: index => (from === index ? 'from' : over === index && from !== null ? 'over' : undefined),
  };
}
