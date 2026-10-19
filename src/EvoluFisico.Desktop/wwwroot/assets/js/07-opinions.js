/* 05-runtime.js */
/* ===== EvoluFísico v6.0 — Parecer Inteligente ===== */
(function(){'use strict';
var $=function(s){return document.querySelector(s)};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var jsEsc=function(s){return esc(String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\r/g,'\\r').replace(/\n/g,'\\n'))};
var norm=function(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()};
var num=function(v){var n=parseFloat(String(v==null?'':v).replace(',','.'));return isFinite(n)?n:null};
var val=function(id){var e=document.getElementById(id);return e?e.value:''};
var setv=function(id,v){var e=document.getElementById(id);if(e)e.value=v};
var fdata=function(s){var m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||'');return m?m[3]+'/'+m[2]+'/'+m[1]:'—'};
var fmt=function(v,u){return(v>0.049?'+':v<-0.049?'−':'')+Math.abs(v).toFixed(1)+u};
var TAGS=['Evolução consistente','Platô','Perda de gordura','Ganho de massa magra','Boa recuperação','Fadiga acumulada','Sono insuficiente','Hidratação baixa','Dor / desconforto','Ajustar carga','Ajustar calorias','Reavaliar em 15 dias'];
var FRASES=[['Manter plano','Manter o plano atual de treino e dieta até a próxima reavaliação.'],['Progressão de carga','Aplicar progressão de carga nos exercícios principais nas próximas semanas.'],['Reforçar aderência','Reforçar a regularidade nos treinos e o cumprimento do plano alimentar.'],['Sono e recuperação','Priorizar sono e recuperação para sustentar o desempenho.'],['Revisar dieta','Revisar o plano alimentar com o profissional responsável.'],['Encaminhar saúde','Recomenda-se avaliação com profissional de saúde para investigar o desconforto relatado.']];
var T={'100% no plano':100,'Faltei 1-2x':75,'Faltei 3x ou mais':40,'Não treinei':0};
var D={'100% no plano':100,'95% no plano':95,'Pequenos furos':75,'Muitos furos':40,'Fora do plano':10};
var COR={'Excelente':['#dcfce7','#166534'],'Bom':['#dbeafe','#1e40af'],'Regular':['#fef9c3','#854d0e'],'Atenção':['#fee2e2','#991b1b']};

function scoreDe(o){var t=T[o.treino];if(t==null)t=70;var d=D[o.dieta];if(d==null)d=70;var bs=[],e=num(o.energia),s=num(o.sono),st=num(o.estresse);
if(e!=null){var ec=Math.max(1,Math.min(5,e));bs.push((ec-1)/4*100);}
if(s!=null){var sc=Math.max(1,Math.min(5,s));bs.push((sc-1)/4*100);}
if(st!=null){var stc=Math.max(1,Math.min(5,st));bs.push((5-stc)/4*100);}
var b=bs.length?bs.reduce(function(a,c){return a+c},0)/bs.length:70;
return Math.max(0,Math.min(100,Math.round(.4*t+.35*d+.25*b)));}
function rotulo(sc){return sc>=85?'Excelente':sc>=70?'Bom':sc>=50?'Regular':'Atenção'}
function lista(){try{return Array.isArray(avaliacoes)?avaliacoes:[]}catch(e){return[]}}
function doAluno(nome){var k=EFIdentity.key(nome);return lista().filter(function(a){return EFIdentity.key(a)===k}).sort(function(x,y){return String(x.data_avaliacao||'').localeCompare(String(y.data_avaliacao||''))||String(x.timestamp||'').localeCompare(String(y.timestamp||''))})}
function pgDe(a){var r=a&&a.dobras_resultado&&num(a.dobras_resultado.percGordura);return r!=null?r:num(a&&a.bioimpedancia&&a.bioimpedancia.pgordura)}
function mmDe(a){return EFMeasures.lean(a)}
function cinDe(a){return num(a&&((a.perimetria&&a.perimetria.cintura)||a.cintura))}
function scoreAval(a){var p=a&&a.parecer_v6;if(p&&p.score!=null)return p.score;return scoreDe({treino:a.aderencia_treino,dieta:a.aderencia_dieta,energia:a.energia,sono:p&&p.sono,estresse:p&&p.estresse})}

