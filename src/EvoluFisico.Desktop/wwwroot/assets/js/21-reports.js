/* 19-runtime.js */
(function(){
'use strict';
if(window.EF781)return;
var VER='7.8.1',cur=null,dirty=false;
function $(i){return document.getElementById(i)}
function recs(){try{var r=window.__EF63_STATE__.getAvaliacoes();return Array.isArray(r)?r:[]}catch(e){return[]}}
function toast(m,t){if(window.efToast)window.efToast(m,t);else alert(m)}
function autoText(a1,a2){return a2.parecer_profissional||a1.parecer_profissional||'Sem observações.'}
function custom(a1,a2){var m=a2&&a2.parecer_comparativo;return(m&&typeof m==='object'&&typeof m[a1.id]==='string')?m[a1.id]:null}
function setStatus(){var s=$('ef781-status');if(!s)return;
  if(!cur){s.textContent='';s.className='';return}
  s.textContent=dirty?'● Alterações não salvas':(cur.edited?'✏️ Parecer editado (salvo)':'🤖 Texto automático das avaliações');
  s.className=dirty?'dirty':(cur.edited?'ok':'')}
function mirror(){var ta=$('ef781-parecer'),d=$('comp-pro-notes-display');if(d)d.textContent=(ta&&ta.value.trim())||'Sem observações.'}
function ctrls(on){['ef781-parecer','ef781-save','ef781-restore'].forEach(function(i){var e=$(i);if(e)e.disabled=!on})}

async function persist(c,text){
  var orig=recs().filter(function(x){return x.id===c.a2id})[0];
  if(!orig)throw new Error('avaliação não encontrada');
  var fn=window.salvarAvaliacaoNoDB;if(typeof fn!=='function')throw new Error('função de salvar indisponível');
  var rec=Object.assign({},orig),m=Object.assign({},orig.parecer_comparativo||{}),t=String(text).replace(/\s+$/,'');
  if(t.trim()===c.auto.trim())delete m[c.a1id];else m[c.a1id]=t;
  if(Object.keys(m).length)rec.parecer_comparativo=m;else delete rec.parecer_comparativo;
  await fn(rec);
  return Object.prototype.hasOwnProperty.call(m,c.a1id)}

function render(a1,a2){
  var ta=$('ef781-parecer');
  if(!ta){var d=$('comp-pro-notes-display');if(d)d.textContent=autoText(a1,a2);return}
  var key=a1.id+'|'+a2.id;
  if(cur&&dirty&&cur.key!==key){
    var prev=cur,txt=ta.value;dirty=false;
    persist(prev,txt).then(function(){toast('Parecer do comparativo anterior salvo automaticamente.','ok')},function(e){console.warn('EF781',e);toast('Não foi possível salvar o parecer da comparação anterior.','warn')})}
  if(cur&&cur.key===key&&dirty){cur.auto=autoText(a1,a2)}
  else{var c=custom(a1,a2),auto=autoText(a1,a2);
    cur={key:key,a1id:a1.id,a2id:a2.id,auto:auto,edited:c!==null};
    ta.value=c!==null?c:auto;dirty=false}
  ctrls(true);mirror();setStatus()}
function vazio(){
  var ta=$('ef781-parecer'),d=$('comp-pro-notes-display');
  cur=null;dirty=false;if(ta)ta.value='';ctrls(false);
  if(d)d.textContent='Nenhuma observação técnica disponível.';setStatus()}

async function save(){
  if(!cur)return;var c=cur,ta=$('ef781-parecer'),b=$('ef781-save');if(b)b.disabled=true;
  try{c.edited=await persist(c,ta.value);dirty=false;
    toast(c.edited?'Parecer do comparativo salvo.':'Parecer igual ao automático: nada a personalizar.','ok')}
  catch(e){console.warn('EF781',e);toast('Não foi possível salvar o parecer: '+(e&&e.message||e),'warn')}
  if(b)b.disabled=!cur;setStatus()}
function restore(){
  if(!cur)return;var ta=$('ef781-parecer');
  if(ta.value.trim()!==cur.auto.trim()&&!confirm('Descartar o texto editado e voltar ao parecer automático das avaliações?'))return;
  ta.value=cur.auto;dirty=true;mirror();save()}

var ta0=$('ef781-parecer');
if(ta0){
  ta0.addEventListener('input',function(){if(!cur)return;dirty=true;mirror();setStatus()});
  $('ef781-save').addEventListener('click',save);
  $('ef781-restore').addEventListener('click',restore);
  ctrls(false)}
window.addEventListener('beforeunload',function(e){if(dirty){e.preventDefault();e.returnValue=''}});
window.EF781={version:VER,render:render,vazio:vazio,save:save};
})();
