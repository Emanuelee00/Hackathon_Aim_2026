// The starting documents of the editor: the association's quote and invoice, with the fields to fill in written « <<…>> » and highlighted.
// A field is selected with one click, then typed over. The text of the association (address, SIRET, IBAN, conditions) is already there.
const field = text => `<span class="ph">&lt;&lt;${text}&gt;&gt;</span>`;
const today = () => new Date().toLocaleDateString('fr-FR');
const grey = 'data-shade="grey"';

const header = (title, numberField) => `
  <table data-borders="none" data-widths="55,45"><tbody><tr>
    <td><b>Association Chez Marthe</b><br>50, rue Saint Savournin<br>13001 Marseille<br>contact.chezmarthe@gmail.com<br>SIRET : 100 396 464 00016</td>
    <td style="text-align:right"><b>${title} n° </b>${field(numberField)}<br>Date : ${today()}<br><br>${field('Nom')}<br>${field('Adresse')}<br>${field('Code postal')} ${field('Ville')}</td>
  </tr></tbody></table>
  <p><br></p>`;

const items = `
  <table data-widths="44,14,21,21" data-rows="editable"><tbody>
    <tr><th>Désignation</th><th>Quantité</th><th>Prix unit HT</th><th>Total</th></tr>
    <tr><td colspan="4">${field('Nature prestation')}</td></tr>
    <tr><td>${field('Prestation 1')}</td><td style="text-align:center">${field('Qté 1')}</td><td style="text-align:right">${field('Prix unit. 1')}</td><td style="text-align:right">${field('Total 1')}</td></tr>
  </tbody></table>
  <p><br></p>`;

const vat = '<p style="text-align:right">Tva non applicable, article 293 B du CGI</p>';

const quote = `${header('DEVIS', 'N° DE')}${items}
  <table data-borders="none" data-widths="52,26,22"><tbody>
    <tr><td></td><td ${grey}>Total Hors Taxe</td><td style="text-align:right">${field('Total HT')}</td></tr>
    <tr><td></td><td ${grey}><b>Total TTC en euros</b></td><td style="text-align:right"><b>${field('Total HT')}</b></td></tr>
  </tbody></table>
  ${vat}<p><br></p>
  <table data-widths="50,50"><tbody><tr><td>Acceptation de devis (date et signature)<br><br><br><br><br></td></tr></tbody></table>
  <p><br></p><p><b>Modalité de paiement :</b> par virement bancaire<br>IBAN : FR76 1027 8089 7200 0220 7280 129<br>BIC : CMCIFR2A</p>`;

const invoice = `${header('FACTURE', 'N° FA')}${items}
  <table data-borders="none" data-widths="52,26,22"><tbody>
    <tr><td></td><td ${grey}>Total Hors Taxe</td><td style="text-align:right">${field('Total HT')}</td></tr>
    <tr><td></td><td ${grey}>Acompte versé</td><td style="text-align:right">${field('Acompte versé')}</td></tr>
    <tr><td></td><td ${grey}>Total HT à payer</td><td style="text-align:right">${field('Total HT à payer')}</td></tr>
    <tr><td></td><td ${grey}><b>Total TTC en euros</b></td><td style="text-align:right"><b>${field('Total HT à payer')}</b></td></tr>
  </tbody></table>
  ${vat}<p><br></p><p><b>Paiement par virement</b><br>IBAN : FR76 1027 8089 7200 0220 7280 129<br>BIC : CMCIFR2A</p>
  <p style="font-size:12px"><b>Conditions de paiement :</b> paiement à réception de facture, à 30 jours. Aucun escompte consenti pour règlement anticipé. Tout incident de paiement est passible d’intérêt de retard. Le montant des pénalités résulte de l’application aux sommes restant dues d’un taux d’intérêt légal en vigueur au moment de l’incident. Indemnité forfaitaire pour frais de recouvrement due au créancier en cas de retard de paiement : 40 €</p>`;

export const templates = {
  devis: { label: 'Devis', html: quote, title: 'Devis', logo: true, letterhead: false },
  facture: { label: 'Facture', html: invoice, title: 'Facture', logo: true, letterhead: false },
  blank: { label: 'Page blanche', html: '<p><br></p>', title: '', logo: false, letterhead: true },
};
