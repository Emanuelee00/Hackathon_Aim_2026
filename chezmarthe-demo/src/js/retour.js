
let note=0;const $=id=>document.getElementById(id);
$('stars').innerHTML=[1,2,3,4,5].map(i=>`<button type="button" role="radio" aria-checked="false" aria-label="${i} sur 5" data-i="${i}">★</button>`).join('');
$('stars').querySelectorAll('button').forEach(b=>b.onclick=()=>{note=+b.dataset.i;$('e-n').textContent='';$('stars').querySelectorAll('button').forEach(x=>{x.classList.toggle('on',+x.dataset.i<=note);x.setAttribute('aria-checked',+x.dataset.i===note)})});
$('fb').onsubmit=e=>{e.preventDefault();let ok=true;if(!note){$('e-n').textContent='Choisissez une note.';ok=false}
if($('nb').value===''){$('e-nb').textContent='Indiquez un nombre, même approximatif.';ok=false}else $('e-nb').textContent='';
if(!document.querySelector('[name=res]:checked')){$('e-res').textContent='Choisissez une réponse.';ok=false}else $('e-res').textContent='';
if(!ok)return;$('fb').hidden=true;$('ok').hidden=false};
$('nb').oninput=()=>$('e-nb').textContent='';document.querySelectorAll('[name=res]').forEach(r=>r.onchange=()=>$('e-res').textContent='');
