import { useRef, useState } from 'react';
import Icon from '../../shared/components/Icon.jsx';
import StickyScrollbar from '../../shared/components/StickyScrollbar.jsx';
import Modal from '../../shared/components/Modal.jsx';
import { adviceFor } from './advice.js';
import { MARKED_BY_HAND, fundingStatus, toggleFunding } from './fundingMatches.js';
import { rowColors } from '../funding/funding.js';
import { Heading, Popover, Swatches } from '../funding/components/TableMenus.jsx';
import useTableLayout from '../funding/useTableLayout.js';
import { totalWidth } from '../funding/tableMath.js';
import { EU_STATES, FITS, PATRON_TYPES, STATUSES, filterOptions, filterRows, sortRows, tone } from './sheets.js';

// Un tableau comme dans Excel : on clique une cellule pour l'écrire, la modification est enregistrée en la quittant.
// Mêmes outils que le tableau des financements : colonnes à glisser, à élargir, à trier, à colorer ; lignes colorées.

function TextCell({ value, label, onSave, strong = false }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return <textarea autoFocus className="sheet-edit" defaultValue={value} aria-label={label} rows={Math.min(10, Math.max(3, Math.ceil(value.length / 32)))}
      onBlur={event => { setEditing(false); const next = event.target.value.trim(); if (next !== value) onSave(next); }}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.target.value = value; event.target.blur(); }
        if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.target.blur(); }
      }} />;
  }
  return <button type="button" className={`sheet-text${strong ? ' sheet-strong' : ''}`} title={value || undefined} aria-label={`${label} : ${value || 'vide'}. Modifier`} onClick={() => setEditing(true)}>
    {value || <span className="sheet-empty">—</span>}
  </button>;
}

// Statut ou adéquation : une pastille de couleur avec un menu de toutes les valeurs ; « Autre » permet d'écrire la sienne.
// (Pas de liste de suggestions du navigateur : elle ne montrait que les valeurs proches de celle déjà choisie.)
const OTHER = '\u0000autre';
function ChoiceCell({ value, label, options, onSave }) {
  const [writing, setWriting] = useState(false);
  if (writing) {
    return <span className="sheet-pill tone-none">
      <input autoFocus className="funding-cell" defaultValue={value} aria-label={label} placeholder="Écrire puis Entrée"
        onBlur={event => { setWriting(false); const next = event.target.value.trim(); if (next !== value) onSave(next); }}
        onKeyDown={event => { if (event.key === 'Enter') event.target.blur(); if (event.key === 'Escape') { event.target.value = value; event.target.blur(); } }} />
    </span>;
  }
  return <span className={`sheet-pill tone-${tone(value)}`}>
    <select className="funding-cell sheet-choice" value={value} aria-label={label} title={value || undefined}
      onChange={event => { if (event.target.value === OTHER) setWriting(true); else onSave(event.target.value); }}>
      <option value="">—</option>
      {value && !options.includes(value) && <option value={value}>{value}</option>}
      {options.map(option => <option key={option} value={option}>{option}</option>)}
      <option value={OTHER}>Autre (écrire)…</option>
    </select>
  </span>;
}

function DateCell({ value, label, onSave }) {
  return <input key={value} type="date" className="funding-cell" defaultValue={value} aria-label={label}
    onBlur={event => { if (event.target.value !== value) onSave(event.target.value); }} onKeyDown={event => { if (event.key === 'Enter') event.target.blur(); }} />;
}

function LinkCell({ value, label, onSave }) {
  const url = (value.match(/https?:\/\/\S+/) || [])[0] || '';
  return <span className="sheet-link">
    <TextCell value={value} label={label} onSave={onSave} />
    {url && <a href={url} target="_blank" rel="noreferrer" className="icon-button" aria-label={`Ouvrir ${url}`} title="Ouvrir le site"><Icon name="diagonal" size={15} /></a>}
  </span>;
}

// Une adresse e-mail (ou « Non trouvé ») : modifiable comme le reste ; l'enveloppe ouvre la messagerie.
function EmailCell({ value, label, onSave }) {
  const address = (value.match(/[^\s@()·,;]+@[^\s@()·,;]+\.[a-z]{2,}/i) || [])[0];
  return <span className="sheet-link">
    <TextCell value={value} label={label} onSave={onSave} />
    {address && <a href={`mailto:${address}`} className="icon-button" aria-label={`Écrire à ${address}`} title={`Écrire à ${address}`}><Icon name="mail" size={15} /></a>}
  </span>;
}

