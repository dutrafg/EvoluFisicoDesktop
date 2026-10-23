
/* Análises automáticas por aluno. Consome caches dos motores EF68 e EF70; não recalcula nem altera registros. */
(()=>{
 'use strict';
 const state=window.__EF63_STATE__;
 let selectedKey='', lastSignature='', refreshQueued=false, observer=null;
 const picksByStudent=new Map(), draftPicksByStudent=new Map(), manualKeys=new Set();
 const YYYYMMDD=v=>window.EFUnifiedSafety?.dateKey?.(v)||null;
 function available(profile){
  // Only valid dates and student-linked existing assessments qualify.
  const rows=(profile?.timeline||[]).filter(x=>YYYYMMDD(x.data));
  const byDay=new Map();rows.slice().sort((a,b)=>String(a.data).localeCompare(String(b.data))||String(a.id).localeCompare(String(b.id))).forEach(r=>{
   if(!byDay.has(r.data))byDay.set(r.data,{id:String(r.id),data:String(r.data)});
  });
  return [...byDay.values()].sort((a,b)=>a.data.localeCompare(b.data));
 }
 function initialPicks(profile){return available(profile).slice(-4).map(r=>r.id)}
 function reconcile(profile){
  const key=String(profile.key),availableIds=new Set(available(profile).map(x=>x.id));
  let chosen=picksByStudent.get(key);
  if(!chosen){chosen=initialPicks(profile);picksByStudent.set(key,chosen)}
  chosen=chosen.filter(id=>availableIds.has(id));
  if(!manualKeys.has(key)&&chosen.length<4&&availableIds.size>chosen.length)chosen=initialPicks(profile);
  picksByStudent.set(key,chosen);
  const prior=draftPicksByStudent.get(key);
  if(!manualKeys.has(key)||!prior||prior.some(id=>id&&!availableIds.has(id)))draftPicksByStudent.set(key,[...chosen,'','','',''].slice(0,4));
  return chosen;
 }
 function applyPicks(key,choices){
  const base=source().basic.studentsData.find(x=>x.key===key);
  if(!base)return {ok:false,message:'Selecione um aluno cadastrado.'};
  const known=available(base),map=new Map(known.map(r=>[r.id,r.data]));
  const ids=choices.filter(Boolean).map(String);
  if(ids.length>4||new Set(ids).size!==ids.length||ids.some(id=>!map.has(id))){return {ok:false,message:'Escolha avaliações diferentes pertencentes ao aluno selecionado.'}}
  const dates=ids.map(id=>map.get(id));
  if(new Set(dates).size!==dates.length)return {ok:false,message:'Cada avaliação deve pertencer a uma data diferente.'};
  if(known.length>=3&&ids.length<3)return {ok:false,message:'Selecione três datas obrigatórias; a quarta é opcional.'};
  if(known.length<3)return {ok:false,message:'O aluno ainda não possui três avaliações em datas distintas. Cadastre mais avaliações antes de calcular os índices.'};
  const ordered=ids.sort((a,b)=>map.get(a).localeCompare(map.get(b)));
  manualKeys.add(key);picksByStudent.set(key,ordered);draftPicksByStudent.set(key,[...ordered,'','','',''].slice(0,4));
  return {ok:true,message:'Período aplicado: '+ordered.length+' avaliações em datas distintas.'};
 }
 
 const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const fmt=(v,dec=1)=>v==null||!Number.isFinite(Number(v))?'—':Number(v).toLocaleString('pt-BR',{minimumFractionDigits:dec,maximumFractionDigits:dec});
 const date=v=>{if(!v)return 'Data não informada';let d=/^\d{4}-\d\d-\d\d$/.test(v)?new Date(v+'T12:00:00'):new Date(v);return Number.isNaN(d.getTime())?'Data não informada':d.toLocaleDateString('pt-BR')};
 const active=()=>!!document.querySelector('#tab-analises.active');
 function source(){
  const basic=window.EF68?.all?.(),decision=window.EF70?.all?.();
  return {basic:basic||{studentsData:[],records:0},decision:decision||{studentsData:[]}};
 }
 function selected(data){
  const profiles=data.basic.studentsData;
  if(!profiles.length){selectedKey='';return null}
  if(!profiles.some(x=>x.key===selectedKey))selectedKey=profiles[0].key;
  const base=profiles.find(x=>x.key===selectedKey),ids=reconcile(base);
  const allowed=new Set((base.timeline||[]).map(x=>String(x.id)));
  const picked=new Set(ids.filter(id=>allowed.has(id)));
  const raw=typeof state?.getAvaliacoes==='function'?state.getAvaliacoes():[];
  const records=raw.filter(r=>picked.has(String(r.id))&&window.EFIdentity?.key?.(r)===selectedKey);
  return window.EF68?.analyzeRecords?.(selectedKey,records)||base;
 }
 function eligibility(profile){
  if(!profile)return {ready:false,validDates:0,missing:3,reason:'Nenhum aluno com histórico selecionado.'};
  const all=typeof state?.getAvaliacoes==='function'?state.getAvaliacoes():[];
  const idSet=new Set((profile.timeline||[]).map(row=>String(row.id)));
  const dates=new Set();
  for(const r of all){
   if(!r||!idSet.has(String(r.id))||window.EFIdentity?.key?.(r)!==String(profile.key))continue;
   const day=YYYYMMDD(r.data_avaliacao);
   if(day)dates.add(day);
  }
  const n=dates.size,days=n>=2?(Date.parse([...dates].sort().at(-1))-Date.parse([...dates].sort()[0]))/86400000:0;
  const ready=n>=3&&days>=21;
  const reason=n<3?`O aluno possui somente ${n} ${n===1?'avaliação válida em data distinta':'avaliações válidas em datas distintas'}. É necessário ter pelo menos 3 avaliações em dias diferentes antes de interpretar indicadores, padrões e trajetória.`:days<21?`As ${n} datas disponíveis abrangem apenas ${days} dias. São necessários pelo menos 21 dias entre a primeira e a última avaliação para interpretar a trajetória.`:'';
  return {ready,validDates:n,missing:Math.max(0,3-n),spanDays:days,reason};
 }
 function chosenDecision(profile){
  if(!profile)return null;
  const ids=new Set((profile.timeline||[]).map(x=>String(x.id)));
  const records=(state?.getAvaliacoes?.()||[]).filter(r=>ids.has(String(r.id))&&window.EFIdentity?.key?.(r)===profile.key);
  return window.EF70?.analyzeRecords?.(profile.key,records)||null;
 }
 function metric(label,value,unit){const keys={'Peso':'peso','Gordura corporal':'gordura','Gordura':'gordura','Massa magra':'massa-magra','Cintura':'cintura','Pollock':'pollock','Bioimpedância':'bia','Concordância':'divergencia','Navy (Lab)':'navy','RFM (Lab)':'rfm','Cintura/estatura':'whtr'};const key=keys[label];return `<div class="efu-metric"><small>${esc(label)}${key?` <button type="button" class="efu-help-mini" data-ef-glossary="${key}" aria-label="Explicar ${esc(label)}">?</button>`:''}</small><strong>${esc(value)}</strong><span>${esc(unit)}</span></div>`}
 function listFinding(ev){let level=['warn','info','good'].includes(ev.severity)?ev.severity:'info';return `<div class="efu-finding" data-severity="${level}"><b>${esc(ev.title||'Observação')}</b><p>${esc(ev.text||'')}</p></div>`}
 function sections(profile,detail){
  const lab=window.EFUnifiedLab?.confidence(profile,detail)||{base:detail?.confidence??null,adjusted:detail?.confidence??null,reason:'Laboratório indisponível',latest:null,paired:0};
  const safe=window.EFUnifiedSafety?.audit(profile,detail,lab);
  const history=profile.timeline||[], latest=profile.last||{},lastChange=safe?.delta||{};
  const stats=[['Peso',latest.peso,'kg'],['Gordura corporal',latest.gordura,'%'],['Massa magra',latest.massaMagra,'kg'],['Cintura',latest.cintura,'cm']];
  const latestCards=stats.map(([name,val,unit])=>metric(name,val==null?'—':fmt(val),unit)).join('');
  const changes=[['Peso','peso','kg'],['Gordura','gordura','p.p.'],['Massa magra','massaMagra','kg'],['Cintura','cintura','cm']].map(([name,k,unit])=>{
   const val=lastChange[k];return metric(name,val==null?'—':(val>0?'+':'')+fmt(val),val==null?'Sem dados comparáveis':unit+' em relação à anterior');
  }).join('');
  const consistency=['gordura','massaMagra','cintura','peso'].map(k=>{
   const c=safe?.canTrend&&safe?.dates>=4&&safe?.days>=60?profile.consistency?.[k]:null,label={gordura:'Gordura corporal',massaMagra:'Massa magra',cintura:'Cintura',peso:'Peso'}[k];
   return metric(label,c?.ratio!=null?Math.round(c.ratio*100)+'%':'—',c?.ratio==null?'Mínimo de 3 avaliações comparáveis':c.label||'Consistência');
  }).join('');
  const rawEvents=safe?.events||[];const dedup=new Map();
  rawEvents.forEach(e=>{const key=[e.title,e.text].join('|');if(!dedup.has(key))dedup.set(key,e)});
  const events=Array.from(dedup.values()),attention=events.filter(e=>e.severity==='warn'||['plateau','gap','oscillation','reversal'].includes(e.type));
  const actions=(safe?.actions||[]).map(a=>({title:a.priority==='attention'?'Ponto de acompanhamento':'Próxima ação',text:a.text,severity:a.priority==='attention'?'warn':'info'}));
  const projections=''; // Sem projeção numérica futura baseada em poucas medidas.
  const original=(typeof state?.getAvaliacoes==='function'?state.getAvaliacoes():[]).find(r=>String(r.id)===String(latest.id));
  const groupSummary=(title,obj)=>{
   if(!obj||typeof obj!=='object'||Array.isArray(obj))return '';
   const parts=Object.entries(obj).filter(([key,v])=>/^[a-zA-ZÀ-ÿ_0-9-]{1,60}$/.test(key)&&(['string','number'].includes(typeof v))&&String(v).length<=64&&v!==''&&v!==null).slice(0,40);
   if(!parts.length)return '';
   return `<h4 class="efu-measure-title">${esc(title)}</h4><div class="efu-metrics">${parts.map(([key,v])=>metric(key.replace(/_/g,' '),String(v),'Dado cadastrado')).join('')}</div>`;
  };
  const moreMeasurements=(original?groupSummary('Perímetros e medidas',original.perimetria)+groupSummary('Bioimpedância',original.bioimpedancia)+groupSummary('Resultados de dobras cutâneas',original.dobras_resultado):'');
  const assessmentRows=history.slice().reverse().map(r=>`<tr><td>${esc(date(r.data))}</td><td>${esc(fmt(r.peso))}</td><td>${esc(fmt(r.gordura))}</td><td>${esc(fmt(r.cintura))}</td><td><button type="button" class="efu-action" data-ef-eval-id="${esc(r.id)}">Ver</button></td></tr>`).join('');
  const section=(title,content,open)=>`<details class="efu-section" ${open?'open':''}><summary>${esc(title)}</summary><div class="efu-section-body">${content}</div></details>`;
  return `<div class="efu-context"><span class="efu-chip">${history.length} ${history.length===1?'avaliação':'avaliações'}</span><span class="efu-chip">Primeira: ${esc(date(history[0]?.data))}</span><span class="efu-chip">Última: ${esc(date(latest.data))}</span></div>
   ${safe?.warnings?.length?`<div class="efu-safety-notes" role="note"><strong>Qualidade e limites dos dados</strong><ul>${safe.warnings.map(w=>`<li>${esc(w.text)}</li>`).join('')}</ul></div>`:''}
   <div class="efu-kpis">
    <div class="efu-kpi"><small>Trajetória <button type="button" class="efu-help-mini" data-ef-glossary="trajetoria" aria-label="Explicar Trajetória">?</button></small><strong>${!safe?.canTrend||safe?.confidence==null||detail?.score?.value==null?'—':esc(String(detail.score.value)+'/100')}</strong><span>${esc(safe?.canTrend&&safe?.confidence!=null?(detail?.score?.label||'Índice exploratório'):'Dados insuficientes para índice de trajetória')}</span></div>
    <div class="efu-kpi"><small>Qualidade dos dados <button type="button" class="efu-help-mini" data-ef-glossary="qualidade" aria-label="Explicar Qualidade dos dados">?</button></small><strong>${safe?.confidence==null?'—':esc(String(safe.confidence)+'/100')}</strong><span>${esc(safe?.quality||'Dados insuficientes')} • escala heurística não validada clinicamente</span></div>
    <div class="efu-kpi"><small>Sinais de atenção <button type="button" class="efu-help-mini" data-ef-glossary="sinais" aria-label="Explicar Sinais de atenção">?</button></small><strong>${attention.length}</strong><span>Ocorrências que merecem acompanhamento</span></div>
    <div class="efu-kpi"><small>Padrões identificados <button type="button" class="efu-help-mini" data-ef-glossary="padroes" aria-label="Explicar Padrões identificados">?</button></small><strong>${events.length}</strong><span>Eventos e relações detectados</span></div>
   </div>
   ${section('Medidas da última avaliação',`<div class="efu-metrics">${latestCards}</div>`,false)}
   ${section('Laboratório e qualidade das evidências',`<div class="efu-lab-evidence"><strong>${esc(lab.reason)}</strong>Comparações independentes: ${esc(String(lab.paired||0))}. Modelos Navy/RFM são estimativas derivadas; não contam como nova medição.</div><div class="efu-metrics">${metric('Pollock',lab.latest?.pollock==null?'—':fmt(lab.latest.pollock)+'%','Dado registrado')}${metric('Bioimpedância',lab.latest?.bia==null?'—':fmt(lab.latest.bia)+'%','Dado registrado')}${metric('Concordância',lab.latest?.delta==null?'—':fmt(lab.latest.delta)+' p.p.','Diferença entre métodos')}${metric('Navy (Lab)',lab.latest?.navy==null?'—':fmt(lab.latest.navy)+'%','Estimativa antropométrica')}${metric('RFM (Lab)',lab.latest?.rfm==null?'—':fmt(lab.latest.rfm)+'%','Estimativa antropométrica')}${metric('Cintura/estatura',lab.latest?.whtr??'—','Índice derivado')}</div>`,false)}
   ${section('Demais medições cadastradas',moreMeasurements||'<p class="efu-notice">Nenhuma medida complementar nesta avaliação. Abra a ficha completa para consultar todos os campos disponíveis.</p>',false)}
   ${section('Mudanças desde a avaliação anterior',safe?.canCompare?`<div class="efu-metrics">${changes}</div>`:'<p class="efu-notice">São necessárias duas medições comparáveis em datas válidas separadas por pelo menos sete dias.</p>',true)}
   ${section('Consistência e possíveis platôs',`<div class="efu-metrics">${consistency}</div><p class="efu-notice">Consistência exibida somente com quatro datas distintas e acompanhamento de pelo menos 60 dias; não confirma melhora clínica.</p>`,false)}
   ${section('Padrões e sinais de atenção',events.length?`<div class="efu-findings">${events.map(listFinding).join('')}</div>`:'<p class="efu-notice">Ainda não há avaliações suficientes para identificar padrões combinados ou platôs com confiança.</p>',events.length>0)}
   ${section('Próximas ações de acompanhamento',actions.length?`<div class="efu-findings">${actions.map(listFinding).join('')}</div>`:'<p class="efu-notice">Sem ações automáticas adicionais. Considere o contexto individual e o próximo acompanhamento.</p>',false)}
   ${section('Histórico completo das avaliações',`<div class="efu-history"><table><thead><tr><th>Data</th><th>Peso (kg)</th><th>Gordura (%)</th><th>Cintura (cm)</th><th>Abrir</th></tr></thead><tbody>${assessmentRows}</tbody></table></div><p class="efu-notice">Abra uma avaliação para consultar os demais campos cadastrados, formulários, perímetros e registros associados.</p>`,false)}
   ${section('Extrapolações matemáticas','<p class="efu-notice">Projeções numéricas futuras foram desativadas por não representarem previsões confiáveis para decisões individuais.</p>',false)}
   <p class="efu-foot">Análise por aluno • Motores de dados EF68 e EF70 • Dados recuperados do histórico existente, sem gravações clínicas adicionais. Índices matemáticos exploratórios, não diagnósticos ou probabilidades clínicas; interpretação profissional obrigatória.</p>`;
 }
 function openAssessment(id){
  const f=['abrirModalDetalhes','abrirVisualizacaoPacienteWeb','verDetalhesAvaliacao','ef55Abrir','abrir'].find(name=>typeof window[name]==='function');
  if(f){try{window[f](id);return}catch(e){console.warn('Detalhe indisponível',e)}}
  if(typeof window.switchTab==='function')window.switchTab('tab-historico');
 }
 function getOrCreateCard(){
  const host=document.getElementById('ef-analysis-container');if(!host)return null;
  let card=document.getElementById('ef-home-insights');
  if(card&&card.parentNode!==host)host.append(card);
  if(!card){
   card=document.createElement('details');card.id='ef-home-insights';card.className='ef-unified';
   card.innerHTML='<summary>Análises automáticas</summary><div class="efu-root"></div>';host.append(card);
  }
  card.open=true;
  if(!card.querySelector('.efu-root'))card.innerHTML='<summary>Análises automáticas</summary><div class="efu-root"></div>';
  return card;
 }
 function render(force=false){
  if(!active())return;
  const data=source(),profile=selected(data),card=getOrCreateCard();if(!card)return;
  const sig=String(state?.version??0)+'|'+String(profile?.key||'')+'|'+String(data.basic.records)+'|'+String(profile?.count||0)+'|'+(profile?.timeline||[]).map(r=>String(r.id)).join(',');
  if(!force&&card.dataset.efUnifiedSignature===sig&&card.querySelector('.efu-root .efu-header'))return;
  const body=card.querySelector('.efu-root');if(!body)return;
  const options=data.basic.studentsData.map(s=>`<option value="${esc(s.key)}" ${s.key===selectedKey?'selected':''}>${esc(s.name)} (${s.count})</option>`).join('');
  const decision=chosenDecision(profile);
  const base=data.basic.studentsData.find(p=>p.key===selectedKey);
  const known=base?available(base):[],chosen=base?reconcile(base):[];
  const draft=base?draftPicksByStudent.get(selectedKey)||[...chosen,'','','',''].slice(0,4):['','','',''];
  const availableOptions=[...known].sort((a,b)=>b.data.localeCompare(a.data));
  const gate=eligibility(profile);
  const ready=gate.ready&&chosen.length>=3&&known.length>=3;
  const blockedText=!gate.ready?gate.reason:'Escolha pelo menos 3 avaliações de datas diferentes e clique em Aplicar seleção.';
  const unavailableHtml=`<section class="efu-analysis-blocked" role="alert" aria-live="polite"><div class="efu-block-title"><span aria-hidden="true">⚠️</span><h4>Análises automáticas bloqueadas</h4></div><p>${esc(blockedText)}</p><p><strong>${gate.missing>0?`Faltam ${gate.missing} ${gate.missing===1?'avaliação válida':'avaliações válidas'}`:'Intervalo temporal insuficiente'}</strong>. O módulo requer três datas distintas e pelo menos 21 dias entre a primeira e a última. Até cumprir esses critérios, trajetória, índices de qualidade, padrões, recomendações automáticas e emissão de relatório permanecem indisponíveis para evitar interpretações incorretas.</p><p>Você pode continuar consultando a ficha e cadastrando avaliações do aluno.</p></section>`;
  const slot=(i)=>{const value=draft[i]||'';return `<label class="efu-date-field" for="efu-date-${i}"><span>${i+1}ª avaliação ${i<3?'• obrigatória':'• opcional'}</span><select id="efu-date-${i}" data-efu-pick="${i}" ${i<3?'required':''}><option value="">${i<3?'Selecione uma data':'Nenhuma (opcional)'}</option>${availableOptions.map(r=>`<option value="${esc(r.id)}" ${value===r.id?'selected':''}>${esc(date(r.data))}</option>`).join('')}</select></label>`};
  const selectionHtml=base?`<div class="efu-sample-picker"><div class="efu-sample-heading"><strong>Escolher datas para comparar</strong><span>3 obrigatórias + 1 opcional</span></div><p>Selecione avaliações do mesmo aluno em datas diferentes. Indicadores usam somente essas avaliações; a escolha não aumenta automaticamente a qualidade dos dados.</p><div class="efu-date-grid">${[0,1,2,3].map(slot).join('')}</div><div class="efu-sample-actions"><button type="button" class="efu-action efu-picks-apply" ${known.length<3?'disabled':''}>Aplicar seleção</button><button type="button" class="efu-action efu-picks-latest">Selecionar últimas 4</button><span class="efu-selection-status" role="status" aria-live="polite">${ready?`${chosen.length} datas selecionadas para análise`: `Bloqueado: ${gate.validDates}/3 avaliações válidas; ${known.length} datas disponíveis para selecionar`}</span></div></div>`:'';
  body.innerHTML=`<header class="efu-header"><div class="efu-heading"><h3>🧠 Análises automáticas</h3><p class="efu-subtitle">Mudanças, consistência, platôs e sinais de atenção. Trajetória, confiança e próximos acompanhamentos reunidos para o aluno selecionado.</p></div><div class="efu-controls"><label class="efu-selector" for="efu-student-select">Selecionar aluno<select id="efu-student-select" aria-label="Selecionar aluno para análise">${options||'<option value="">Nenhum aluno com avaliação</option>'}</select></label><div class="efu-demo-bar"><span>Dados para testes: 2 alunos · 4 avaliações cada (30, 60, 90 e 120 dias).</span><button type="button" class="efu-action efu-demo-load">Inserir alunos de exemplo</button><button type="button" class="efu-action efu-demo-remove">Remover exemplos</button></div>${selectionHtml}<div class="efu-links"><button type="button" class="efu-action efu-open-profile" ${profile?'':'disabled'}>Abrir ficha completa</button><button type="button" class="efu-action efu-open-forms" ${profile?'':'disabled'}>Ver anamneses</button><button type="button" class="efu-action efu-report-start" ${ready?'':'disabled title="Selecione pelo menos três avaliações em datas distintas"'}>Gerar / editar relatório</button></div></div></header><div class="efu-detail">${ready&&profile?sections(profile,decision):unavailableHtml}</div>`;
  if(profile&&window.EFIAView){try{window.EFIAView.render(body.querySelector('.efu-detail'),{profileKey:selectedKey,selectedIds:chosen,name:profile.name});}catch(error){console.error('EFIA Desktop',error);}}
  body.querySelectorAll('[data-efu-pick]').forEach(el=>el.addEventListener('change',()=>{
   if(!base)return;
   draftPicksByStudent.set(selectedKey,[0,1,2,3].map(i=>body.querySelector('#efu-date-'+i)?.value||''));
   const status=body.querySelector('.efu-selection-status');if(status)status.textContent='Seleção alterada; clique em Aplicar seleção.';
  }));
  // Preserve a stable on-screen anchor while rebuilding a sample that changes
  // the result height. Without this, mobile browsers may jump the document to
  // its former bottom or to the top when focused <select> nodes are replaced.
  function keepSampleViewport(update,anchorSelector,focusSelector){
   const anchor=document.querySelector(anchorSelector)||document.getElementById('ef-home-insights');
   const expectedTop=anchor?.getBoundingClientRect().top;
   update();
   if(expectedTop===undefined)return;
   const restore=()=>{
    const next=document.querySelector(anchorSelector)||document.getElementById('ef-home-insights');
    if(!next||!next.isConnected)return;
    const delta=next.getBoundingClientRect().top-expectedTop;
    if(Math.abs(delta)>1){
     const scrollRoot=document.scrollingElement||document.documentElement;
     const root=scrollRoot?.scrollTop||0;
     window.scrollTo({top:Math.max(0,root+delta),behavior:'instant'});
    }
   };
   restore();
   requestAnimationFrame(()=>{
    restore();
    const node=focusSelector&&document.querySelector(focusSelector);
    // Re-focus without letting the browser scroll to a different part of page.
    if(node&&typeof node.focus==='function')node.focus({preventScroll:true});
    requestAnimationFrame(restore);
   });
  }
  body.querySelector('.efu-picks-apply')?.addEventListener('click',()=>{
   if(!base)return;
   const result=applyPicks(selectedKey,[0,1,2,3].map(i=>body.querySelector('#efu-date-'+i)?.value||''));
   if(result.ok)keepSampleViewport(()=>render(true),'#ef-home-insights .efu-sample-picker','.efu-picks-apply');
   const status=document.querySelector('#ef-home-insights .efu-selection-status');
   if(status){status.textContent=result.message;if(result.ok)status.setAttribute('data-applied','true')}
  });
  body.querySelector('.efu-picks-latest')?.addEventListener('click',()=>{
   if(!base)return;
   keepSampleViewport(()=>{
    manualKeys.delete(selectedKey);const latest=initialPicks(base);draftPicksByStudent.set(selectedKey,[...latest,'','','',''].slice(0,4));
    if(latest.length>=3){applyPicks(selectedKey,latest)}else{picksByStudent.set(selectedKey,latest)}
    render(true);
   },'#ef-home-insights .efu-sample-picker','.efu-picks-latest');
  });
  body.querySelector('#efu-student-select')?.addEventListener('change',e=>{
   const newKey=e.target.value;
   keepSampleViewport(()=>{selectedKey=newKey;render(true)},'#ef-home-insights .efu-controls','#efu-student-select');
  });
  body.querySelector('.efu-open-profile')?.addEventListener('click',()=>{if(profile?.last?.id)openAssessment(profile.last.id)});
  body.querySelector('.efu-report-start')?.addEventListener('click',()=>{if(ready&&eligibility(profile).ready)window.EFUnifiedReport?.open(profile,decision,window.EFUnifiedLab?.confidence(profile,decision))});
  body.querySelector('.efu-open-forms')?.addEventListener('click',()=>{if(!profile)return;const opened=window.EF2Forms?.openForClient?.(profile.key);if(!opened&&typeof window.switchTab==='function')window.switchTab('tab-ef-forms')});
  body.querySelectorAll('details.efu-section > summary').forEach(summary=>summary.addEventListener('click',()=>{const before=summary.getBoundingClientRect().top;requestAnimationFrame(()=>requestAnimationFrame(()=>{if(!summary.isConnected)return;const change=summary.getBoundingClientRect().top-before;if(Math.abs(change)>1)window.scrollBy({top:change,behavior:'instant'});}))}));
  body.querySelectorAll('[data-ef-eval-id]').forEach(btn=>btn.addEventListener('click',()=>openAssessment(btn.dataset.efEvalId)));
  card.dataset.efUnifiedSignature=sig;
  window.EFPrototypeEditor?.refresh?.();
 }
 function queue(){if(refreshQueued)return;refreshQueued=true;requestAnimationFrame(()=>{refreshQueued=false;render()})}
 function init(){
  render();
  observer=new MutationObserver(records=>{
   if(!active())return;
   // Evita reconstrução durante atualizações internas ou remanejamento do editor.
   if(!records.some(r=>Array.from(r.removedNodes).some(n=>n.nodeType===1&&(n.id==='ef-home-insights'||n.id==='ef-proto-grid'||n.id==='ef-analysis-container'))||Array.from(r.addedNodes).some(n=>n.nodeType===1&&(n.id==='ef55-painel'||n.id==='ef-proto-grid'||n.id==='ef-analysis-container'))))return;
   queue();
  });observer.observe(document.body,{childList:true,subtree:true});
  const orig=window.switchTab;
  if(typeof orig==='function'){window.switchTab=function(){const out=orig.apply(this,arguments);if(arguments[0]==='tab-analises')queue();return out}}
  if(state&&typeof state.touch==='function'){const touch=state.touch;state.touch=function(){const out=touch.apply(this,arguments);queue();return out}}
 }
 window.EFUnifiedAnalysis=Object.freeze({refresh:()=>render(true),getSelectedKey:()=>selectedKey,select:key=>{selectedKey=key;render(true)},getData:source,getEligibility:()=>eligibility(selected(source())),isReportAvailable:()=>eligibility(selected(source())).ready});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
