/* Editor isolado de relatórios do aluno; rascunhos somente em memória da aba, sem localStorage clínico. */
(()=>{
 'use strict';
 const drafts=new Map();let modal=null,lastFocus=null,activeKey='';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=n=>n==null||!Number.isFinite(Number(n))?'não disponível':Number(n).toLocaleString('pt-BR',{maximumFractionDigits:1});
 const date=d=>d?new Date(/^\d{4}-\d{2}-\d{2}$/.test(d)?d+'T12:00:00':d).toLocaleDateString('pt-BR'):'—';
 function build(profile,decision,lab){
  const recent=profile.last||{},history=profile.timeline||[];
  const safe=window.EFUnifiedSafety?.audit(profile,decision,lab);const delta=safe?.delta||{};
  const evid=lab?.latest||{};
  const events=safe?.events||[];
  const change=['peso','gordura','massaMagra','cintura'].map(k=>{
   let label={peso:'Peso',gordura:'Gordura corporal',massaMagra:'Massa magra',cintura:'Cintura'}[k];
   let v=delta[k];return `${label}: ${v==null?'sem comparação':(v>0?'+':'')+fmt(v)}${v==null?'':k==='gordura'?' p.p.':k==='cintura'?' cm':' kg'}`;
  }).join('\n');
  return {
   title:'Relatório de Análises Automáticas',
   summary:`Histórico de ${history.length} avaliação(ões), de ${date(history[0]?.data)} a ${date(recent.data)}. ${!safe?.canTrend||safe?.confidence==null||decision?.score?.value==null?'Dados insuficientes para avaliar trajetória.':'Índice exploratório de trajetória: '+decision.score.value+'/100.'}\nÍndice técnico de qualidade de dados: ${safe?.confidence??'não estimável'}/100. Não é probabilidade clínica de acerto.`,
   changes:change,
   patterns:events.length?events.map(x=>`${x.title}: ${x.text}`).join('\n\n'):'Dados insuficientes para confirmar padrões compostos ou platôs.',
   laboratory:`Fontes salvas: ${lab?.paired||0} comparação(ões) Pollock/BIA. ${lab?.reason||'Sem comparações disponíveis.'}\nPollock: ${evid.pollock==null?'—':fmt(evid.pollock)+'%'}; BIA: ${evid.bia==null?'—':fmt(evid.bia)+'%'}; diferença: ${evid.delta==null?'—':fmt(evid.delta)+' p.p.'}.\nNavy (estimativa): ${evid.navy==null?'—':fmt(evid.navy)+'%'}; RFM (estimativa): ${evid.rfm==null?'—':fmt(evid.rfm)+'%'}; cintura/estatura: ${evid.whtr??'—'}; FFMI: ${evid.ffmi??'—'}.\nMétodos derivados da mesma medida NÃO são medições independentes; a qualidade documental só é ajustada por séries registradas e comparáveis. Isso não valida a acurácia.`,
   actions:(safe?.actions||[]).map(x=>x.text).join('\n\n')||'Registrar novas avaliações comparáveis e revisar os achados segundo o contexto individual.',
   validation:`${safe?.warnings?.length?safe.warnings.map(x=>'• '+x.text).join('\n'):'Sem inconsistências detectadas pelos filtros básicos; a medição não está clinicamente validada por isso.'}\n${safe?.disclaimer||''}`,
   observation:'Interpretação profissional / observações adicionais:',
   dataVersion:String(window.__EF63_STATE__?.version??0)+'|'+String(safe?.fingerprint||'')
  };
 }
 const FIELDS=[['summary','Síntese da trajetória'],['changes','Mudanças e evolução'],['patterns','Consistência, padrões e sinais de atenção'],['laboratory','Evidências do laboratório e confiança'],['actions','Próximos pontos de acompanhamento'],['validation','Qualidade e limitações dos dados'],['observation','Observações do profissional']];
 function close(){if(modal){modal.remove();modal=null;lastFocus?.focus?.()}}
 function updateDraft(){if(!modal)return;const d=drafts.get(activeKey);if(!d)return;for(const key of ['title',...FIELDS.map(x=>x[0])]){const el=modal.querySelector(`[data-field="${key}"]`);if(el)d[key]=el.value}d.edited=true}
 function renderPrint(d,profile){
  let sections=FIELDS.map(([key,title])=>`<section class="r-section"><h2>${esc(title)}</h2><div class="r-body">${esc(d[key])}</div></section>`).join('');
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(window.EF2PdfBaseName(profile.name))}</title><style>
  @page{size:A4;margin:16mm 15mm}*{box-sizing:border-box}body{margin:0;background:white;color:#263646;font:12px/1.6 Arial,Helvetica,sans-serif}header{border-top:6px solid #225f88;border-bottom:1px solid #c5d5df;padding:15px 0 17px;margin-bottom:20px}header small{font-size:10px;color:#3d708f;text-transform:uppercase;font-weight:700;letter-spacing:2px}h1{font-size:22px;color:#143b56;margin:5px 0 8px}header p{font-size:12px;color:#415366;margin:0}.r-section{page-break-inside:avoid;break-inside:avoid;margin:0 0 16px;border-bottom:1px solid #dee6eb;padding-bottom:12px}.r-section h2{color:#25536c;font-size:13px;margin:0 0 6px}.r-body{white-space:pre-wrap;word-break:break-word}footer{border-top:1px solid #c6d5df;padding-top:12px;font-size:9px;color:#66778a;margin-top:20px}</style></head><body><header><small>EvoluFísico • Relatório de acompanhamento</small><h1>${esc(d.title)}</h1><p><strong>Aluno:</strong> ${esc(profile.name||'')} &nbsp; • &nbsp; <strong>Avaliações:</strong> ${esc(profile.count)} &nbsp; • &nbsp; <strong>Última:</strong> ${esc(date(profile.last?.data))}</p></header>${sections}<footer>Dados provenientes do histórico do aluno. Projeções e estimativas não substituem avaliação profissional, não representam diagnóstico clínico. Relatório editado pelo profissional.</footer></body></html>`;
 }
 function printReport(){if(!modal||!eligible(modal.__profile)){window.alert?.('Não é possível emitir o relatório: exigem-se 3 datas distintas e intervalo total de pelo menos 21 dias.');close();return;}updateDraft();const d=drafts.get(activeKey);if(!d||!modal)return;let profile=modal.__profile;
  const frame=document.createElement('iframe');frame.title='Impressão do relatório';frame.style.cssText='position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-100px;top:0';
  const html=renderPrint(d,profile);frame.srcdoc=html;document.body.append(frame);
  const remove=()=>setTimeout(()=>frame.remove(),1500);
  frame.addEventListener('load',()=>{try{frame.contentWindow.addEventListener('afterprint',remove,{once:true});frame.contentWindow.focus();frame.contentWindow.print();setTimeout(remove,60000)}catch(e){remove();downloadHTML(html)}} ,{once:true});
 }
 function downloadHTML(html){const blob=new Blob([html],{type:'text/html;charset=utf-8'});const url=URL.createObjectURL(blob);let link=document.createElement('a');link.href=url;link.download='EvoluFisico-relatorio-imprimivel.html';link.click();setTimeout(()=>URL.revokeObjectURL(url),3000)}
 function eligible(profile){
  if(!profile)return false;
  const ids=new Set((profile.timeline||[]).map(r=>String(r.id)));
  const dates=new Set();
  const current=window.__EF63_STATE__?.getAvaliacoes?.()||[];
  for(const r of current){
   if(!r||!ids.has(String(r.id))||window.EFIdentity?.key?.(r)!==profile.key)continue;
   const date=window.EFUnifiedSafety?.dateKey?.(r.data_avaliacao);
   if(date)dates.add(date);
  }
  const sorted=[...dates].sort();
  return sorted.length>=3&&(Date.parse(sorted.at(-1))-Date.parse(sorted[0]))/86400000>=21;
 }
 function open(profile,decision,lab){if(!eligible(profile)){window.alert?.('Relatório indisponível: são necessárias 3 avaliações em datas distintas abrangendo pelo menos 21 dias.');return false;}close();lastFocus=document.activeElement;activeKey=String(profile.key)+'|'+(profile.timeline||[]).map(x=>String(x.id)).sort().join('|');
  const fresh=build(profile,decision,lab),existing=drafts.get(activeKey),d=existing||fresh;
  if(!existing)drafts.set(activeKey,d);
  modal=document.createElement('div');modal.id='efu-report-overlay';modal.className='efu-report-overlay no-print';modal.setAttribute('role','presentation');
  modal.__profile=profile;
  modal.innerHTML=`<section class="efu-report-modal" role="dialog" aria-modal="true" aria-labelledby="efu-report-title"><div class="efu-report-head"><div><small>Relatório de avaliação</small><h2 id="efu-report-title">Editar relatório do aluno</h2><p>${esc(profile.name)} • ${esc(profile.count)} avaliação(ões)</p></div><button type="button" data-action="close" aria-label="Fechar editor">✕</button></div><div class="efu-report-content">${d.dataVersion!==fresh.dataVersion?'<p class="efu-report-alert" role="alert">O histórico mudou desde a criação do rascunho. Confira os dados antes de emitir um PDF; suas alterações foram preservadas.</p>':''}<p class="efu-report-hint">Revise os textos abaixo. As alterações ficam apenas nesta aba; não modificam avaliações, laboratório ou banco de dados.</p><label class="efu-report-label">Título<input data-field="title" maxlength="160" value="${esc(d.title)}"></label>${FIELDS.map(([key,label])=>`<label class="efu-report-label">${esc(label)}<textarea data-field="${key}" rows="${key==='laboratory'?6:4}" maxlength="8000">${esc(d[key])}</textarea></label>`).join('')}</div><div class="efu-report-footer"><span class="efu-report-alert-small" aria-live="polite">Rascunho nesta sessão</span><button type="button" data-action="reset">Restaurar texto automático</button><button type="button" class="efu-report-primary" data-action="print">Imprimir / salvar PDF</button></div></section>`;
  document.body.append(modal);
  modal.addEventListener('click',ev=>{if(ev.target===modal)close();const btn=ev.target.closest('[data-action]');if(!btn)return;if(btn.dataset.action==='close')close();if(btn.dataset.action==='print')printReport();if(btn.dataset.action==='reset'){if(confirm('Substituir todas as edições deste relatório pelo texto automático atualizado?')){drafts.set(activeKey,fresh);open(profile,decision,lab)}}});
  modal.querySelectorAll('input,textarea').forEach(x=>x.addEventListener('input',updateDraft));
  modal.addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.preventDefault();close()}});
  modal.querySelector('[data-action="close"]').focus();
 }
 window.EFUnifiedReport=Object.freeze({open,getDraft:key=>drafts.get(String(key)),close});
})();
