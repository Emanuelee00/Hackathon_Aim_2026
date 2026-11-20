// « Site » › « Louer un espace » : passer d'une carte au formulaire de l'équipe et inversement (logique sans affichage, testée).

export const SITE_PHOTOS = ['chapelle.jpg', 'salon.jpg', 'bureau.jpg', 'atelier.jpg', 'coworking.jpg', 'cantine.webp', 'jardin.webp', 'cour.jpg', 'facade.webp', 'sororite.webp', 'bienvenue.jpg', 'mur-des-mots.jpg', 'panneaux.webp']
  .map(name => `/foto/${name}`);
export const FOCUS = [['center 20%', 'Haut de la photo'], ['center 50%', 'Milieu'], ['center 80%', 'Bas de la photo']];

const slug = text => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'espace';

// Une carte → les champs du formulaire (lignes et tarifs en texte, une ligne chacun).
export const toForm = card => ({
  id: card.id, name: card.name, photo: card.photo, focus: card.focus || 'center 50%',
  details: (card.details || []).join('\n'),
  prices: (card.prices || []).map(([label, amount]) => `${label} : ${amount}`).join('\n'),
  note: card.note || '', exchange: card.exchange || '',
  button: card.link ? 'link' : card.space ? 'form' : 'contact',
  space: card.space || '', linkUrl: card.link?.url || '', linkLabel: card.link?.label || 'Découvrir',
});

export const blankForm = () => ({ ...toForm({ id: '', name: '', photo: '/foto/facade.webp', details: [], prices: [] }), button: 'contact' });

// Le formulaire → une carte, ou une erreur à afficher.
export function fromForm(form, others) {
  const name = form.name.trim();
  if (!name) return { error: 'Donnez un nom à l’espace.' };
  const lines = text => text.split('\n').map(line => line.trim()).filter(Boolean);
  const prices = lines(form.prices).map(line => {
    const at = line.lastIndexOf(':');
    return at > 0 ? [line.slice(0, at).trim(), line.slice(at + 1).trim()] : [line, ''];
  });
  if (prices.some(([label, amount]) => !label || !amount)) return { error: 'Écrivez chaque tarif sur une ligne, sous la forme « Journée : 300 € ».' };
  if (form.button === 'link' && !/^https?:\/\/\S+$/.test(form.linkUrl.trim())) return { error: 'L’adresse du lien doit commencer par https://' };
  if (form.button === 'form' && !form.space) return { error: 'Choisissez l’espace du formulaire de demande.' };
  let id = form.id || slug(name);
  const taken = new Set(others.map(card => card.id));
  for (let n = 2; !form.id && taken.has(id); n += 1) id = `${slug(name)}-${n}`;
  return {
    card: {
      id, name, photo: form.photo, focus: form.focus, details: lines(form.details), prices, note: form.note.trim(), exchange: form.exchange.trim(),
      link: form.button === 'link' ? { url: form.linkUrl.trim(), label: form.linkLabel.trim() || 'Découvrir' } : null,
      space: form.button === 'form' ? form.space : '',
    },
  };
}

// Déplace l'élément `from` à la place de `to` (les autres glissent d'un cran).
export function moveTo(list, from, to) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export const move = (cards, index, step) => {
  const target = index + step;
  if (target < 0 || target >= cards.length) return cards;
  const next = [...cards];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

// Réduit une photo choisie sur l'ordinateur (1600 px au plus, JPEG ; PNG pour les logos, qui gardent leur transparence) avant de l'envoyer.
export function shrinkPhoto(file, max = 1600, type = 'image/jpeg') {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = Object.assign(document.createElement('canvas'), { width: Math.round(image.width * scale), height: Math.round(image.height * scale) });
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(image.src);
      resolve(canvas.toDataURL(type, 0.82));
    };
    image.onerror = () => reject(new Error('Cette image n’a pas pu être lue.'));
    image.src = URL.createObjectURL(file);
  });
}
