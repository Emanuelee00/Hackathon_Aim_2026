// Formulaires de la page : mêmes règles et même envoi que le nouveau site (web/src/features/public-request
// et site-pages/Contact.jsx). Ils écrivent dans /api/requests et /api/contact : ils marchent une fois la page
// servie par le serveur Chez Marthe ; en local (serveur statique) ils affichent un message clair.

// Espaces proposés à la location. Les identifiants sont ceux attendus par le serveur
// (« reunion » = le Bureau). Tarifs : fiche des espaces.
const SPACES = {
  chapelle: { name: 'La Chapelle', capacity: 90, rate: 20, prices: { '2h': 40, half: 100, day: 200, weekly: 30 } },
  'salon-collectif': { name: 'Le Salon collectif', capacity: 15, rate: 20, prices: { half: 80, day: 150 } },
  reunion: { name: 'Le Bureau', capacity: 8, rate: null },
  atelier: { name: 'L’Atelier', capacity: 24, exchange: true },
};
const DURATIONS = { '2h': ['2 heures', 2], half: ['Une demi-journée', 4], day: ['Une journée', 8], weekly: ['Créneau hebdomadaire d’1 heure', 1] };
const NEEDS = { sound: 'Sonorisation', light: 'Éclairage de la chapelle', video: 'Vidéoprojecteur', breakfast: 'Petit-déjeuner' };
const KINDS = { programming: 'Proposer une activité', rental: 'Louer un espace', privatisation: 'Privatiser', coworking: 'Coworker' };
const PRIVATISATION_RATE = 1.5;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const OFFLINE = 'Le serveur est injoignable : votre envoi n’a pas été enregistré. Réessayez dans un instant.';
const NOT_LIVE = 'Ce formulaire sera actif quand la page sera en ligne sur le site de Chez Marthe. En attendant : contact.chezmarthe@gmail.com';

async function post(path, body) {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
  if (!response) throw new Error(OFFLINE);
  // Serveur statique (local, Vercel) : l'API n'existe pas.
  if ([404, 405, 501].includes(response.status)) throw new Error(NOT_LIVE);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const detail = Array.isArray(data.detail) ? data.detail.map(d => d.msg).join(' ') : data.detail;
    throw new Error(detail || 'L’envoi a échoué. Réessayez dans un instant.');
  }
  return response.json();
}