function atualForm(){var sexo=val('sexo')||'M',idade=num(val('idade'))||0,peso=num(val('peso'))||num(val('bia_peso'))||0,d={};
['triceps','subescapular','peitoral','axilar','suprailiaca','abdominal','coxa'].forEach(function(k){d[k]=num(val('dobra_'+k))||0});
var r=null;try{r=calcularPollock7(sexo,idade,peso,d)}catch(e){}
return{nome:val('nome'),data:val('data_avaliacao'),id:val('avaliacao_id'),peso:peso||null,pg:r?num(r.percGordura):num(val('bia_pgordura')),mm:r?num(r.massaMagra):null,cintura:num(val('cintura')),soma:r?num(r.soma):null,fase:val('fase'),semana:val('checkin_semana'),treino:val('aderencia_treino'),dieta:val('aderencia_dieta'),energia:val('energia'),sono:val('ef6_sono'),estresse:val('ef6_estresse'),dor:val('ef6_dor'),metaPg:num(val('ef6_meta_pg')),metaPeso:num(val('ef6_meta_peso')),metaPrazo:val('ef6_meta_prazo')}}
function referencias(f){var l=doAluno(f.nome).filter(function(a){return a.id!==f.id&&(!f.data||String(a.data_avaliacao||'')<=f.data)});return{ant:l.length?l[l.length-1]:null,prim:l.length?l[0]:null,n:l.length}}
function prog(base,atual,meta){if(base==null||atual==null||meta==null)return null;var tot=base-meta;if(Math.abs(tot)<.05)return Math.abs(atual-meta)<.05?100:0;return Math.max(0,Math.min(100,Math.round((base-atual)/tot*100)))}
function barra(p){return'<div class="ef6-bar"><i style="width:'+p+'%"></i></div>'}
function metaHTML(f,ref){var h='';
if(f.metaPg!=null&&f.pg!=null){var base=ref.prim&&pgDe(ref.prim)!=null?pgDe(ref.prim):f.pg,p=prog(base,f.pg,f.metaPg);h+='<div class="ef6-meta">🎯 Meta de gordura: <b>'+f.metaPg.toFixed(1)+'%</b> — atual '+f.pg.toFixed(1)+'% · '+(Math.abs(f.pg-f.metaPg)<.05?'meta atingida':'faltam '+Math.abs(f.pg-f.metaPg).toFixed(1)+' p.p.')+' ('+p+'%)'+barra(p)+'</div>'}
if(f.metaPeso!=null&&f.peso!=null){var b2=ref.prim&&num(ref.prim.peso)!=null?num(ref.prim.peso):f.peso,p2=prog(b2,f.peso,f.metaPeso);h+='<div class="ef6-meta">⚖️ Meta de peso: <b>'+f.metaPeso.toFixed(1)+' kg</b> — atual '+f.peso.toFixed(1)+' kg · '+(Math.abs(f.peso-f.metaPeso)<.05?'meta atingida':'faltam '+Math.abs(f.peso-f.metaPeso).toFixed(1)+' kg')+' ('+p2+'%)'+barra(p2)+'</div>'}
if(f.metaPrazo){var dias=Math.round((new Date(f.metaPrazo+'T00:00:00')-new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate()))/864e5);if(isFinite(dias))h+='<div class="ef6-sub">Prazo: '+fdata(f.metaPrazo)+(dias>=0?' (em '+dias+' dias)':' (vencido há '+(-dias)+' dias)')+'</div>'}
return h}
function renderResumo(){var box=window.__ef6ResumoBox||(window.__ef6ResumoBox=$('#ef6-resumo'));if(!box)return;var f=atualForm(),ref=referencias(f),sc=scoreDe(f),rt=rotulo(sc),c=COR[rt],ant=ref.ant;
function kv(t,a,b,u,bom){if(a==null)return'';var h='<div class="ef6-kv"><small>'+t+'</small><b>'+a.toFixed(1)+u+'</b>';
if(ant&&b!=null){var d=a-b,cl=Math.abs(d)<.05?'':((d<0)===bom?'ok':'bad');h+='<span class="ef6-d '+cl+'">'+fmt(d,u)+' vs anterior</span>'}else h+='<span class="ef6-d">sem referência</span>';return h+'</div>'}
box.innerHTML='<div class="ef6-resumo-h"><b>📊 Resumo automático do check-in</b><span class="ef6-badge" style="background:'+c[0]+';color:'+c[1]+'">Aderência '+sc+'/100 · '+rt+'</span></div><div class="ef6-kvs">'+
kv('% Gordura',f.pg,ant?pgDe(ant):null,'%',true)+kv('Peso',f.peso,ant?num(ant.peso):null,' kg',true)+kv('Massa magra',f.mm,ant?mmDe(ant):null,' kg',false)+kv('Cintura',f.cintura,ant?cinDe(ant):null,' cm',true)+'</div>'+
(ant?'<div class="ef6-sub">Comparado com a avaliação de '+fdata(ant.data_avaliacao)+' ('+ref.n+' avaliação(ões) anterior(es) deste aluno).</div>':'<div class="ef6-sub">'+(f.nome?'Primeira avaliação deste aluno: ela será a base de comparação.':'Informe o nome do aluno na etapa 1 para comparar com avaliações anteriores.')+'</div>')+metaHTML(f,ref);
var sel=$('#ef6_status');if(sel){var o=sel.options[0];if(o)o.textContent='Automático (sugerido: '+rt+')'}}

