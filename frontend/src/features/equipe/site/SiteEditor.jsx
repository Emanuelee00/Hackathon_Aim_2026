import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../../app/store.jsx';
import Icon from '../../../shared/components/Icon.jsx';
import { PageIntro } from '../../../shared/components/Primitives.jsx';
import { spaceUrl } from '../../../shared/lib/spaces.js';
import { defaultSite, sectionAnchors, sectionOrder } from '../../public/landing/siteContent.js';
import RentalCards from './RentalCards.jsx';
import { SITE_PHOTOS, move, moveTo, shrinkPhoto } from './rentalCards.js';
import { SITE_SECTIONS, checkSection, cleanSection } from './schema.js';
import useDragSort from './useDragSort.js';
import usePointerSort from '../../../shared/lib/hooks/usePointerSort.js';
import './rentals.css';
import './site.css';

// « Site » : la page d'accueil section par section. Pour chacune : l'afficher ou la cacher, changer ses textes et ses photos,
// ajouter, ranger ou retirer les éléments de ses listes. « Enregistrer et publier » met la page à jour tout de suite.

async function call(method, body) {
  const response = await fetch('/api/site/contenu', body ? { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : { method }).catch(() => null);
  if (!response) throw new Error('Le serveur est injoignable. Réessayez dans un instant.');
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Vérifiez les champs de la section.');
  return data;
}

async function upload(file, logo) {
  const data = await shrinkPhoto(file, logo ? 600 : 1600, logo ? 'image/png' : 'image/jpeg');
  const response = await fetch('/api/espaces-a-louer/photos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) }).catch(() => null);
  const answer = await response?.json().catch(() => ({}));
  if (!response?.ok) throw new Error(typeof answer?.detail === 'string' ? answer.detail : 'La photo n’a pas pu être envoyée.');
  return answer.url;
}

function PhotoField({ field, value, onChange }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const logo = field.type === 'logo';
  const pick = async event => {
    const [file] = event.target.files;
    event.target.value = '';
    if (!file) return;
    setBusy(true); setError('');
    try { onChange(await upload(file, logo)); } catch (problem) { setError(problem.message); } finally { setBusy(false); }
  };
  return <div className={`site-photo${logo ? ' is-logo' : ''}`}>
    <span className="rental-label">{field.label}</span>
    <div className="site-photo-row">
      {value ? <img src={value} alt="" /> : <span className="site-photo-empty">Pas d’image</span>}
      <div>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pick} />
        <button type="button" className="button button-quiet button-small" disabled={busy} onClick={() => input.current.click()}><Icon name="download" size={15} />{busy ? 'Envoi…' : 'Choisir sur l’ordinateur'}</button>
        {!logo && <div className="rental-gallery" role="group" aria-label="Photos du site">{SITE_PHOTOS.map(photo => <button key={photo} type="button" aria-pressed={value === photo} aria-label={`Photo ${photo.slice(6)}`} onClick={() => onChange(photo)}><img src={photo} alt="" loading="lazy" /></button>)}</div>}
        {error && <p className="doc-error" role="alert">{error}</p>}
      </div>
    </div>
  </div>;
}

function ListField({ field, value = [], onChange }) {
  const [open, setOpen] = useState(null);
  const set = (index, item) => onChange(value.map((current, at) => (at === index ? item : current)));
  const sort = usePointerSort((from, to) => { onChange(moveTo(value, from, to)); setOpen(null); });
  return <fieldset className="site-list"><legend>{field.label}</legend>
    {value.length > 1 && <p className="site-drag-hint">Attrapez un élément et déplacez-le : les autres lui font de la place.</p>}
    {value.map((item, index) => <div key={index} className="site-item" {...sort.row(index)}>
      <div className="site-item-head">
        <span className="site-grip" title="Attraper pour déplacer" aria-hidden="true"><Icon name="grip" size={16} /></span>
        <button type="button" className="site-item-title" data-sort-grab aria-expanded={open === index} onClick={() => setOpen(open === index ? null : index)}>{item[field.titleKey] || `Sans titre (${field.itemLabel})`}<Icon name={open === index ? 'up' : 'down'} size={14} /></button>
        <button type="button" className="icon-button" aria-label="Monter" disabled={index === 0} onClick={() => { onChange(move(value, index, -1)); setOpen(null); }}><Icon name="up" size={15} /></button>
        <button type="button" className="icon-button" aria-label="Descendre" disabled={index === value.length - 1} onClick={() => { onChange(move(value, index, 1)); setOpen(null); }}><Icon name="down" size={15} /></button>
        <button type="button" className="icon-button rental-delete" aria-label={`Retirer ${item[field.titleKey] || field.itemLabel}`} onClick={() => { onChange(value.filter((_, at) => at !== index)); setOpen(null); }}><Icon name="trash" size={15} /></button>
      </div>
      {open === index && <div className="site-item-body"><Fields fields={field.fields} values={item} onChange={next => set(index, next)} /></div>}
    </div>)}
    <button type="button" className="text-link site-add" onClick={() => { onChange([...value, { ...field.blank }]); setOpen(value.length); }}><Icon name="plus" size={15} />Ajouter {field.itemLabel}</button>
  </fieldset>;
}

function Fields({ fields, values, onChange }) {
  const set = (key, value) => onChange({ ...values, [key]: value });
  return fields.map(field => {
    const value = values[field.key];
    if (field.type === 'photo' || field.type === 'logo') return <PhotoField key={field.key} field={field} value={value} onChange={next => set(field.key, next)} />;
    if (field.type === 'list') return <ListField key={field.key} field={field} value={value} onChange={next => set(field.key, next)} />;
    if (field.type === 'bool') return <label key={field.key} className="site-check"><input type="checkbox" checked={value !== false} onChange={event => set(field.key, event.target.checked)} /> {field.label}</label>;
    if (field.type === 'lines') return <label key={field.key} className="field"><span>{field.label}</span><textarea rows={4} value={(value || []).join('\n')} onChange={event => set(field.key, event.target.value.split('\n'))} /></label>;
    if (field.type === 'textarea') return <label key={field.key} className="field"><span>{field.label}</span><textarea rows={4} value={value || ''} onChange={event => set(field.key, event.target.value)} /></label>;
    return <label key={field.key} className="field"><span>{field.label}</span><input value={value || ''} onChange={event => set(field.key, event.target.value)} /></label>;
  });
}

export default function SiteEditor() {
  const { notify } = useStore();
  const [tab, setTab] = useState(() => { try { return sessionStorage.getItem('marthe-site-tab') || 'hero'; } catch { return 'hero'; } });
  const [saved, setSaved] = useState(null); // ce que l'équipe a enregistré (sections changées seulement)
  const [drafts, setDrafts] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/site').then(response => (response.ok ? response.json() : Promise.reject(new Error()))).then(data => setSaved(data.content || {}), () => { setSaved({}); setError('Le contenu du site n’a pas pu être chargé.'); });
  }, []);
  // Les onglets se font glisser : leur ordre est celui des sections sur la page d'accueil (publié tout de suite).
  const order = sectionOrder(saved);
  const tabs = useDragSort(async (from, to) => {
    const next = moveTo(order, from, to);
    if (await publish({ ...saved, order: next }, true)) notify('Nouvel ordre des sections publié sur le site.');
  });
  if (!saved) return <PageIntro eyebrow="ESPACE ÉQUIPE · SITE" title="Site" description="Chargement…" />;
  const section = SITE_SECTIONS.find(item => item.id === tab);
  const current = { ...defaultSite[tab], ...(saved[tab] || {}) };
  const draft = drafts[tab] || current;
  const changed = JSON.stringify(draft) !== JSON.stringify(current);
  const choose = id => { setTab(id); setError(''); try { sessionStorage.setItem('marthe-site-tab', id); } catch { /* pour cette visite */ } };
  const edit = next => setDrafts(all => ({ ...all, [tab]: next }));
  const publish = async (content, keepDraft = false) => {
    setBusy(true); setError('');
    try {
      const data = await call(Object.keys(content).length ? 'PUT' : 'DELETE', Object.keys(content).length ? { content } : undefined);
      setSaved(data.content || {});
      if (!keepDraft) setDrafts(all => { const next = { ...all }; delete next[tab]; return next; });
      return true;
    } catch (problem) { setError(problem.message); return false; } finally { setBusy(false); }
  };
  const moveSection = async step => {
    const next = move(order, order.indexOf(tab), step);
    if (await publish({ ...saved, order: next }, true)) notify('Nouvel ordre des sections publié sur le site.');
  };
  const resetOrder = async () => {
    const next = { ...saved };
    delete next.order;
    if (await publish(next, true)) notify('Les sections ont retrouvé leur ordre d’origine.');
  };
  const save = async () => {
    const problem = checkSection(section, draft);
    if (problem) return setError(problem);
    if (await publish({ ...saved, [tab]: cleanSection(section, draft) })) notify(`« ${section.label} » est publiée sur le site.`);
  };
  const restore = async () => {
    const next = { ...saved };
    delete next[tab];
    if (await publish(next)) notify(`« ${section.label} » a retrouvé son contenu d’origine.`);
  };
  const anchor = sectionAnchors[tab] ? `#${sectionAnchors[tab]}` : '';
  return <>
    <PageIntro eyebrow="ESPACE ÉQUIPE · SITE" title="Site" description="La page d’accueil, section par section : textes, photos, listes, et les sections à afficher ou à cacher. Chaque enregistrement est publié tout de suite.">
      <div className="funding-actions"><a className="button button-quiet button-small" href={`${spaceUrl(null)}${anchor}`} target="_blank" rel="noreferrer"><Icon name="diagonal" size={15} />Voir sur le site</a></div>
    </PageIntro>
    <p className="site-drag-hint">Faites glisser les onglets pour changer l’ordre des sections sur la page d’accueil.{saved.order && <> <button type="button" className="text-link" disabled={busy} onClick={resetOrder}>Remettre l’ordre d’origine</button></>}</p>
    <div className="doc-tabs site-tabs" role="tablist">{order.map(id => SITE_SECTIONS.find(item => item.id === id)).map((item, index) => <button key={item.id} type="button" role="tab" data-drag={tabs.state(index)} {...tabs.handle(index)} {...tabs.target(index)} aria-selected={tab === item.id} className={`doc-tab${tab === item.id ? ' active' : ''}${({ ...defaultSite[item.id], ...(saved[item.id] || {}) }).visible === false ? ' is-hidden' : ''}`} onClick={() => choose(item.id)}>
      {item.label}{drafts[item.id] && JSON.stringify(drafts[item.id]) !== JSON.stringify({ ...defaultSite[item.id], ...(saved[item.id] || {}) }) ? ' •' : ''}
    </button>)}</div>
    <section className="panel site-panel">
      <p className="funding-hint">{section.hint}</p>
      <div className="site-visible-row">
        <label className="site-check site-visible"><input type="checkbox" checked={draft.visible !== false} onChange={event => edit({ ...draft, visible: event.target.checked })} /> Afficher cette section sur le site</label>
        <span className="site-move">Place sur la page : {order.indexOf(tab) + 1} / {order.length}
          <button type="button" className="icon-button" aria-label="Placer la section plus haut sur la page" disabled={busy || order.indexOf(tab) === 0} onClick={() => moveSection(-1)}><Icon name="left" size={15} /></button>
          <button type="button" className="icon-button" aria-label="Placer la section plus bas sur la page" disabled={busy || order.indexOf(tab) === order.length - 1} onClick={() => moveSection(1)}><Icon name="right" size={15} /></button>
        </span>
      </div>
      <div className="site-fields"><Fields fields={section.fields} values={draft} onChange={edit} /></div>
      {error && <p className="doc-error" role="alert">{error}</p>}
      <div className="rental-actions">
        <button type="button" className="button button-dark" disabled={busy || !changed} onClick={save}>{busy ? 'Publication…' : 'Enregistrer et publier'}</button>
        {changed && <button type="button" className="button button-quiet" onClick={() => setDrafts(all => { const next = { ...all }; delete next[tab]; return next; })}>Annuler mes changements</button>}
        {saved[tab] && <button type="button" className="text-link" disabled={busy} onClick={restore}>Revenir au contenu d’origine</button>}
      </div>
    </section>
    {tab === 'spaces' && <div className="site-cards"><RentalCards embedded /></div>}
  </>;
}
