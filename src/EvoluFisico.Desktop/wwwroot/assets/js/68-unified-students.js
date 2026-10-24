/* EvoluFísico Desktop — centraliza a visão do aluno a partir de avaliações já vinculadas.
 * Esta primeira entrega é de leitura; a persistência continua na camada SQLite existente.
 */
(()=>{'use strict';
const PAGE='tab-alunos',BTN='tab-btn-alunos';
const $=id=>document.getElementById(id);
const core=window.EFUnifiedStudentsCore;
if(!core)return;
let selectedKey='',sectionKey='resumo',profiles=[];
const dateFmt=value=>{
 const s=String(value||'');
 const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s);
 return m?m[3]+'/'+m[2]+'/'+m[1]:(s||'Sem data');
};
const escText=value=>String(value==null?'':value);
function source(){
 if(window.__EF63_STATE__?.getAvaliacoes){const rows=window.__EF63_STATE__.getAvaliacoes();if(Array.isArray(rows))return rows}
 return Array.isArray(window.avaliacoes)?window.avaliacoes:[];
}
function elem(tag,cls,label){
 const n=document.createElement(tag);if(cls)n.className=cls;if(label!==undefined)n.textContent=label;return n;
}
function action(label,fn,cls='efsu-action'){
 const b=elem('button',cls,label);b.type='button';b.addEventListener('click',fn);return b;
}
function metric(label,value,unit){
 const card=elem('div','efsu-metric');card.append(elem('span','efsu-metric-label',label),elem('strong','efsu-metric-value',value==null?'—':String(value)+(unit||'')));return card;
}
function safeDetail(value){
 if(value==null||value==='')return 'Não informado.';
 if(typeof value==='string'||typeof value==='number'||typeof value==='boolean')return String(value);
 if(Array.isArray(value))return value.map(safeDetail).filter(v=>v!=='Não informado.').join(' · ')||'Não informado.';
 if(typeof value==='object')return Object.entries(value).map(([k,v])=>k+': '+safeDetail(v)).join(' · ');
 return 'Não informado.';
}
function openAssessment(id){
 const fn=['abrirVisualizacaoPacienteWeb','abrirModalDetalhes','verDetalhesAvaliacao'].find(name=>typeof window[name]==='function');
 if(fn){try{window[fn](id);return}catch(error){console.warn('Abertura da avaliação indisponível.',error)}}
 window.switchTab?.('tab-historico');
}
function selectedProfile(){return profiles.find(p=>p.key===selectedKey)||null;}
function ensurePanel(){
 const nav=document.querySelector('.top-navbar > .nav-tabs'),app=document.querySelector('.app-container');
 if(!nav||!app)return false;
 let panel=$(PAGE);
 if(!panel){
  panel=document.createElement('section');panel.id=PAGE;panel.className='tab-panel efsu-page';panel.setAttribute('aria-label','Alunos — Perfil Unificado');
  panel.innerHTML='<div class="efsu-heading"><div><span class="efsu-overline">CADASTRO E HISTÓRICO</span><h1>Alunos</h1><p>Um perfil por identidade persistente, com avaliações em ordem cronológica.</p></div><span class="efsu-heading-tag">Perfil Unificado</span></div><div class="efsu-toolbar"><label class="efsu-search"><span>Buscar aluno</span><input id="efsu-search" type="search" autocomplete="off" placeholder="Nome, e-mail ou telefone"></label><label class="efsu-sort"><span>Ordenar</span><select id="efsu-sort"><option value="name">Nome A–Z</option><option value="recent">Avaliação mais recente</option></select></label><span id="efsu-count" class="efsu-count" role="status"></span></div><div class="efsu-grid"><aside class="efsu-list" id="efsu-list" aria-label="Lista de alunos"></aside><main class="efsu-detail" id="efsu-detail" aria-live="polite"></main></div>';
  app.append(panel);
 }
 let button=$(BTN);
 if(!button){
  button=document.createElement('button');button.type='button';button.className='nav-tab-btn';button.id=BTN;button.textContent='Alunos';button.setAttribute('aria-controls',PAGE);
  button.addEventListener('click',()=>window.switchTab(PAGE));
  const form=$('tab-btn-form');if(form?.parentNode===nav)form.after(button);else nav.append(button);
 }
 if(!panel.dataset.efsuEvents){
  $('efsu-search')?.addEventListener('input',renderList);
  $('efsu-sort')?.addEventListener('change',renderList);
  panel.dataset.efsuEvents='1';
 }
 return true;
}
function matching(){
 const q=String($('efsu-search')?.value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const list=profiles.filter(p=>!q||[p.name,p.email,p.phone,p.key].some(v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q)));
 if($('efsu-sort')?.value==='recent')list.sort((a,b)=>b.latestDate.localeCompare(a.latestDate)||a.name.localeCompare(b.name,'pt-BR',{sensitivity:'base'}));
 return list;
}
function renderList(){
 const host=$('efsu-list');if(!host)return;
 const list=matching();$('efsu-count').textContent=list.length+' aluno'+(list.length===1?'':'s');
 host.replaceChildren();
 if(!list.length){host.append(elem('p','efsu-empty','Nenhum aluno corresponde à busca.'));return}
 if(!list.some(p=>p.key===selectedKey))selectedKey=list[0].key;
 list.forEach(profile=>{
  const b=elem('button','efsu-person');b.type='button';b.setAttribute('aria-pressed',String(profile.key===selectedKey));
  b.append(elem('strong','efsu-person-name',profile.name),elem('span','efsu-person-meta',profile.history.length+' avaliação'+(profile.history.length===1?'':'ões')+' · '+dateFmt(profile.latestDate)));
  b.addEventListener('click',()=>{selectedKey=profile.key;sectionKey='resumo';renderList();renderDetail()});
  host.append(b);
 });
 renderDetail();
}
function showSection(key,tabbar,body,profile){
 sectionKey=key;tabbar.querySelectorAll('[data-efsu-section]').forEach(button=>button.setAttribute('aria-selected',String(button.dataset.efsuSection===key)));
 body.replaceChildren();
 const card=elem('section','efsu-section');
 if(key==='resumo'){
  card.append(elem('h2','', 'Dados cadastrais e objetivos'));
  const facts=elem('dl','efsu-facts');
  for(const [label,value] of [['Nome',profile.name],['Sexo',profile.sex],['Idade',profile.age==null?null:profile.age+' anos'],['Altura',profile.height==null?null:profile.height+' cm'],['E-mail',profile.email],['Telefone',profile.phone],['Objetivos',safeDetail(profile.goals)]]){facts.append(elem('dt','',label),elem('dd','',value==null||value===''?'Não informado.':String(value)))}
  card.append(facts);
  const heads=elem('h3','efsu-subheading','Avaliação mais recente');
  card.append(heads);
  const row=elem('div','efsu-metrics');
  row.append(metric('Peso',profile.weight,' kg'),metric('Gordura estimada',profile.bodyFat,'%'),metric('Massa magra estimada',profile.leanMass,' kg'),metric('Cintura',profile.waist,' cm'));
  card.append(row);
  card.append(action('Abrir avaliação recente',()=>openAssessment(profile.latest.id)));
 }else if(key==='historico'){
  card.append(elem('h2','','Histórico cronológico'));
  const list=elem('ol','efsu-history');
  profile.history.slice().reverse().forEach(record=>{
   const item=elem('li','efsu-history-item');
   const meta=elem('div','efsu-history-meta');meta.append(elem('strong','',dateFmt(record.data_avaliacao||record.data)),elem('span','',record.id?'ID '+record.id:'Avaliação'));
   item.append(meta,action('Abrir avaliação',()=>openAssessment(record.id),'efsu-link-button'));
   list.append(item);
  });card.append(list);
 }else if(key==='formularios'){
  card.append(elem('h2','','Anamnese e formulários'));
  card.append(elem('p','',profile.formsCount?profile.formsCount+' avaliação(ões) contêm dados de formulários vinculados.':'Nenhum formulário foi encontrado nos dados das avaliações deste perfil.'));
  card.append(action('Abrir Formulários',()=>window.switchTab?.('tab-ef-forms')));
 }else if(key==='analises'){
  card.append(elem('h2','','Análises do aluno'));
  card.append(elem('p','','Abra Análises para selecionar três ou quatro avaliações deste mesmo perfil. Os motores determinísticos continuam disponíveis sem a EFI Intelligence.'));
  card.append(action('Abrir Análises deste aluno',()=>openAnalysis(profile)));
 }else if(key==='relatorios'){
  card.append(elem('h2','','Relatórios'));
  card.append(elem('p','','Os relatórios existentes permanecem vinculados às avaliações. Escolha uma data para abrir a ficha e gerar seu PDF.'));
  profile.history.slice().reverse().forEach(record=>card.append(action('Abrir '+dateFmt(record.data_avaliacao||record.data),()=>openAssessment(record.id),'efsu-link-button')));
 }else{
  card.append(elem('h2','','Informações financeiras'));
  card.append(elem('p','','As cobranças permanecem no módulo financeiro. Este perfil não cruza pagamentos pelo nome do aluno.'));
  card.append(action('Abrir Cobranças',()=>window.switchTab?.('tab-cobranca')));
 }
 body.append(card);
}
function openAnalysis(profile){
 window.switchTab?.('tab-analises');
 requestAnimationFrame(()=>setTimeout(()=>{
  const select=$('efu-student-select');
  if(select){select.value=profile.key;select.dispatchEvent(new Event('change',{bubbles:true}))}
 },0));
}
function renderDetail(){
 const host=$('efsu-detail');if(!host)return;
 const profile=selectedProfile();host.replaceChildren();
 if(!profile){host.append(elem('p','efsu-empty','Selecione um aluno para abrir o perfil.'));return}
 const header=elem('header','efsu-profile-head');
 const h=elem('div','efsu-profile-title');h.append(elem('h2','',profile.name));
 const badge=elem('span','efsu-id',profile.persistentId?'ID persistente: '+profile.persistentId:'Vínculo legado; confirme a identidade ao salvar');
 h.append(badge);
 header.append(h);
 const actions=elem('div','efsu-profile-actions');
 actions.append(action('Nova avaliação',()=>{if(typeof window.novaAvaliacaoParaAluno==='function')window.novaAvaliacaoParaAluno(profile.latest.id);else window.switchTab?.('tab-novo-checkin')}));
 actions.append(action('Análises',()=>openAnalysis(profile),'efsu-action efsu-action-secondary'));
 header.append(actions);host.append(header);
 const tabs=elem('div','efsu-profile-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Seções do perfil');
 const body=elem('div','efsu-profile-content');
 const sections=[['resumo','Resumo'],['historico','Histórico'],['formularios','Anamnese'],['analises','Análises'],['relatorios','Relatórios'],['financeiro','Financeiro']];
 sections.forEach(([key,label])=>{const b=elem('button','efsu-tab',label);b.type='button';b.dataset.efsuSection=key;b.setAttribute('role','tab');b.setAttribute('aria-selected',String(sectionKey===key));b.addEventListener('click',()=>showSection(key,tabs,body,profile));tabs.append(b)});
 host.append(tabs,body);showSection(sectionKey,tabs,body,profile);
}
function render(){
 if(!ensurePanel())return;
 profiles=core.build(source());
 if(!profiles.some(p=>p.key===selectedKey))selectedKey=profiles[0]?.key||'';
 renderList();
}
function init(){
 if(!ensurePanel())return;
 const prev=window.switchTab;
 if(typeof prev==='function'&&!prev.__efsu){
  const wrapped=function(id){const out=prev.apply(this,arguments);if(id===PAGE){$(BTN)?.classList.add('active');render()}return out};
  wrapped.__efsu=true;window.switchTab=wrapped;
 }
 window.addEventListener('ef-records-changed',render);
 const state=window.__EF63_STATE__;
 if(state&&typeof state.touch==='function'){
  const touch=state.touch;state.touch=function(){const result=touch.apply(this,arguments);requestAnimationFrame(render);return result};
 }
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
