import { useEffect, useState } from 'react';
import { toBody } from './accounting.js';
import { defaultGroups } from './priceList.js';

// Les appels au serveur (modeles.py) pour les devis et les factures.

async function call(path, options = {}) {
  const response = await fetch(`/api/modeles/${path}`, options.body ? { ...options, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(options.body) } : options).catch(() => null);
  if (!response) throw new Error('Le serveur est injoignable. Réessayez dans un instant.');
  if (!response.ok) {
    const detail = await response.json().then(data => (typeof data.detail === 'string' ? data.detail : ''), () => '');
    if (response.status === 422) throw new Error(detail && !detail.startsWith('[') ? detail : 'Vérifiez les champs : adresse e-mail, quantités et prix.');
    throw new Error(detail || 'L’opération a échoué.');
  }
  return response;
}

// Le numéro suivant de l'année, partagé par toute l'équipe (sans le prendre).
export const suggestNumber = async kind => (await (await call(`numeros/${kind}`)).json()).number;

// Prend le numéro suivant pour un nouveau document d'évènement.
export const takeNumber = async kind => (await (await call(`numeros/${kind}`, { method: 'POST', body: {} })).json()).number;

// Fabrique le Word ou le PDF et le fait télécharger (le serveur note le numéro comme utilisé).
export async function downloadDoc(kind, doc, extension) {
  const response = await call(`${kind}.${extension}`, { method: 'POST', body: toBody(kind, doc) });
  const url = URL.createObjectURL(await response.blob());
  Object.assign(document.createElement('a'), { href: url, download: `${kind === 'devis' ? 'Devis' : 'Facture'} ${doc.number}.${extension}`.replace('/', '-') }).click();
  URL.revokeObjectURL(url);
}

// Envoie le document en PDF au client, avec le texte de la page Messages. Erreur claire si l'envoi n'est pas branché.
export async function sendDoc(kind, doc, to, event) {
  const response = await call(`${kind}/envoyer`, { method: 'POST', body: { to, document: toBody(kind, doc), event: event?.title || '', event_date: event?.date || null } });
  return response.json();
}

async function prices(method, groups) {
  return (await call('tarifs', { method, body: groups ? { groups } : undefined })).json();
}

// Les tarifs à cliquer : ceux de l'équipe s'ils ont été changés, sinon ceux d'origine.
export function usePriceList() {
  const [groups, setGroups] = useState(defaultGroups);
  useEffect(() => { prices('GET').then(data => { if (data.groups) setGroups(data.groups); }).catch(() => {}); }, []);
  const save = async next => {
    try { setGroups((await prices('PUT', next)).groups); } catch (problem) {
      throw new Error(problem.message.startsWith('Vérifiez') ? 'Vérifiez les tarifs : chaque nom est obligatoire et chaque prix doit être un nombre positif.' : problem.message);
    }
  };
  const reset = async () => { await prices('DELETE'); setGroups(defaultGroups); };
  return { groups, save, reset };
}