function rascunho(){var f=atualForm(),ref=referencias(f),ant=ref.ant,L=[],sc=scoreDe(f),rt=rotulo(sc);
L.push((f.semana?f.semana+' — ':'')+'check-in'+(f.fase?' na fase de '+String(f.fase).toLowerCase():'')+'.');
if(ant){var p=[],pa=pgDe(ant),ma=mmDe(ant),ca=cinDe(ant),wa=num(ant.peso),d;
if(f.pg!=null&&pa!=null){d=f.pg-pa;p.push('o percentual de gordura '+(Math.abs(d)<.05?'se manteve estável':(d<0?'reduziu ':'aumentou ')+Math.abs(d).toFixed(1)+' p.p.')+' ('+pa.toFixed(1)+'% → '+f.pg.toFixed(1)+'%)')}
if(f.mm!=null&&ma!=null){d=f.mm-ma;p.push('a massa magra variou '+fmt(d,' kg'))}
if(f.peso!=null&&wa!=null){d=f.peso-wa;p.push('o peso variou '+fmt(d,' kg'))}
if(f.cintura!=null&&ca!=null){d=f.cintura-ca;p.push('a cintura variou '+fmt(d,' cm'))}
if(p.length)L.push('Em relação à avaliação de '+fdata(ant.data_avaliacao)+': '+p.join('; ')+'.')}
else{var b=[];if(f.pg!=null)b.push('gordura corporal de '+f.pg.toFixed(1)+'%');if(f.mm!=null)b.push('massa magra de '+f.mm.toFixed(1)+' kg');if(f.soma!=null)b.push('soma de 7 dobras de '+f.soma.toFixed(1)+' mm');
L.push('Avaliação-base do aluno'+(b.length?': '+b.join(', ')+'.':'.'))}
var ad='Aderência ao treino: '+(f.treino||'—')+'; à dieta: '+(f.dieta||'—')+'. Disposição '+f.energia+'/5, sono '+f.sono+'/5, estresse '+f.estresse+'/5. Score de aderência: '+sc+'/100 ('+rt+').';L.push(ad);
if(sc>=85)L.push('Excelente comprometimento; manter o plano atual.');else if(sc<70)L.push('A aderência abaixo do ideal pode limitar os resultados; vale reforçar a rotina e identificar as barreiras (agenda, planejamento das refeições).');
if(f.dor&&f.dor!=='Nenhuma')L.push('Relato de dor/desconforto '+f.dor.toLowerCase()+': avaliar ajustes nos exercícios e, se persistir, encaminhar a um profissional de saúde.');
if(f.metaPg!=null&&f.pg!=null)L.push('Meta de gordura: '+f.metaPg.toFixed(1)+'% ('+(Math.abs(f.pg-f.metaPg)<.05?'atingida':'faltam '+Math.abs(f.pg-f.metaPg).toFixed(1)+' p.p.')+').');
return L.join(' ')}
function gerarRascunho(){var ta=document.getElementById('parecer_profissional');if(!ta)return;var t=rascunho();ta.value=ta.value.trim()?ta.value.replace(/\s+$/,'')+'\n\n'+t:t;ta.dispatchEvent(new Event('input',{bubbles:true}));if(window.efToast)efToast('Rascunho gerado. Revise e ajuste antes de salvar.')}
function resumoTexto(){var f=atualForm(),ref=referencias(f),ant=ref.ant,sc=scoreDe(f),st=val('ef6_status')||rotulo(sc),L=[];
L.push('*Resumo da avaliação — '+(f.nome||'Aluno')+'* ('+fdata(f.data)+')');L.push('Status: '+st+' · Aderência '+sc+'/100');
var m=[];if(f.pg!=null)m.push('%G '+f.pg.toFixed(1)+'%'+(ant&&pgDe(ant)!=null?' ('+fmt(f.pg-pgDe(ant),'')+')':''));if(f.mm!=null)m.push('Massa magra '+f.mm.toFixed(1)+' kg'+(ant&&mmDe(ant)!=null?' ('+fmt(f.mm-mmDe(ant),'')+')':''));if(f.cintura!=null)m.push('Cintura '+f.cintura.toFixed(1)+' cm');
if(m.length)L.push(m.join(' · '));
[['ef6_fortes','Pontos fortes'],['ef6_atencao','Atenção'],['ef6_treino','Treino'],['ef6_dieta','Dieta'],['ef6_proximos','Próximos passos']].forEach(function(x){var v=val(x[0]).trim();if(v)L.push(x[1]+': '+v)});
var pr=val('parecer_profissional').trim();if(pr)L.push('Parecer: '+pr.slice(0,500)+(pr.length>500?'…':''));
return L.join('\n')}
function copiarResumo(){var t=resumoTexto();
function ok(){if(window.efToast)efToast('Resumo copiado ✓')}
function fb(){var ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');ok()}catch(e){alert(t)}ta.remove()}
if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(ok,fb)}else fb()}

