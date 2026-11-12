// L'aperçu du devis ou de la facture, tel qu'il sera dans le fichier : il se met à jour pendant qu'on écrit.
const euros = amount => amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
const frDate = iso => (iso ? iso.split('-').reverse().join('/') : '');

export default function DocPreview({ kind, doc, total, deposit }) {
  const due = total - deposit;
  const title = kind === 'devis' ? 'DEVIS' : 'FACTURE';
  const lines = doc.lines.filter(line => line.designation.trim() || line.lineTotal);
  return <div className="doc-paper" aria-label="Aperçu du document">
    <div className="paper-head">
      <img src="/foto/logo-fond-violet.png" alt="Chez Marthe" />
      <div className="paper-title"><strong>{title} n° {doc.number || '…'}</strong><span>Date : {frDate(doc.date)}</span></div>
    </div>
    <div className="paper-parties">
      <div><b>Association Chez Marthe</b><br />50, rue Saint Savournin<br />13001 Marseille<br />contact.chezmarthe@gmail.com<br />SIRET : 100 396 464 00016</div>
      <div className="paper-client">{doc.name ? <b>{doc.name}</b> : <i>Nom du client</i>}<br />{doc.address}<br />{`${doc.postal_code} ${doc.city}`.trim()}</div>
    </div>
    <table className="paper-table"><thead><tr><th>Désignation</th><th>Qté</th><th>Prix unit. HT</th><th>Total</th></tr></thead><tbody>
      {doc.nature && <tr><td colSpan="4" className="paper-nature">{doc.nature}</td></tr>}
      {lines.length ? lines.map(line => <tr key={line.id}><td>{line.designation || '—'}</td><td>{line.quantity}</td><td>{euros(line.price)}</td><td>{euros(line.lineTotal)}</td></tr>) : <tr><td colSpan="4" className="paper-empty">Cliquez sur un tarif pour ajouter une prestation</td></tr>}
    </tbody></table>
    <div className="paper-totals">
      <div><span>Total hors taxe</span><b>{euros(total)}</b></div>
      {kind === 'facture' && <><div><span>Acompte versé</span><b>{euros(deposit)}</b></div><div><span>Total HT à payer</span><b>{euros(due)}</b></div></>}
      <div className="paper-final"><span>Total TTC en euros</span><b>{euros(kind === 'facture' ? due : total)}</b></div>
    </div>
    <p className="paper-vat">Tva non applicable, article 293 B du CGI</p>
    {kind === 'devis' && <div className="paper-sign">Acceptation de devis (date et signature)</div>}
    <p className="paper-pay"><b>{kind === 'devis' ? 'Modalité de paiement : par virement bancaire' : 'Paiement par virement'}</b><br />IBAN : FR76 1027 8089 7200 0220 7280 129 · BIC : CMCIFR2A</p>
    {kind === 'facture' && <p className="paper-terms">Conditions de paiement : paiement à réception de facture, à 30 jours. Aucun escompte consenti pour règlement anticipé. Tout incident de paiement est passible d’intérêt de retard. Indemnité forfaitaire pour frais de recouvrement : 40 €.</p>}
  </div>;
}
