/* Integrated view only. Selection and records belong to EvoluFisico2. No network or new database. */
(()=>{'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>v===null||v===undefined||!Number.isFinite(v)?'Não informado':v.toLocaleString('pt-BR',{maximumFractionDigits:2});
const date=s=>String(s||'').split('-').reverse().join('/');
const METRICS=[['peso','Peso','kg'],['cintura','Cintura','cm'],['gordura','Gordura corporal estimada','%'],['massaMagra','Massa livre de gordura','kg']];
const EXPLAIN='<h3>O que é a Análise Física Integrada?</h3><p>Este relatório reúne avaliações realizadas em datas diferentes e acompanha, em conjunto, as mudanças no peso, nas medidas corporais e na composição corporal estimada. O EvoluFísico verifica se os dados podem ser comparados e apresenta os resultados por meio de gráficos e explicações simples.</p><p>O objetivo é ajudar o aluno e o profissional a compreender sua trajetória física. As informações auxiliam o acompanhamento e não substituem a interpretação do profissional responsável.</p>';
const help={lean:'É uma estimativa de tudo que compõe seu corpo, exceto a gordura. Inclui músculos, água, ossos e outros tecidos.',quality:'Confere se os registros estão completos e podem ser comparados. Não mede precisão clínica.',muscle:'Massa muscular esquelética registrada pelo aparelho. É diferente da massa livre de gordura.',change:'A diferença entre duas medidas não confirma uma mudança real. É necessário conhecer o erro do método.'};
const drafts=new Map();let current=null,activeTab='summary';
const table=(headers,rows)=>`<div class="efia-table-wrap"><table><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const card=(title,body)=>`<section class="efia-card"><h3>${esc(title)}</h3>${body}</section>`;
const list=a=>a.length?'<ul>'+a.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<p>Sem observações adicionais.</p>';
const info=key=>`<button type="button" class="efia-help" data-efia-help="${key}" aria-label="Explicar ${key==='lean'?'massa livre de gordura':key==='muscle'?'massa muscular':key==='quality'?'qualidade dos dados':'variações'}">?</button>`;
function canCompare(result,key){return result.eligible&&window.EFIALocal.comparable(result.records,key)&&(!['gordura','massaMagra'].includes(key)||(!result.engines.EF80.issues.length&&!result.engines.EF80.massBalance.some(x=>x.status==='incompatible')))}
function plot(result,key,label,unit){
 if(!canCompare(result,key))return '<p class="efia-note">Não disponível: série bloqueada ou sem comparabilidade confirmada.</p>';
 const rows=result.records.filter(r=>r.metrics[key]!==null);if(rows.length<3)return '<p>Não disponível: menos de três medições válidas.</p>';
 const values=rows.map(r=>r.metrics[key]),min=Math.min(...values),max=Math.max(...values),pad=Math.max((max-min)*.15,.5),lo=min-pad,hi=max+pad,span=rows.at(-1).day-rows[0].day;
 const points=rows.map(r=>({x:55+450*(r.day-rows[0].day)/span,y:155-120*(r.metrics[key]-lo)/(hi-lo),r}));
 return `<svg class="efia-chart" viewBox="0 0 560 195" role="img" aria-label="${esc(label)} (${esc(unit)}): ${esc(rows.map(r=>date(r.date)+': '+fmt(r.metrics[key])).join('; '))}" xmlns="http://www.w3.org/2000/svg"><path d="M55 20V155H520" fill="none" stroke="currentColor" opacity=".3"/>${rows.length===result.records.length?`<polyline points="${points.map(p=>p.x.toFixed(2)+','+p.y.toFixed(2)).join(' ')}"/>`:''}${points.map(p=>`<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="4"><title>${esc(date(p.r.date)+': '+fmt(p.r.metrics[key])+' '+unit)}</title></circle><text x="${p.x.toFixed(2)}" y="180" text-anchor="middle">${esc(date(p.r.date).slice(0,5))}</text>`).join('')}<text x="2" y="25">${esc(fmt(hi))}</text><text x="2" y="155">${esc(fmt(lo))}</text></svg>`;
}
function historical(result){return table(['Data',...METRICS.map(m=>m[1]+' ('+m[2]+')'),'Método'],result.records.map(r=>[date(r.date),...METRICS.map(([k])=>fmt(r.metrics[k])),r.method||'Não informado']))}
function changes(result){const first=result.records[0],last=result.records.at(-1);return table(['Indicador','Inicial','Atual','Variação'],METRICS.map(([k,l,u])=>[l+' ('+u+')',fmt(first?.metrics[k]),fmt(last?.metrics[k]),canCompare(result,k)?fmt(result.engines.EF79.results[k].change):'Não disponível']))}
function professional(result){
 const rows=result.recordsRaw.map((r,i)=>{const n=result.records.find(x=>x.id===String(r.id));const a=EFIAAnthro.capture({...r,metrics:n?.metrics});return {raw:r,n,a}});
 const fields=(defs,get)=>table(['Indicador',...rows.map(r=>date(r.n.date)),'Variação'],defs.map(([k,l])=>{const vals=rows.map(get).map(a=>a[k]);const delta=vals[0]!==null&&vals.at(-1)!==null?vals.at(-1)-vals[0]:null;return [l,...vals.map(fmt),fmt(delta)]}));
 const extraPerimeters=[...new Set(rows.flatMap(r=>Object.keys(r.raw.perimetria||{})))].filter(k=>!EFIAAnthro.perimeters.some(d=>d[0]===k)&&/^[a-zA-ZÀ-ÿ_0-9-]{1,60}$/.test(k)&&rows.some(r=>EFIAAnthro.number(r.raw.perimetria?.[k],1,260)!==null));
 const otherPerimeters=extraPerimeters.length?table(['Outras medidas (cm)',...rows.map(r=>date(r.n.date))],extraPerimeters.map(k=>[k.replace(/_/g,' '),...rows.map(r=>fmt(EFIAAnthro.number(r.raw.perimetria?.[k],1,260)))])):'';
 const comp=table(['Data','Peso (kg)','IMC','Gordura (%)','Massa gorda (kg)','Massa livre de gordura (kg)','Muscular esquelética (kg)'],rows.map(({n,a})=>[date(n.date),fmt(n.metrics.peso),fmt(a.imc),fmt(n.metrics.gordura),fmt(a.fatMass),fmt(n.metrics.massaMagra),fmt(a.muscle)]));
 const protocol=table(['Data','Método','Equação/protocolo','Equipamento','Origem'],rows.map(({raw,n})=>[date(n.date),n.method||'Não informado',n.protocol.equation||'Não informado',n.protocol.device||'Não informado','Avaliação '+raw.id]));
 const folding=fields(EFIAAnthro.folds.map(([k,l])=>[k,l+' (mm)']),r=>r.a.folds)+table(['Data','Soma de dobras (mm)','Origem da soma','Gordura estimada (%)'],rows.map(({n,a})=>[date(n.date),fmt(a.sumFolds),a.sumFoldsSource||'Não disponível',fmt(a.pollock)]));
 const metabolic=fields([['tmb','TMB registrada (kcal/dia)'],['tdee','Gasto energético total registrado (kcal/dia)'],['visceral','Índice visceral (escala do aparelho)'],['water','Água corporal registrada (kg)'],['waterPct','Água corporal (%)'],['bone','Massa óssea registrada (kg)'],['musclePct','Percentual muscular informado pelo aparelho (%)'],['bodyAge','Idade corporal (escala do aparelho)'],['rcq','Relação cintura/quadril registrada']],r=>r.a);
 return card('Composição Corporal',comp+`<p>${info('lean')} Massa livre de gordura ${info('muscle')} Massa muscular esquelética. IMC e massa gorda estimada são cálculos derivados de peso, altura e gordura registrada. Massa gorda registrada pelo aparelho é identificada na origem abaixo.</p>`+list(rows.map(({n,a})=>date(n.date)+': massa gorda — '+(a.fatMassSource||'Não informado'))))+card('Perimetria',fields(EFIAAnthro.perimeters.map(([k,l])=>[k,l+' (cm)']),r=>r.a.perimeters)+otherPerimeters+plot(result,'cintura','Cintura','cm'))+card('Dobras Cutâneas',folding+'<p>Nenhuma nova equação de gordura é aplicada aqui. Valores registrados exigem conferência do protocolo e de seu domínio de validação.</p>')+card('Indicadores Metabólicos e Complementares',metabolic+'<p>Variações de indicadores do aparelho só são interpretáveis com o mesmo método, unidade e equipamento. A ausência de dados não é substituída por zero.</p>')+card('Métodos e rastreabilidade',protocol)+card('Histórico por data',historical(result))+card('Comparação do período',changes(result)+`<p>${info('change')} As diferenças são descritivas; não demonstram mudança detectável sem erro de medida conhecido.</p>`)+card('Evolução gráfica',`<div class="efia-grid">${METRICS.map(([k,l,u])=>card(l,plot(result,k,l,u))).join('')}</div>`)+card('Interpretação conjunta',list([...(result.engines.EF68.findings||[]).map(x=>x.title+': '+x.text),...result.engines.EF80.relations,...result.engines.EF81.facts.map(x=>date(x.date)+': '+x.text)])+list(result.warnings))+card('Parecer técnico editável',`<label for="efia-private">Observações privadas do profissional</label><textarea id="efia-private">${esc(current.draft.private)}</textarea><p>Este campo aparece somente na impressão técnica.</p><button type="button" class="efia-print" data-efia-print="technical">Imprimir análise técnica</button>`);
}
function student(result){
 const name=current.name,first=result.records[0],last=result.records.at(-1);
 return `<header><p>EvoluFísico — Análise Física Integrada</p><h2>Minha Avaliação Física</h2><p>${esc(name)} · ${esc(date(first.date))} a ${esc(date(last.date))}</p></header>`+changes(result)+`<div class="efia-grid">${METRICS.map(([k,l,u])=>card(l,plot(result,k,l,u))).join('')}</div>`+card('Histórico resumido',historical(result))+card('O que mudou',list(METRICS.map(([k,l,u])=>{const v=result.engines.EF79.results[k].change;return canCompare(result,k)&&v!==null?l+': '+fmt(v)+' '+(k==='gordura'?'p.p.':u)+' no período.':'Não foi possível comparar '+l.toLowerCase()+' com segurança.'})))+card('Pontos de atenção',list(result.warnings))+card('Recomendações do profissional',`<label for="efia-public">Texto que será compartilhado com o aluno</label><textarea id="efia-public">${esc(current.draft.public)}</textarea><label class="efia-review"><input type="checkbox" id="efia-reviewed" ${current.draft.reviewed?'checked':''}> Revisei os resultados e as recomendações para este aluno e este período.</label><button type="button" class="efia-print" data-efia-print="student" ${current.draft.reviewed?'':'disabled'}>Imprimir relatório do aluno</button>`)+EXPLAIN;
}
function technicalDetails(result){return `<details class="efia-card"><summary>Como esta análise foi feita</summary><p>Processamento local com os oito motores. Nenhum dado do aluno é enviado para serviços de IA.</p>${table(['Motor','Função','Estado'],[['EF68','Evolução'],['EF70','Interpretação'],['EF77','Laboratório'],['EF78','Qualidade'],['EF79','Mudança detectável'],['EF80','Coerência'],['EF81','Contexto'],['EF82','Robustez']].map(([k,l])=>[k,l,result.engines?.[k]?'Executado':'Bloqueado por insuficiência']))}<p>Índices heurísticos não representam precisão clínica. Resultados derivados da mesma medida não são evidências independentes.</p>${list(Object.entries(result.engines.EF82.metrics).map(([k,v])=>k+': '+v.status+' — '+v.reason))}</details>`}
function intelligenceSummary(result){
 // Only display changes explicitly released by EFIA; never infer unavailable measurements.
 const cards=METRICS.map(([key,label,unit])=>{
  const change=result.engines?.EF79?.results?.[key]?.change;
  const released=canCompare(result,key)&&typeof change==='number'&&Number.isFinite(change);
  return `<div class="efi-metric-card"><strong>${released?(change>0?'+':'')+fmt(change)+' '+(key==='gordura'?'p.p.':unit):'Não disponível'}</strong><span>${esc(label)}</span></div>`;
 }).join('');
 const length=result.records?.length||0;
 const first=result.records?.[0]?.day,last=result.records?.at(-1)?.day;
 const period=typeof first==='number'&&typeof last==='number'&&last>=first?(last-first)+' dias':'Não disponível';
 return `<header class="efi-intelligence-heading"><h3>EFI Intelligence</h3><p>Interpretação inteligente da evolução física · Processamento local</p></header><div class="efi-metric-grid">${cards}<div class="efi-metric-card"><strong>${length}</strong><span>Avaliações</span></div><div class="efi-metric-card"><strong>${esc(period)}</strong><span>Período</span></div></div><p class="efi-intelligence-disclaimer">Os indicadores exibidos foram calculados e autorizados pelos motores EFIA. Mudanças estimadas dependem da comparabilidade dos métodos, e sua interpretação exige revisão profissional.</p>`;
}
function render(container,{profileKey,selectedIds,name}){
 const result=EFIAHost.analyze({host:window,profileKey,selectedIds});
 if(!result.ok||!result.eligible){current=null;container.innerHTML=`<section class="efia efia-card" role="alert"><h3>Análise Física Integrada bloqueada</h3><p>${esc(result.reason||result.summary)}</p>${list(result.warnings||[])}</section>`;return result}
 const key=JSON.stringify([profileKey,selectedIds,result.recordsRaw]);
 if(!drafts.has(key)){if(drafts.size>=30)drafts.delete(drafts.keys().next().value);drafts.set(key,{private:'',public:'',reviewed:false})}
 current={result,key,name,profileKey,selectedIds,draft:drafts.get(key)};
 const summary=card('Resumo da trajetória física',changes(result))+card('Qualidade dos dados',`<p>${info('quality')} ${esc(result.original.safety.quality)}. ${esc(result.summary)}</p>`+list(result.warnings))+card('Interpretação integrada',list([...(result.engines.EF68.findings||[]).map(x=>x.title+': '+x.text),...result.engines.EF80.relations]))+card('Próximos pontos de acompanhamento',list((result.engines.EF70.actions||[]).map(x=>x.text)))+technicalDetails(result);
 container.innerHTML=`<div class="efia"><div class="efia-tabs" role="tablist" aria-label="Análise Física Integrada">${[['summary','Resumo'],['professional','Visão Profissional'],['student','Relatório do Aluno'],['intelligence','EFI Intelligence']].map(([k,l])=>`<button type="button" role="tab" id="efia-tab-${k}" aria-controls="efia-panel-${k}" data-efia-tab="${k}" aria-selected="${activeTab===k}">${l}</button>`).join('')}</div>${[['summary',summary],['professional',professional(result)],['student',student(result)],['intelligence',intelligenceSummary(result)]].map(([k,html])=>`<section class="efia-panel" role="tabpanel" aria-labelledby="efia-tab-${k}" id="efia-panel-${k}" ${activeTab===k?'':'hidden'}>${html}</section>`).join('')}</div>`;
 container.querySelectorAll('[data-efia-tab]').forEach(b=>b.onclick=()=>{activeTab=b.dataset.efiaTab;container.querySelectorAll('[data-efia-tab]').forEach(t=>t.setAttribute('aria-selected',String(t===b)));container.querySelectorAll('.efia-panel').forEach(p=>p.hidden=p.id!=='efia-panel-'+activeTab)});
 container.querySelectorAll('[data-efia-help]').forEach(b=>b.onclick=()=>window.alert(help[b.dataset.efiaHelp]));
 container.querySelector('#efia-private').oninput=e=>current.draft.private=e.target.value;
 container.querySelector('#efia-public').oninput=e=>{current.draft.public=e.target.value;current.draft.reviewed=false;container.querySelector('#efia-reviewed').checked=false;container.querySelector('[data-efia-print=student]').disabled=true};
 container.querySelector('#efia-reviewed').onchange=e=>{current.draft.reviewed=e.target.checked;container.querySelector('[data-efia-print=student]').disabled=!e.target.checked};
 container.querySelectorAll('[data-efia-print]').forEach(b=>b.onclick=()=>print(b.dataset.efiaPrint));window.EFIAIntelligence?.mount(container,result);return result;
}
function documentFor(type){
 if(!current||!['student','technical'].includes(type))throw Error('Seleção indisponível');
 const c=current,check=EFIAHost.analyze({host:window,profileKey:c.profileKey,selectedIds:c.selectedIds});
 if(!check.eligible||JSON.stringify(check.recordsRaw)!==JSON.stringify(c.result.recordsRaw))throw Error('O histórico mudou. Reabra a análise e revise o relatório.');
 if(type==='student'&&!c.draft.reviewed)throw Error('Revise o relatório antes de compartilhar.');
 const name=c.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]/g,'')||'Aluno';
 const title='EvoluFisico'+name+(type==='technical'?'_AnaliseTecnica':'_Analise');
 const root=document.createElement('div');root.innerHTML=type==='student'?student(c.result):`<h1>Análise Física Integrada — Visão Profissional</h1><p>${esc(c.name)}</p>`+professional(c.result)+technicalDetails(c.result);
 root.querySelectorAll('button,.efia-review').forEach(n=>n.remove());root.querySelectorAll('textarea').forEach(t=>{const p=document.createElement('p');p.style.whiteSpace='pre-wrap';p.textContent=t.id==='efia-private'?c.draft.private:c.draft.public;t.replaceWith(p)});root.querySelectorAll('details').forEach(d=>d.open=true);
 return {title,html:`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(title)}</title><style>@page{size:A4;margin:15mm}body{font:11pt Arial,sans-serif;color:#182536;background:white}*{box-sizing:border-box}h1,h2,h3{break-after:avoid}h3{font-size:13pt}.efia-card{border:1px solid #cbd5e1;padding:12px;margin:12px 0;break-inside:avoid}.efia-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.efia-chart{width:100%;height:auto;color:#182536}.efia-chart polyline{fill:none;stroke:#334155;stroke-width:2.5}.efia-chart circle{fill:#334155}.efia-chart text{font:11px Arial;fill:#182536}table{width:100%;border-collapse:collapse;font-size:8pt;table-layout:fixed}th,td{border:1px solid #cbd5e1;padding:5px;overflow-wrap:anywhere}thead{display:table-header-group}tr{break-inside:avoid}p,li{line-height:1.5;overflow-wrap:anywhere}.efia-note{padding:8px;background:#f1f5f9}footer{font-size:9pt;border-top:1px solid #cbd5e1;margin-top:18px}</style></head><body><main>${root.innerHTML}</main><footer>EvoluFísico ${esc(document.querySelector('[data-efia-version]')?.dataset.efiaVersion||'2.0.28')} · Processamento local · Revisão profissional obrigatória</footer></body></html>`};
}
function print(type){
 try{
  const d=documentFor(type);
  // WebView2 blocks popups: use a local print iframe instead of window.open.
  const frame=document.createElement('iframe');
  frame.title='Relatório EFIA para impressão';
  frame.style.cssText='position:fixed;left:-10000px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;border:0';
  const remove=()=>setTimeout(()=>frame.remove(),1500);
  frame.addEventListener('load',()=>{
   try{const w=frame.contentWindow;if(!w)throw Error('Prévia indisponível.');
    w.addEventListener('afterprint',remove,{once:true});w.focus();w.print();setTimeout(remove,60000);
   }catch(e){remove();window.alert('Falha na impressão EFIA: '+e.message)}
  },{once:true});
  frame.srcdoc=d.html;document.body.appendChild(frame);
 }catch(e){window.alert(e.message)}
}
window.EFIAView=Object.freeze({render,documentFor,getCurrent:()=>current?{profileKey:current.profileKey,selectedIds:[...current.selectedIds],result:structuredClone(current.result)}:null});
})();