// « Conseils » : le début dans la cellule ; le texte entier s'ouvre dans une fenêtre au-dessus du tableau, où on peut le réécrire.
function AdviceCell({ row, sheet, onSave }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const text = adviceFor(sheet.id, row);
  const name = row.name || row.part || '';
  const close = () => { setOpen(false); setEditing(false); };
  return <>
    <button type="button" className="sheet-text sheet-advice" aria-label={`Lire le conseil pour ${name}`} onClick={() => setOpen(true)}>
      {text.split('\n')[0]}<span className="sheet-advice-more">Lire le conseil</span>
    </button>
    {open && <Modal title={name} subtitle="CONSEILS POUR LA DEMANDE" onClose={close} wide>
      {editing
        ? <form className="advice-form" onSubmit={event => { event.preventDefault(); onSave(event.target.elements.advice.value.trim()); setEditing(false); }}>
          <textarea name="advice" defaultValue={text} rows={14} aria-label="Conseil" autoFocus />
          <div className="advice-actions"><button className="button button-dark button-small">Enregistrer</button>
            <button type="button" className="button button-quiet button-small" onClick={() => setEditing(false)}>Annuler</button>
            {row.advice && <button type="button" className="text-link" onClick={() => { onSave(''); setEditing(false); }}>Revenir au conseil proposé</button>}</div>
        </form>
        : <><div className="advice-text">{text.split('\n\n').map((part, index) => <p key={index}>{part}</p>)}</div>
          <div className="advice-actions"><button type="button" className="button button-quiet button-small" onClick={() => setEditing(true)}><Icon name="edit" size={15} />Modifier le conseil</button>
            <button type="button" className="button button-dark button-small" onClick={close}>Fermer</button></div></>}
    </Modal>}
  </>;
}

function RemoveButton({ row, sheet, onRemove }) {
  const name = row.name || row.part || `${sheet.item} sans nom`;
  return <Popover label={`Supprimer ${name}`} icon="trash" up danger>{close => <div className="funding-remove">
    <p><b>Supprimer « {name} » ?</b> La ligne sera effacée du tableau.</p>
    <div><button type="button" className="button button-small funding-remove-yes" onClick={() => { close(); onRemove(row); }}>Oui, supprimer</button><button type="button" className="button button-quiet button-small" onClick={close}>Annuler</button></div>
  </div>}</Popover>;
}

function Row({ row, sheet, layout, labels, onSave, onRemove, onTrack, inFunding, onToggleFunding }) {
  const name = row.name || row.part || '';
  const cell = key => {
    const label = `${labels[key]} · ${name}`;
    const save = value => onSave({ ...row, [key]: value });
    const value = row[key] || '';
    const kind = sheet.kinds[key];
    if (kind === 'fit') return <ChoiceCell value={value} label={label} options={FITS} onSave={save} />;
    if (kind === 'status') return <ChoiceCell value={value} label={label} options={STATUSES} onSave={save} />;
    if (kind === 'advice') return <AdviceCell row={row} sheet={sheet} onSave={save} />;
    if (kind === 'ptype') return <ChoiceCell value={value} label={label} options={PATRON_TYPES} onSave={save} />;
    if (kind === 'state') return <ChoiceCell value={value} label={label} options={EU_STATES} onSave={save} />;
    if (kind === 'date') return <DateCell value={value} label={label} onSave={save} />;
    if (kind === 'email') return <EmailCell value={value} label={label} onSave={save} />;
    if (kind === 'link') return <LinkCell value={value} label={label} onSave={save} />;
    if (kind === 'title' && inFunding) return <><TextCell value={value} label={label} onSave={save} strong /><span className="sheet-in-funding" title={inFunding === MARKED_BY_HAND ? 'Indiqué à la main par l’équipe' : `Piste « ${inFunding} » dans Financements`}>Déjà dans Financements</span></>;
    return <TextCell value={value} label={label} onSave={save} strong={kind === 'title'} />;
  };
  const actions = <div className="funding-row-actions">
    <Popover label={`Couleur de la ligne ${name}`} icon="palette" up>{close => <Swatches value={row.color} onPick={color => { onSave({ ...row, color }); close(); }} />}</Popover>
    {onTrack && (row.trackedOn || inFunding
      ? <span className="sheet-tracked" title={inFunding ? `Déjà dans Financements : « ${inFunding} »` : `Passé dans le suivi des financements le ${row.trackedOn}`}><Icon name="check" size={15} /></span>
      : <button type="button" className="icon-button" aria-label={`Demander un financement à ${name} : ajouter au suivi des financements`} title="Demander un financement : ajouter au suivi des financements" onClick={() => onTrack(row)}><Icon name="send" size={15} /></button>)}
    {sheet.id !== 'strategy' && <button type="button" className={`icon-button sheet-funding-toggle${inFunding ? ' is-on' : ''}`} aria-pressed={Boolean(inFunding)}
      aria-label={inFunding ? `${name} : n’est pas dans Financements (retirer le rouge)` : `${name} : marquer « déjà dans Financements »`}
      title={inFunding ? 'Retirer « déjà dans Financements »' : 'Marquer « déjà dans Financements »'} onClick={onToggleFunding}><Icon name="euro" size={15} /></button>}
    <RemoveButton row={row} sheet={sheet} onRemove={onRemove} />
  </div>;
  // Déjà dans « Financements » : toute la ligne en rouge, avant toute autre couleur.
  const background = column => (inFunding ? IN_FUNDING_RED : rowColors[row.color]?.value || rowColors[layout.colors[column]]?.value);
  return <tr className={inFunding ? 'sheet-row-in-funding' : undefined}>{layout.order.map((column, index) => <td key={column} className={`${column === 'card' ? 'funding-actions-cell' : ''}${index === 0 ? ' sheet-sticky' : ''}`} style={{ background: background(column) }}>
    {column === 'card' ? actions : cell(column)}
  </td>)}</tr>;
}

