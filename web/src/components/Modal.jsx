import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

export default function Modal({ title, subtitle, children, onClose, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = ''; previous?.focus(); };
  }, []);
  return <dialog ref={ref} className={`modal ${wide ? 'modal-wide' : ''}`} aria-labelledby="dialog-title" onCancel={onClose} onClick={event => { if (event.target === ref.current) onClose(); }}>
    <div className="modal-inner"><header className="modal-header"><div><p className="eyebrow">{subtitle || 'CHEZ MARTHE'}</p><h2 id="dialog-title">{title}</h2></div><button className="icon-button" aria-label="Fermer la fenêtre" onClick={onClose}><Icon name="close" size={22} /></button></header>{children}</div>
  </dialog>;
}