function sincronizar(){var sel=(val('ef6_tags')||'').split(',').filter(Boolean);document.querySelectorAll('#ef6-tags .ef6-chip').forEach(function(c){c.classList.toggle('on',sel.indexOf(c.dataset.t)>-1)})}
function montarChips(){var tg=$('#ef6-tags'),fr=$('#ef6-frases');if(!tg||!fr||tg.children.length)return;
TAGS.forEach(function(t){var b=document.createElement('button');b.type='button';b.className='ef6-chip';b.dataset.t=t;b.textContent=t;b.addEventListener('click',function(){var s=(val('ef6_tags')||'').split(',').filter(Boolean),i=s.indexOf(t);if(i>-1)s.splice(i,1);else s.push(t);setv('ef6_tags',s.join(','));sincronizar();$('#checkin-form').dispatchEvent(new Event('input',{bubbles:true}))});tg.appendChild(b)});
FRASES.forEach(function(x){var b=document.createElement('button');b.type='button';b.className='ef6-chip frase';b.textContent=x[0];b.addEventListener('click',function(){var ta=document.getElementById('parecer_profissional');ta.value=(ta.value.trim()?ta.value.replace(/\s+$/,'')+' ':'')+x[1];ta.dispatchEvent(new Event('input',{bubbles:true}))});fr.appendChild(b)})}

