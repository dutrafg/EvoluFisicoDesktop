/* Pré-cadastro separado de avaliações: usa exclusivamente o SQLite criptografado do Windows.
   Reaproveita exatamente os campos da primeira etapa da avaliação; nada clínico
   é criado no histórico até concluir a avaliação completa. */
(function(){'use strict';
const KEY='ef-pre-registration-v1';
const FIELDS=['nome','email','whatsapp','sexo','idade','altura','data_avaliacao','data_proxima_avaliacao','checkin_semana','fase','avaliador_clinica','avaliador_nome','avaliador_registro'];
let activeId=null,saving=false,loadGeneration=0;
const el=id=>document.getElementById(id);
const native=()=>window.EFNativeStorage;
function notify(message,type){if(typeof window.efToast==='function')window.efToast(message,type);else window.alert(message)}
function storage(){const db=native();if(!db||typeof db.readJSON!=='function'||typeof db.writeJSON!=='function')throw new Error('O pré-cadastro requer o banco SQLite do aplicativo Windows.');return db}
function clean(raw){return Array.isArray(raw)?raw.filter(x=>x&&typeof x.id==='string'&&x.values&&typeof x.values==='object').slice(0,300):[]}
async function list(){return clean(await storage().readJSON(KEY))}
async function persist(items){const db=storage();await db.writeJSON(KEY,items);const verify=clean(await db.readJSON(KEY));if(JSON.stringify(verify)!==JSON.stringify(items))throw new Error('O banco não confirmou o pré-cadastro.');}
function currentValues(){const values={};for(const key of FIELDS){const field=el(key);if(field)values[key]=String(field.value||'').trim().slice(0,240)}return values}
function validate(){const scope=document.querySelector('#checkin-form .step[data-step="1"]');if(!scope)return false;
 for(const field of scope.querySelectorAll('[required]')){if(!field.checkValidity()){field.reportValidity();field.focus();return false}}
 const phone=el('whatsapp');if(phone&&phone.value.replace(/\D/g,'').length<10){phone.setCustomValidity('Informe WhatsApp com DDD.');phone.reportValidity();phone.setCustomValidity('');phone.focus();return false}
 return true;
}
function showForm(values){if(typeof window.switchTab!=='function')return false;
 const editing=el('avaliacao_id');if(editing?.value && !window.confirm('A avaliação em edição não será salva. Abrir o pré-cadastro?'))return false;
 if(typeof window.resetFormulario==='function')window.resetFormulario();
 window.switchTab('tab-novo-checkin');
 if(typeof window.irParaEtapa==='function')window.irParaEtapa(0);
 for(const key of FIELDS){const field=el(key);if(field&&Object.prototype.hasOwnProperty.call(values,key)){
  field.value=String(values[key]||'');field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));}}
 const name=el('nome');if(name)name.focus();
 if(typeof window.recalcularCamposAutomaticos==='function')window.recalcularCamposAutomaticos();
 return true;
}
window.ef91NovoCadastro=function(){if(showForm({})){activeId=null;status('Preencha a identificação e clique em Salvar pré-cadastro.')}};
function status(message){const node=el('ef91-prereg-status');if(node)node.textContent=message}
async function save(){if(saving||!validate())return;const button=el('ef91-prereg-save');saving=true;if(button)button.disabled=true;
 try {
  const items=await list(),values=currentValues();
  if(!values.nome||!values.email||!values.whatsapp)throw new Error('Informe nome e contatos para salvar.');
  const now=new Date().toISOString(),id=activeId||'pre-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
  const prev=items.find(x=>x.id===id);
  const next={id,values,createdAt:prev?.createdAt||now,updatedAt:now};
  const updated=items.filter(x=>x.id!==id);updated.unshift(next);
  if(updated.length>300)throw new Error('Limite de pré-cadastros atingido.');
  await persist(updated);activeId=id;
  status('Pré-cadastro salvo no banco local. Continue a avaliação quando desejar.');
  notify('Pré-cadastro salvo. Você pode continuar a avaliação depois.');
  refresh();
 }catch(err){notify('Não foi possível salvar o pré-cadastro: '+err.message,'warn')}
 finally{saving=false;if(button)button.disabled=false}
}
async function resume(id){try{
 const item=(await list()).find(x=>x.id===id);if(!item){notify('Pré-cadastro não encontrado.','warn');return}
 if(showForm(item.values)){activeId=id;status('Pré-cadastro carregado. Complete a avaliação ou atualize os dados e salve.')}
}catch(err){notify('Erro ao abrir pré-cadastro: '+err.message,'warn')}}
async function remove(id){if(!window.confirm('Excluir este pré-cadastro? As avaliações já concluídas não serão alteradas.'))return;
 try{const items=await list();await persist(items.filter(x=>x.id!==id));if(activeId===id)activeId=null;refresh();notify('Pré-cadastro excluído.')}
 catch(err){notify('Falha ao excluir pré-cadastro: '+err.message,'warn')}}