function endTime(start, hours) {
  const [h, m] = start.split(':').map(Number);
  const minutes = Math.min(h * 60 + m + hours * 60, 23 * 60 + 59);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function estimate(draft) {
  const space = SPACES[draft.space];
  if (draft.requestType === 'programming') return { amount: 0, label: 'Gratuit', note: 'Les activités ouvertes au public sont étudiées par le comité de programmation.' };
  if (draft.kind === 'coworking') return { amount: null, label: 'Sur demande', note: 'L’équipe vous recontacte avec les formules disponibles.' };
  if (!space) return { amount: null, label: '—', note: 'Choisissez un espace pour obtenir une estimation.' };
  if (space.exchange) return { amount: 0, label: 'Échange de services', note: 'Vous utilisez l’Atelier ; en échange, vous animez un atelier gratuit pour Chez Marthe.' };
  const key = draft.duration;
  const base = space.prices?.[key] ?? (key === '2h' ? space.prices?.half : null) ?? (space.rate != null ? space.rate * DURATIONS[key][1] : null);
  if (base == null) return { amount: null, label: 'Sur devis', note: 'Tarif à définir avec l’équipe.' };
  if (draft.privatisation) { const p = Math.round(base * PRIVATISATION_RATE); return { amount: p, label: `${p} €`, note: 'Majoration privatisation, confirmée après étude.' }; }
  return { amount: base, label: `${base} €`, note: key === 'weekly' ? 'Par séance, pour un créneau régulier.' : 'Tarif indicatif, confirmé après étude.' };
}

function alerts(draft) {
  const space = SPACES[draft.space];
  const list = [];
  if (space && draft.participants > space.capacity) list.push(['no', `La jauge indicative de ${space.name.toLowerCase()} est de ${space.capacity} personnes.`]);
  if (draft.space === 'chapelle' && draft.technical.includes('video')) list.push(['no', 'L’acoustique de la chapelle ne permet pas les projections. Les Petites Cantines peuvent convenir.']);
  if (draft.space === 'salon-collectif' && draft.end > '18:00') list.push(['no', 'Le salon est l’espace de vie des résidentes le soir. Un créneau en journée sera plus simple.']);
  if (draft.technical.includes('sound') || draft.technical.includes('light')) list.push(['warn', 'Une personne formée à la régie devra être présente. L’équipe aide à l’organiser.']);
  return list;
}

function setStatus(form, text, kind) {
  const status = form.querySelector('.form-status');
  status.textContent = text;
  status.className = `form-status ${kind || ''}`;
}

function showErrors(form, errors) {
  form.querySelectorAll('.form-error').forEach(e => e.remove());
  form.querySelectorAll('[aria-invalid]').forEach(e => e.removeAttribute('aria-invalid'));
  for (const [name, text] of Object.entries(errors)) {
    const field = form.elements[name];
    if (!field) continue;
    field.setAttribute('aria-invalid', 'true');
    const p = document.createElement('p');
    p.className = 'form-error';
    p.textContent = text;
    field.closest('.field')?.append(p);
  }
  const first = Object.keys(errors)[0];
  if (first) form.elements[first]?.focus();
}

// ---------- Demande d'activité ou de location ----------
(function requestForm() {
  const form = document.getElementById('request-form');
  if (!form) return;
  const today = new Date().toISOString().slice(0, 10);
  form.elements.date.min = today;

  function read() {
    const f = form.elements;
    const kind = f.kind.value;
    const rental = kind !== 'programming';
    const technical = [...form.querySelectorAll('input[name="technical"]:checked')].map(i => i.value);
    const space = kind === 'coworking' ? 'coworking' : f.space.value;
    const start = f.start.value || '18:00';
    return {
      kind, requestType: rental ? 'rental' : 'programming', privatisation: kind === 'privatisation', space,
      duration: f.duration.value, start, end: endTime(start, DURATIONS[f.duration.value][1]),
      participants: Number(f.participants.value), technical, openToResidents: f.openToResidents.checked,
      title: f.title.value.trim(), date: f.date.value, description: f.description.value.trim(),
      organizer: f.organizer.value.trim(), email: f.email.value.trim(),
    };
  }

  function refresh() {
    const draft = read();
    form.querySelectorAll('.kind-picker label').forEach(l => l.classList.toggle('active', l.querySelector('input').checked));
    form.elements.space.disabled = draft.kind === 'coworking';
    const price = estimate(draft);
    document.getElementById('estimate-label').textContent = price.label;
    document.getElementById('estimate-note').textContent = price.note;
    const box = document.getElementById('estimate-alerts');
    box.replaceChildren(...alerts(draft).map(([level, text]) => { const p = document.createElement('p'); p.className = `request-alert ${level}`; p.textContent = text; return p; }));
  }
  form.addEventListener('input', refresh);
  form.addEventListener('change', refresh);

  // Les cartes des espaces choisissent l'espace dans le formulaire.
  document.querySelectorAll('[data-space]').forEach(card => card.addEventListener('click', () => {
    const kind = form.querySelector('input[name="kind"]:checked');
    if (kind.value === 'programming' || kind.value === 'coworking') form.querySelector('input[name="kind"][value="rental"]').checked = true;
    form.elements.space.value = card.dataset.space;
    refresh();
  }));

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const d = read();
    const errors = {};
    if (!d.title) errors.title = 'Donnez un nom à votre activité.';
    if (d.kind !== 'coworking' && !d.space) errors.space = 'Choisissez un espace.';
    if (!d.date) errors.date = 'Indiquez une date.';
    else if (d.date < today) errors.date = 'Choisissez une date à venir.';
    if (!(d.participants >= 1)) errors.participants = 'Indiquez un nombre de personnes.';
    if (!d.description) errors.description = 'Décrivez votre projet en quelques lignes.';
    if (!d.organizer) errors.organizer = 'Indiquez votre nom ou votre structure.';
    if (!EMAIL.test(d.email)) errors.email = 'Indiquez une adresse e-mail valide.';
    showErrors(form, errors);
    if (Object.keys(errors).length) return;

    const price = estimate(d);
    const rental = d.requestType === 'rental';
    const request = {
      requestType: d.requestType, privatisation: d.privatisation, space: d.space, duration: d.duration, start: d.start, end: d.end,
      participants: d.participants, technical: d.technical, openToResidents: d.openToResidents,
      title: d.title, category: KINDS[d.kind], organizer: d.organizer, email: d.email, date: d.date, description: d.description,
      opportunity: d.openToResidents ? 'Activité ouverte gratuitement aux femmes hébergées.' : '',
      rentalUse: rental ? d.description : '', equipmentNeeds: d.technical.map(n => NEEDS[n]).join(', ') || 'Aucun',
      budgetDetails: rental ? `Estimation en ligne : ${price.label}` : '', revenue: price.amount || 0,
    };
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true; button.textContent = 'Envoi…';
    try {
      const { id } = await post('/api/requests', request);
      form.reset(); refresh();
      setStatus(form, `Merci, ${request.organizer} ! Votre demande « ${request.title} » est enregistrée sous la référence CM-${id.slice(-6)}. Vous recevrez une réponse après le comité de vendredi.`, 'ok');
    } catch (failure) {
      setStatus(form, failure.message, 'error');
    } finally {
      button.disabled = false; button.textContent = 'Envoyer ma demande';
    }
  });
  refresh();
})();

// ---------- Contact ----------
(function contactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const f = form.elements;
    const message = { name: f.name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(), subject: f.subject.value.trim(), message: f.message.value.trim(), website: f.website.value };
    const errors = {};
    if (!message.name) errors.name = 'Indiquez votre nom.';
    if (!EMAIL.test(message.email)) errors.email = 'Indiquez votre e-mail.';
    if (!message.subject) errors.subject = 'Indiquez le sujet.';
    if (!message.message) errors.message = 'Écrivez votre message.';
    showErrors(form, errors);
    if (Object.keys(errors).length) return;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true; button.textContent = 'Envoi…';
    try {
      await post('/api/contact', message);
      form.reset();
      setStatus(form, `Merci, ${message.name}. Nous vous répondrons à ${message.email}.`, 'ok');
    } catch (failure) {
      setStatus(form, failure.message, 'error');
    } finally {
      button.disabled = false; button.textContent = 'Envoyer le message';
    }
  });
})();