function coletar(fd){var f=atualForm(),sc=scoreDe(f),g=function(k){return(fd.get(k)||'').toString().trim()};
return{status:g('ef6_status')||rotulo(sc),status_manual:!!g('ef6_status'),score:sc,tags:g('ef6_tags'),sono:num(g('ef6_sono')),estresse:num(g('ef6_estresse')),dor:g('ef6_dor')||'Nenhuma',meta_pgordura:num(g('ef6_meta_pg')),meta_peso:num(g('ef6_meta_peso')),meta_prazo:g('ef6_meta_prazo'),pontos_fortes:g('ef6_fortes'),pontos_atencao:g('ef6_atencao'),ajuste_treino:g('ef6_treino'),ajuste_dieta:g('ef6_dieta'),proximos_passos:g('ef6_proximos')}}
function carregar(a){var p=(a&&a.parecer_v6)||{};setv('ef6_sono',p.sono||3);setv('ef6_estresse',p.estresse||3);setv('ef6_dor',p.dor||'Nenhuma');setv('ef6_meta_pg',p.meta_pgordura==null?'':p.meta_pgordura);setv('ef6_meta_peso',p.meta_peso==null?'':p.meta_peso);setv('ef6_meta_prazo',p.meta_prazo||'');
setv('ef6_status',p.status_manual&&['Excelente','Bom','Regular','Atenção'].indexOf(p.status)>-1?p.status:'');setv('ef6_tags',p.tags||'');setv('ef6_fortes',p.pontos_fortes||'');setv('ef6_atencao',p.pontos_atencao||'');setv('ef6_treino',p.ajuste_treino||'');setv('ef6_dieta',p.ajuste_dieta||'');setv('ef6_proximos',p.proximos_passos||'');sincronizar();renderResumo()}
function limpar(){setv('ef6_tags','');sincronizar();renderResumo()}

function conquistas(a){var l=doAluno(a),prim=l[0],out=[];
if(prim&&prim.id!==a.id){var d=pgDe(a)-pgDe(prim);if(isFinite(d)&&d<=-1)out.push('🔥 '+fmt(d,' p.p.')+' de gordura');
var m=mmDe(a)-mmDe(prim);if(isFinite(m)&&m>=0.3)out.push('💪 '+fmt(m,' kg')+' de massa magra');
var c=cinDe(a)-cinDe(prim);if(isFinite(c)&&c<=-1)out.push('📏 '+fmt(c,' cm')+' de cintura')}
if(scoreAval(a)>=90)out.push('🎯 Aderência exemplar');
var p=a.parecer_v6;if(p&&p.meta_pgordura!=null&&pgDe(a)!=null&&pgDe(a)<=p.meta_pgordura+.05)out.push('🏆 Meta de gordura atingida');
if(l.length>=3)out.push('📈 '+l.length+' avaliações realizadas');return out}
function html(a,modo){if(!a)return'';var pr=modo==='print',fs=pr?'0.72rem':'0.84rem',p=a.parecer_v6||{},sc=scoreAval(a),st=p.status||rotulo(sc),c=COR[st]||COR['Bom'];
var h='<div class="ef6-laudo" style="margin-top:10px;border:1px solid #cbd5e1;border-radius:8px;padding:10px;background:#fff;font-size:'+fs+';line-height:1.5;color:#334155">';
h+='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><strong style="color:#0f172a">🧭 Síntese do check-in</strong><span style="background:'+c[0]+';color:'+c[1]+';font-weight:800;padding:2px 10px;border-radius:99px;-webkit-print-color-adjust:exact;print-color-adjust:exact">'+esc(st)+' · Aderência '+sc+'/100</span></div>';
h+='<div style="height:7px;background:#e2e8f0;border-radius:99px;overflow:hidden;margin:6px 0;-webkit-print-color-adjust:exact;print-color-adjust:exact"><div style="width:'+Math.max(0,Math.min(100,sc))+'%;height:100%;background:'+c[1]+'"></div></div>';
var tg=(p.tags||'').split(',').filter(Boolean);if(tg.length)h+='<div style="margin:4px 0">'+tg.map(function(t){return'<span style="display:inline-block;border:1px solid #cbd5e1;border-radius:99px;padding:1px 8px;margin:1px 3px 1px 0;font-size:.9em">'+esc(t)+'</span>'}).join('')+'</div>';
[['✅ Pontos fortes',p.pontos_fortes],['⚠️ Pontos de atenção',p.pontos_atencao],['🏋️ Ajustes no treino',p.ajuste_treino],['🥗 Ajustes na dieta',p.ajuste_dieta],['🚀 Próximos passos',p.proximos_passos]].forEach(function(x){if(x[1])h+='<div style="margin-top:4px"><strong>'+x[0]+':</strong> '+esc(x[1])+'</div>'});
var l=doAluno(a),prim=l[0]||a,pg=pgDe(a),ml='';
if(p.meta_pgordura!=null&&pg!=null){var pp=prog(pgDe(prim)!=null?pgDe(prim):pg,pg,p.meta_pgordura);ml+='<div>🎯 Meta de gordura '+Number(p.meta_pgordura).toFixed(1)+'% — progresso '+pp+'%'+(pr?'':barra(pp))+'</div>'}
if(p.meta_peso!=null&&num(a.peso)!=null){var p3=prog(num(prim.peso)!=null?num(prim.peso):num(a.peso),num(a.peso),p.meta_peso);ml+='<div>⚖️ Meta de peso '+Number(p.meta_peso).toFixed(1)+' kg — progresso '+p3+'%</div>'}
if(p.meta_prazo)ml+='<div>Prazo da meta: '+fdata(p.meta_prazo)+'</div>';if(ml)h+='<div style="margin-top:6px;border-top:1px dashed #cbd5e1;padding-top:4px">'+ml+'</div>';
var cq=conquistas(a);if(cq.length)h+='<div style="margin-top:6px;border-top:1px dashed #cbd5e1;padding-top:4px"><strong>Conquistas:</strong> '+cq.map(esc).join(' &nbsp;·&nbsp; ')+'</div>';
return h+'</div>'}