async function refresh(){
 const target=el('ef91-prereg-list');if(!target)return;const serial=++loadGeneration;
 try{const items=await list();if(serial!==loadGeneration||!target.isConnected)return;
  target.replaceChildren();target.hidden=items.length===0;
  if(!items.length)return;
  const h=document.createElement('h3');h.textContent='Pré-cadastros salvos ('+items.length+')';target.append(h);
  const description=document.createElement('p');description.textContent='Registros de identificação aguardando avaliação completa.';target.append(description);
  const wrap=document.createElement('div');wrap.className='ef91-prereg-rows';
  for(const item of items){
   const row=document.createElement('div');row.className='ef91-prereg-row';
   const name=document.createElement('span');name.className='ef91-prereg-name';name.textContent=String(item.values.nome||'Sem nome');
   const open=document.createElement('button');open.type='button';open.textContent='Continuar avaliação';open.addEventListener('click',()=>resume(item.id));
   const del=document.createElement('button');del.type='button';del.textContent='Excluir';del.className='ef91-prereg-delete';del.addEventListener('click',()=>remove(item.id));
   row.append(name,open,del);wrap.append(row);
  }
  target.append(wrap);
 }catch(error){
  if(serial!==loadGeneration||!target.isConnected)return;target.hidden=false;target.replaceChildren();
  const info=document.createElement('p');info.textContent='Pré-cadastros indisponíveis: '+error.message;target.append(info);
 }
}
function setup(){
 const step=document.querySelector('#checkin-form .step[data-step="1"]');if(!step||el('ef91-prereg-save'))return;
 const toolbar=document.createElement('div');toolbar.className='ef91-prereg-toolbar no-print';
 const button=document.createElement('button');button.type='button';button.id='ef91-prereg-save';button.className='btn btn-secondary';button.textContent='Salvar pré-cadastro';button.addEventListener('click',save);
 const hint=document.createElement('span');hint.id='ef91-prereg-status';hint.textContent='Salve os dados iniciais sem criar uma avaliação incompleta.';
 toolbar.append(button,hint);const h=step.querySelector('.step-title');if(h)h.after(toolbar);else step.prepend(toolbar);
 refresh();
}
window.ef91RefreshPreCadastros=refresh;
window.ef91FinishPreCadastro=async function(registro){
 if(!activeId||!registro)return;
 const id=activeId;
 try{
  const items=await list();
  const current=items.find(x=>x.id===id);
  if(!current)return;
  const comparable=s=>String(s||'').trim().toLocaleLowerCase('pt-BR');
  // Não conclui um pré-cadastro quando o profissional salva outro paciente.
  if(comparable(current.values.email)!==comparable(registro.email)||comparable(current.values.nome)!==comparable(registro.nome))return;
  await persist(items.filter(x=>x.id!==id));activeId=null;refresh();}
 catch(e){console.warn('Avaliação salva, mas pré-cadastro não foi baixado da fila:',e)}
};
window.EFPreCadastro=Object.freeze({start:window.ef91NovoCadastro,save,refresh,resume,remove,list,getActiveId:()=>activeId});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();