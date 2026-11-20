
const PRICES={chapelle:{'2h':40,demi:100,jour:200,hebdo:30},jardin:{'2h':40,demi:100,jour:200,hebdo:30},salon:{'2h':80,demi:80,jour:150,hebdo:30}};
const JAUGE={chapelle:90,jardin:150,salon:15,cantine:30,reunion:8,coworking:12};
const NAMES={chapelle:'la chapelle',jardin:'le jardin',salon:'le salon collectif',cantine:'Les Petites Cantines',reunion:'la salle de réunion',coworking:'le coworking'};
const $=id=>document.getElementById(id);const f=$('f');
function sel(s){document.querySelectorAll('.room[data-s]').forEach(r=>r.setAttribute('aria-pressed',r.dataset.s===s));$('espace').value=s;upd();}
document.querySelectorAll('.room[data-s]').forEach(r=>r.onclick=()=>{sel(r.dataset.s);$('form-t').scrollIntoView({behavior:'smooth'})});
$('espace').onchange=()=>sel($('espace').value);
function upd(){const t=f.type.value,s=$('espace').value,d=$('duree').value,j=+$('jauge').value||0,h=$('heure').value;
const tech=[...f.querySelectorAll('.checks input:checked')].map(i=>i.value);let est='Gratuit',ed='Les activités ouvertes au public sont étudiées par le comité de programmation.';
if(t!=='programmation'){if(t==='coworking'){est='Sur demande';ed='Nous vous recontactons avec les formules disponibles.'}else if(PRICES[s]){est=PRICES[s][d]+' €';ed=d==='hebdo'?'Par séance, pour un créneau régulier.':'Tarif indicatif, confirmé après étude.';if(t==='privatisation'){est=Math.round(PRICES[s][d]*1.5)+' €';ed='Majoration privatisation, confirmée après étude.'}}else if(s){est='Sur devis';ed='Tarif à définir avec l\u2019équipe.'}}
$('est').textContent=est;$('est-d').textContent=ed;const al=[];
if(s&&j>JAUGE[s])al.push(['bad',`La jauge indicative de ${NAMES[s]} est de ${JAUGE[s]} personnes.`]);
if(s==='chapelle'&&tech.includes('video'))al.push(['bad','L\u2019acoustique de la chapelle ne permet pas les projections. La cantine peut convenir.']);
if(s==='salon'&&(+h.split(':')[0]>=18))al.push(['','Le salon est l\u2019espace de vie des résidentes le soir. Un créneau en journée sera plus simple.']);
if(s==='jardin')al.push(['','Le jardin reste un lieu de passage : il ne peut pas être entièrement fermé au public.']);
if(s==='jardin'&&(+h.split(':')[0]>=21))al.push(['bad','Après 21 h, le calme des résidentes est prioritaire au jardin.']);
if(tech.includes('son')||tech.includes('lumiere'))al.push(['','Une personne formée à la régie devra être présente. Nous vous aiderons à l\u2019organiser.']);
$('alerts').innerHTML=al.map(a=>`<div class="alert ${a[0]}">${a[1]}</div>`).join('');}
f.addEventListener('input',upd);f.addEventListener('change',upd);
f.onsubmit=e=>{e.preventDefault();let ok=true;const req=[['titre','Donnez un nom à votre activité.'],['espace','Choisissez un espace.'],['date','Indiquez une date.'],['desc','Décrivez votre projet en quelques lignes.'],['nom','Indiquez votre nom ou votre structure.']];
req.forEach(([id,m])=>{const v=$(id).value.trim();$('e-'+id).textContent=v?'':m;if(!v)ok=false});
const m=$('mail').value.trim();const mv=/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m);$('e-mail').textContent=mv?'':'Indiquez une adresse e-mail valide.';if(!mv)ok=false;
if(!ok){f.querySelector('.err:not(:empty)').previousElementSibling.focus();return}
$('done-t').textContent='Merci, '+$('nom').value.trim();$('done-p').textContent=`Votre demande « ${$('titre').value.trim()} » dans ${NAMES[$('espace').value]} porte la référence CM-2026-${Math.floor(40+Math.random()*50)}. Vous recevrez une réponse après le comité de vendredi.`;
f.parentElement.hidden=true;$('done').hidden=false;$('done').scrollIntoView({behavior:'smooth'})};
f.querySelectorAll('input,textarea,select').forEach(i=>i.addEventListener('input',()=>{const e=$('e-'+i.id);if(e)e.textContent=''}));
$('again').onclick=()=>{f.reset();f.parentElement.hidden=false;$('done').hidden=true;upd()};
upd();
