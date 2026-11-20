// La comptabilité d'un évènement : son devis, puis sa facture une fois le devis accepté.
// Les deux documents sont gardés dans l'évènement (event.accounting = { quote, invoice }) ; ils ne sont lus que par l'équipe
// (les autres espaces reçoivent les évènements sans ce champ, voir sharing/events.py).
// Un document = { doc, status, … } où doc a la forme de DocBuilder : numéro, date, client, lignes, acompte.

export const toNumber = text => Number(String(text ?? '').replace(',', '.')) || 0;
export const euros = amount => amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
export const today = () => new Date().toISOString().slice(0, 10);
export const frDate = iso => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '');
let counter = 0;
export const newId = () => `l${Date.now()}-${counter++}`;

export const blankDoc = (number = '') => ({ number, date: today(), name: '', address: '', postal_code: '', city: '', nature: '', lines: [], deposit: '' });

// Les lignes avec leur total, et les totaux du document (en centimes pour ne pas perdre d'argent en route).
export function docTotals(kind, doc) {
  const lines = doc.lines.map(line => {
    const quantity = toNumber(line.quantity);
    const price = toNumber(line.unit_price);
    return { ...line, price, lineTotal: Math.round(quantity * price * 100) / 100 };
  });
  const total = Math.round(lines.reduce((sum, line) => sum + line.lineTotal * 100, 0)) / 100;
  const deposit = kind === 'facture' ? toNumber(doc.deposit) : 0;
  return { lines, total, deposit, due: Math.round((total - deposit) * 100) / 100 };
}

// Ce qu'il manque pour fabriquer le fichier, ou '' si tout va bien.
export function checkDoc(kind, doc) {
  if (!String(doc.number).trim() || !doc.name.trim()) return `Indiquez le numéro ${kind === 'devis' ? 'du devis' : 'de la facture'} et le nom du client.`;
  if (!doc.lines.some(line => line.designation.trim())) return 'Ajoutez au moins une prestation : cliquez sur un tarif.';
  return '';
}

// Le corps envoyé au serveur (modeles.py) pour le Word, le PDF ou l'e-mail.
export function toBody(kind, doc) {
  const { lines, deposit } = docTotals(kind, doc);
  return {
    number: String(doc.number).trim(), date: doc.date, name: doc.name, address: doc.address, postal_code: doc.postal_code, city: doc.city, nature: doc.nature, deposit,
    lines: lines.filter(line => line.designation.trim()).map(line => ({ designation: line.designation, quantity: toNumber(line.quantity), unit_price: line.price })),
  };
}

// Le premier devis d'un évènement : le client est l'organisateur, la nature dit quoi, où et quand.
export function quoteFromEvent(event, number, spaceName = '', when = '') {
  const what = [event.title, spaceName].filter(Boolean).join(' — ');
  return { ...blankDoc(number), name: event.organizer || '', nature: [what, when].filter(Boolean).join(', ') };
}

// La facture reprend le devis accepté : mêmes client, nature et prestations ; nouveau numéro, date du jour.
export function invoiceFromQuote(quoteDoc, number) {
  return { ...quoteDoc, number, date: today(), deposit: '', lines: quoteDoc.lines.map(line => ({ ...line, id: newId() })) };
}

export const quoteStatuses = { draft: 'Brouillon', sent: 'Envoyé', accepted: 'Accepté' };
export const invoiceStatuses = { draft: 'Brouillon', sent: 'Envoyée', issued: 'Émise' };

// Une phrase sur où en est le document, pour la fiche de l'évènement et le suivi.
export function describe(kind, entry) {
  if (!entry) return kind === 'devis' ? 'Pas encore de devis' : 'Pas encore de facture';
  const { total, due } = docTotals(kind, entry.doc);
  const amount = euros(kind === 'facture' ? due : total);
  const label = kind === 'devis' ? 'Devis' : 'Facture';
  if (entry.status === 'accepted') return `${label} n° ${entry.doc.number} · ${amount} · accepté par ${entry.acceptedBy} le ${frDate(entry.acceptedAt)}`;
  if (entry.status === 'sent') return `${label} n° ${entry.doc.number} · ${amount} · ${kind === 'devis' ? 'envoyé' : 'envoyée'} à ${entry.sentTo} le ${frDate(entry.sentAt)}`;
  if (entry.status === 'issued') return `${label} n° ${entry.doc.number} · ${amount} · émise le ${frDate(entry.issuedAt)}`;
  return `${label} n° ${entry.doc.number} · ${amount} · brouillon`;
}

// Ce qu'on ne modifie plus : le devis accepté (on peut le rouvrir tant qu'il n'y a pas de facture), la facture envoyée ou émise.
// Un devis envoyé reste modifiable : il redevient un brouillon, à renvoyer.
export const locked = (kind, entry) => (kind === 'devis' ? entry?.status === 'accepted' : ['sent', 'issued'].includes(entry?.status));

// Le devis d'une location doit être accepté avant de confirmer la demande (voir workflow.js).
export const quoteBlocks = event => Boolean(event.accounting?.quote && event.accounting.quote.status !== 'accepted');