const IN_FUNDING_RED = 'var(--in-funding, #f8c4c4)';

export default function SheetTable({ sheet, rows, onChange, onTrack, fundingAuto = () => '' }) {
  const fundingOf = row => fundingStatus(row, fundingAuto);
  const [query, setQuery] = useState('');
  const [chosen, setChosen] = useState({});
  const [dragging, setDragging] = useState(null);
  const [target, setTarget] = useState(null);
  const slot = useRef(null);
  const scroller = useRef(null);
  const layout = useTableLayout(slot, { storageKey: sheet.layoutKey, columns: sheet.columns, fixed: ['card', ...Object.keys(sheet.kinds).filter(key => sheet.kinds[key] === 'date')], sortable: sheet.sortable, fit: false });
  const labels = Object.fromEntries(sheet.columns);
  const drag = { dragging, target, setDragging, setTarget, end: () => { setDragging(null); setTarget(null); } };
  // « Les masquer » : les lignes déjà dans Financements disparaissent du tableau (le choix vaut pour toute la visite).
  const [hideFunding, setHideFundingState] = useState(() => { try { return sessionStorage.getItem('marthe-hide-in-funding') === '1'; } catch { return false; } });
  const setHideFunding = value => { setHideFundingState(value); try { sessionStorage.setItem('marthe-hide-in-funding', value ? '1' : ''); } catch { /* pour cette page */ } };
  const visible = sortRows(filterRows(rows, sheet, query, chosen).filter(row => !hideFunding || !fundingOf(row)), layout.sort);
  const save = row => onChange(rows.map(item => (item.id === row.id ? row : item)));
  const remove = row => onChange(rows.filter(item => item.id !== row.id));
  const add = () => { setQuery(''); setChosen({}); onChange([sheet.blank(), ...rows]); };
  const filtered = query.trim() || Object.values(chosen).some(Boolean) || (hideFunding && rows.some(row => fundingOf(row)));
  const inFundingCount = rows.filter(row => fundingOf(row)).length;
  return <div className="funding-table-slot" ref={slot}><section className="panel funding-table-panel sheet-panel">
    <div className="funding-tools"><h3>{sheet.title}</h3>
      <span className="funding-muted">{filtered ? `${visible.length} sur ${rows.length}` : `${rows.length} lignes`}</span>
      {inFundingCount > 0 && <span className="sheet-in-funding-tools">
        <span className="sheet-in-funding" title="Ces lignes sont déjà des pistes du tableau de bord « Financements » : elles restent ici pour leurs informations en plus.">{inFundingCount} déjà dans Financements</span>
        <label className="sheet-hide-funding"><input type="checkbox" checked={hideFunding} onChange={event => setHideFunding(event.target.checked)} /> Les masquer</label>
      </span>}
      {sheet.filters.map(([key, all]) => <select key={key} className="sheet-filter" aria-label={all} value={chosen[key] || ''} onChange={event => setChosen(current => ({ ...current, [key]: event.target.value }))}>
        <option value="">{all}</option>{filterOptions(rows, key).map(option => <option key={option} value={option}>{option}</option>)}
      </select>)}
      <label className="funding-search"><Icon name="search" size={16} /><span className="sr-only">Rechercher</span><input type="search" placeholder="Rechercher…" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <button type="button" className="button button-dark button-small" onClick={add}><Icon name="plus" size={16} />Ajouter un {sheet.item}</button>
    </div>
    <div className="funding-table-scroll" ref={scroller}><table className="funding-table sheet-table" style={{ width: totalWidth(layout.widths) }}>
      <colgroup>{layout.order.map(key => <col key={key} style={{ width: layout.widths[key] }} />)}</colgroup>
      <thead><tr>{layout.order.map((key, index) => <Heading key={key} column={key} label={labels[key]} layout={layout} drag={drag} sticky={index === 0} />)}</tr></thead>
      <tbody>{visible.map(row => <Row key={row.id} row={row} sheet={sheet} layout={layout} labels={labels} onSave={save} onRemove={remove} onTrack={onTrack} inFunding={fundingOf(row)} onToggleFunding={() => save(toggleFunding(row, fundingAuto))} />)}</tbody>
    </table></div>
    <StickyScrollbar target={scroller} />
    {!visible.length && <p className="funding-muted funding-none">Aucune ligne ne correspond.</p>}
    <p className="funding-hint">Cliquez une cellule pour l’écrire (Entrée pour valider, Maj+Entrée pour aller à la ligne, Échap pour annuler) : tout est enregistré pour l’équipe. Glissez un titre pour déplacer sa colonne, son bord pour l’élargir ; les flèches trient, « ⋯ » colore la colonne. Le tableau défile sur le côté ; la première colonne reste visible.{layout.custom && <> <button type="button" className="text-link" onClick={layout.reset}>Largeurs et ordre par défaut</button></>}</p>
  </section></div>;
}