function init(){montarChips();var form=$('#checkin-form');if(!form)return;var t=null;
form.addEventListener('input',function(){clearTimeout(t);t=setTimeout(renderResumo,220)});form.addEventListener('change',renderResumo);
var s5=document.querySelector('.step[data-step="5"]');if(s5)new MutationObserver(function(){if(s5.classList.contains('active'))renderResumo()}).observe(s5,{attributes:true,attributeFilter:['class']});
var b1=$('#ef6-btn-rascunho'),b2=$('#ef6-btn-copiar');if(b1)b1.addEventListener('click',gerarRascunho);if(b2)b2.addEventListener('click',copiarResumo);
renderResumo();
try{if(!localStorage.getItem('ef6_novidades')){localStorage.setItem('ef6_novidades','1');setTimeout(function(){if(window.efToast)efToast('Novidades: score e tendências por aluno, parecer inteligente e rascunho automático (etapa 5).')},1800)}}catch(e){}}

var _sw=window.switchTab;
window.switchTab=function(id){var r=_sw.apply(this,arguments);if(id==='tab-painel'){try{painel()}catch(e){console.error(e)}}return r};
function painel(){var cols=$('.ef55-cols');if(!cols)return;var old=$('#ef6-pn');if(old)old.remove();var m={};
lista().forEach(function(a){var k=EFIdentity.key(a);if(k&&(!m[k]||String(a.data_avaliacao||'')>=String(m[k].data_avaliacao||'')))m[k]=a});
var ar=Object.keys(m).map(function(k){return{a:m[k],s:scoreAval(m[k])}}).filter(function(x){return x.s<70}).sort(function(x,y){return x.s-y.s}).slice(0,6);
var card=document.createElement('div');card.className='ef55-card';card.id='ef6-pn';
card.innerHTML='<h3>Atenção à aderência<em>'+ar.length+'</em></h3>'+(ar.length?ar.map(function(x){var cl=x.s<50?'bad':'warn';return'<div class="ef55-row" onclick="ef55Abrir(\''+jsEsc(x.a.id)+'\')"><div class="ef55-av">'+esc((x.a.nome||'?').trim().split(/\s+/).map(function(w,i,arr){return(i===0||i===arr.length-1)?w[0]:''}).join('').toUpperCase())+'</div><div class="t"><b>'+esc(x.a.nome)+'</b><span>'+fdata(x.a.data_avaliacao)+'</span></div><span class="ef55-pill '+cl+'">Score '+x.s+'</span></div>'}).join(''):'<div class="ef55-empty">Todos os alunos com boa aderência 🎉</div>');
cols.appendChild(card)}

window.EF6={html:html,coletar:coletar,carregar:carregar,limpar:limpar,sincronizar:sincronizar,scoreDe:scoreDe,scoreAval:scoreAval,rotulo:rotulo,rascunho:rascunho,gerarRascunho:gerarRascunho,resumoTexto:resumoTexto,renderResumo:renderResumo,copiarResumo:copiarResumo,conquistas:conquistas};
init();
})();
