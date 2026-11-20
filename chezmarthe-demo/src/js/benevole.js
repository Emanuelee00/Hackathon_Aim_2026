
const M=[{d:'3',mo:'oct.',t:'La rue a un incroyable talent',w:'Samedi, 14 h – 19 h, jardin, 150 personnes attendues',r:[['Accueil du public',4,2],['Buvette',3,1],['Rangement',3,0]]},
{d:'2',mo:'oct.',t:'Concert de la chorale Voix de femmes',w:'Vendredi, 18 h 30 – 22 h, chapelle',r:[['Régie son (formation requise)',1,0],['Accueil',2,1]]},
{d:'8',mo:'oct.',t:'Buvette du jeudi',w:'Jeudi, 18 h – 21 h, jardin',r:[['Bar',2,1]]},
{d:'16',mo:'oct.',t:'Projection et débat (sous réserve)',w:'Vendredi, 19 h, lieu à confirmer',r:[['Accueil',2,0],['Buvette',1,0]]}];
const mine=new Set();const $=id=>document.getElementById(id);
function render(){$('mis').innerHTML=M.map((m,i)=>`<div class="panel m"><div class="date"><b>${m.d}</b>${m.mo}</div><div><h3>${m.t}</h3><span class="muted">${m.w}</span><div class="roles">${m.r.map((r,j)=>{const k=i+'-'+j,on=mine.has(k),f=r[2]+(on?1:0);return `<div class="role"><b>${r[0]}</b><div class="gauge">${Array.from({length:r[1]},(_,x)=>`<i class="${x<f?'f':''}"></i>`).join('')}</div><span class="muted" style="font-size:13px">${f} / ${r[1]} inscrits</span><br><button class="btn sm ${on?'':'ghost'}" style="margin-top:6px" ${!on&&f>=r[1]?'disabled':''} onclick="tog('${k}')">${on?'Inscrit·e, se désinscrire':f>=r[1]?'Complet':'Je m\u2019inscris'}</button></div>`}).join('')}</div></div></div>`).join('');
$('mine').innerHTML=mine.size?[...mine].map(k=>{const [i,j]=k.split('-');return `<p style="font-size:15px;margin:0 0 8px"><b>${M[i].r[j][0]}</b><br><span class="muted">${M[i].t}, ${M[i].d} ${M[i].mo}</span></p>`}).join(''):'<p class="muted">Aucun pour l\u2019instant.</p>'}
function tog(k){if(mine.has(k)){mine.delete(k);cmToast('Désinscription enregistrée')}else{mine.add(k);cmToast('Merci ! Inscription enregistrée')}render()}
render();
