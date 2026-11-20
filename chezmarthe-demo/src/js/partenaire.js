
const A={benenova:{n:'Benenova',role:'Bénévolat de proximité. Permanence hebdomadaire dans le coworking.',tool:'Outil actuel (à confirmer) : leur propre plateforme de missions.',slots:[['Permanence Benenova','Mercredis, 14 h – 18 h, coworking','ok','Confirmé']],imp:[5,0],onb:[1,1,1,0]},
sista4good:{n:'Sista4good',role:'Gestion du coworking et des salles de soin.',tool:'Outil actuel (à confirmer) : Google Agenda partagé.',slots:[['Coworking','Lun., mar., jeu., ven.','ok','Confirmé'],['Salle de soin, psychologue','Mardis, 18 h – 20 h, chapelle (annexe)','no','Conflit : cours de yoga demandé'],['Salle de soin, sophrologie','Jeudis, 10 h – 12 h','ok','Confirmé']],imp:[12,1],onb:[1,1,0,0]},
cantines:{n:'Les Petites Cantines',role:'Cantine solidaire à prix libre, du lundi au vendredi midi.',tool:'Outil actuel (à confirmer) : outil de réservation du réseau national.',slots:[['Déjeuners à prix libre','Lun. – ven., 12 h – 14 h','ok','Confirmé'],['Privatisation du soir','Sam. 3 oct., 19 h','warn','En attente du comité']],imp:[22,0],onb:[1,0,0,0]}};
const ONB=['Outils et besoins cartographiés','Référente désignée','Agenda synchronisé','Formation de l\u2019équipe'];
let cur='benenova';const $=id=>document.getElementById(id);
$('assos').innerHTML=Object.entries(A).map(([k,a])=>`<button data-k="${k}" aria-pressed="${k===cur}">${a.n}</button>`).join('');
document.querySelectorAll('#assos button').forEach(b=>b.onclick=()=>{cur=b.dataset.k;document.querySelectorAll('#assos button').forEach(x=>x.setAttribute('aria-pressed',x===b));render()});
function render(){const a=A[cur];$('a-name').textContent=a.n;$('a-role').textContent=a.role;$('tool').textContent=a.tool;
$('slots').innerHTML=a.slots.map(s=>`<div class="slot"><span><b>${s[0]}</b><br><span class="muted">${s[1]}</span></span><span class="pill ${s[2]}" style="align-self:center">${s[3]}</span></div>`).join('');
$('onb').innerHTML=ONB.map((o,i)=>`<li class="${a.onb[i]?'d':''}">${o}</li>`).join('');$('res').innerHTML='';$('bar').style.transition='none';$('bar').style.width='0'}
$('sync').onclick=()=>{const a=A[cur];const b=$('bar');b.style.transition='width 1.4s ease';requestAnimationFrame(()=>b.style.width='100%');$('res').innerHTML='<p class="muted" style="font-size:14px">Lecture de votre agenda…</p>';
setTimeout(()=>{a.onb[2]=1;$('onb').innerHTML=ONB.map((o,i)=>`<li class="${a.onb[i]?'d':''}">${o}</li>`).join('');$('res').innerHTML=`<p><span class="pill ok">${a.imp[0]} créneaux importés</span> ${a.imp[1]?`<span class="pill no">${a.imp[1]} conflit à arbitrer</span>`:''}</p><p class="muted" style="font-size:14px">Depuis ${document.querySelector('[name=src]:checked').value}. Vos prochains créneaux apparaissent maintenant dans l'agenda commun de l'équipe.</p>`},1500)};
$('bk').onsubmit=e=>{e.preventDefault();if(!$('bk-d').value){$('bk-e').textContent='Choisissez une date.';$('bk-d').focus();return}$('bk-e').textContent='';
const sp=$('bk-sp').value;if(sp==='Salle de réunion')cmToast(sp+' réservée pour '+A[cur].n+'. Confirmation immédiate.');else cmToast('Demande envoyée pour '+sp.toLowerCase()+'. Réponse après le comité de vendredi.')};
$('bk-d').oninput=()=>$('bk-e').textContent='';
render();
