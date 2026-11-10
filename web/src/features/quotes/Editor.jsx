import { useEffect, useRef, useState } from 'react';
import Icon from '../../shared/components/Icon.jsx';
import { plainText, toBlocks } from './editorModel.js';
import { templates } from './editorTemplates.js';

// Editor of documents: starts from the association's quote or invoice, already written, with the fields « <<…>> » to type over;
// or from a blank page. Then download it in Word, PDF or plain text. The file is built by the server (editeur.py); nothing is stored.
const tools = [
  { label: 'G', title: 'Gras', command: 'bold', className: 'tool-bold' },
  { label: 'I', title: 'Italique', command: 'italic', className: 'tool-italic' },
  { label: 'S', title: 'Souligné', command: 'underline', className: 'tool-underline' },
  { label: 'Titre', title: 'Grand titre', block: 'h1' },
  { label: 'Sous-titre', title: 'Sous-titre', block: 'h2' },
  { label: 'Texte', title: 'Paragraphe normal', block: 'p' },
  { label: '• Liste', title: 'Liste à puces', command: 'insertUnorderedList' },
  { label: '1. Liste', title: 'Liste numérotée', command: 'insertOrderedList' },
  { label: '⇤', title: 'Aligner à gauche', command: 'justifyLeft' },
  { label: '↔', title: 'Centrer', command: 'justifyCenter' },
  { label: '⇥', title: 'Aligner à droite', command: 'justifyRight' },
  { label: '☰', title: 'Justifier', command: 'justifyFull' },
  { label: '↶', title: 'Annuler', command: 'undo' },
  { label: '↷', title: 'Rétablir', command: 'redo' },
];
const placeholders = root => [...root.querySelectorAll('.ph')].filter(span => /^<<.*>>$/.test(span.textContent.trim()));

export default function Editor() {
  const page = useRef(null);
  const [start, setStart] = useState('devis');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [left, setLeft] = useState(0);

  const load = key => {
    const template = templates[key];
    page.current.innerHTML = template.html;
    page.current.querySelectorAll('table[data-widths]').forEach(table => { // column widths, as the file will have them
      const group = document.createElement('colgroup');
      table.dataset.widths.split(',').forEach(width => { const col = document.createElement('col'); col.style.width = `${width}%`; group.append(col); });
      table.prepend(group);
    });
    setStart(key);
    setTitle(template.title);
    setError('');
    setLeft(placeholders(page.current).length);
  };
  useEffect(() => { load('devis'); }, []); // the quote is there when the editor opens

  const choose = key => {
    const written = plainText(toBlocks(page.current)).trim();
    if (key === start && !written) return;
    if (written && !window.confirm(`Remplacer ce qui est écrit par ${key === 'blank' ? 'une page blanche' : `un nouveau ${templates[key].label.toLowerCase()}`} ? Le texte actuel sera perdu.`)) return;
    load(key);
  };
  // A field that has been typed over is no longer highlighted.
  const typed = () => {
    page.current.querySelectorAll('.ph').forEach(span => { if (!/^<<.*>>$/.test(span.textContent.trim())) span.classList.remove('ph'); });
    setLeft(placeholders(page.current).length);
  };
  // One click on a field selects all of it, so that typing replaces it.
  const pick = event => {
    const span = event.target.closest?.('.ph');
    if (span) window.getSelection().selectAllChildren(span);
  };
  const apply = tool => {
    page.current.focus();
    if (tool.block) document.execCommand('formatBlock', false, tool.block);
    else document.execCommand(tool.command, false, null);
  };
  // + / − line in the table of benefits: the line where the cursor is is copied (fields included) or removed.
  const rowOfCursor = () => {
    const node = window.getSelection()?.anchorNode;
    const row = (node?.nodeType === 1 ? node : node?.parentElement)?.closest('tr');
    return row && page.current.contains(row) && row.closest('table')?.dataset.rows === 'editable' ? row : null;
  };
  const addRow = () => {
    const row = rowOfCursor();
    if (!row || row.querySelector('th') || row.children.length < 4) return setError('Placez d’abord le curseur dans une ligne de prestation du tableau.');
    const copy = row.cloneNode(true);
    copy.querySelectorAll('.ph').forEach(span => { span.textContent = span.textContent.replace(/ ?\d+(?=>>)/, '') ; });
    row.after(copy);
    setError('');
    typed();
  };
  const removeRow = () => {
    const row = rowOfCursor();
    const lines = [...row?.closest('tbody').querySelectorAll('tr')].filter(tr => tr.children.length >= 4 && !tr.querySelector('th'));
    if (!row || row.querySelector('th') || row.children.length < 4 || lines.length < 2) return setError('Placez le curseur dans une ligne de prestation (il en faut au moins une).');
    row.remove();
    setError('');
    typed();
  };

  const save = (content, name) => {
    const url = URL.createObjectURL(content);
    Object.assign(document.createElement('a'), { href: url, download: name }).click();
    URL.revokeObjectURL(url);
  };
  const filename = extension => `${title.trim() || 'Document'}.${extension}`.replace('/', '-');
  const download = async extension => {
    setError('');
    const blocks = toBlocks(page.current);
    if (!plainText(blocks).trim()) return setError('Écrivez d’abord quelque chose dans la page.');
    if (left && !window.confirm(`Il reste ${left} champ${left > 1 ? 's' : ''} « <<…>> » à remplir. Télécharger quand même ?`)) return;
    if (extension === 'txt') return save(new Blob([plainText(blocks)], { type: 'text/plain;charset=utf-8' }), filename('txt'));
    setBusy(extension);
    try {
      const template = templates[start];
      const response = await fetch(`/api/editeur/${extension}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, letterhead: template.letterhead, logo: template.logo, blocks }) }).catch(() => null);
      if (!response) throw new Error('Le serveur est injoignable. Réessayez dans un instant.');
      if (!response.ok) throw new Error('Le téléchargement a échoué. Le document est peut-être trop long.');
      save(await response.blob(), filename(extension));
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy('');
    }
  };

  return <div className="editor">
    <div className="editor-top">
      <div className="doc-tabs" role="group" aria-label="Type de document">{Object.entries(templates).map(([key, template]) => <button key={key} type="button" aria-pressed={start === key} className={`doc-tab${start === key ? ' active' : ''}`} onClick={() => choose(key)}>{template.label}</button>)}</div>
      <label className="field"><span>Nom du fichier</span><input value={title} onChange={event => setTitle(event.target.value)} placeholder="Document" maxLength={80} /></label>
    </div>
    {start !== 'blank' && <p className="doc-note">Cliquez sur un champ <mark className="ph">&lt;&lt;…&gt;&gt;</mark> pour le sélectionner, puis écrivez à sa place.{left ? ` Il reste ${left} champ${left > 1 ? 's' : ''} à remplir.` : ' Tous les champs sont remplis.'}</p>}
    <div className="editor-tools" role="toolbar" aria-label="Mise en forme">
      {tools.map(tool => <button key={tool.title} type="button" title={tool.title} aria-label={tool.title} className={`editor-tool ${tool.className || ''}`} onMouseDown={event => event.preventDefault()} onClick={() => apply(tool)}>{tool.label}</button>)}
      {start !== 'blank' && <>
        <button type="button" className="editor-tool" title="Ajouter une ligne de prestation" onMouseDown={event => event.preventDefault()} onClick={addRow}>+ Prestation</button>
        <button type="button" className="editor-tool" title="Retirer la ligne de prestation" onMouseDown={event => event.preventDefault()} onClick={removeRow}>− Prestation</button>
      </>}
    </div>
    <div ref={page} className="editor-page" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="Page du document" spellCheck lang="fr" onInput={typed} onClick={pick} />
    {error && <p className="doc-error" role="alert">{error}</p>}
    <div className="doc-actions">
      <button type="button" className="button button-dark" disabled={!!busy} onClick={() => download('docx')}><Icon name="file" size={16} />{busy === 'docx' ? 'Préparation…' : 'Télécharger en Word'}</button>
      <button type="button" className="button button-quiet" disabled={!!busy} onClick={() => download('pdf')}><Icon name="file" size={16} />{busy === 'pdf' ? 'Préparation…' : 'Télécharger en PDF'}</button>
      <button type="button" className="button button-quiet" disabled={!!busy} onClick={() => download('txt')}>Texte simple (.txt)</button>
      <button type="button" className="button button-quiet" disabled={!!busy} onClick={() => load(start)}>Recommencer</button>
    </div>
  </div>;
}
