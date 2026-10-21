/* EvoluFisico 1.0 — area dedicada a Analises Automaticas, mantendo motores e registros originais. */
(()=>{'use strict';
 const PAGE='tab-analises',BTN='tab-btn-analises';
 const $=id=>document.getElementById(id);
 function ready(){
  const nav=document.querySelector('.top-navbar > .nav-tabs'),app=document.querySelector('.app-container');
  if(!nav||!app||typeof window.switchTab!=='function')return;
  let section=$(PAGE);
  if(!section){section=document.createElement('section');section.id=PAGE;section.className='tab-panel ef-analyses-page';section.setAttribute('aria-label','Análises');
   section.innerHTML='<div class="ef-analyses-heading"><div><span class="ef-analyses-overline">ACOMPANHAMENTO DOS ALUNOS</span><h1>Análises</h1><p>Selecione um aluno e três ou quatro avaliações. Examine as mudanças, a qualidade dos dados e os sinais que merecem acompanhamento.</p></div><span class="ef-analyses-tag">EF68 · EF70 · EF77</span></div><div id="ef-analysis-container"></div><div id="ef-analysis-source" hidden aria-hidden="true"></div>';
   app.append(section);
  }
  let b=$(BTN);
  if(!b){b=document.createElement('button');b.type='button';b.className='nav-tab-btn';b.id=BTN;b.textContent='Análises';b.setAttribute('aria-controls',PAGE);
   b.addEventListener('click',()=>window.switchTab(PAGE));
   const forms=$('tab-btn-ef-forms');if(forms?.parentNode===nav)forms.after(b);else nav.append(b);
  }
  const prev=$('ef-home-insights');if(prev&&prev.parentNode!==$('ef-analysis-container'))$('ef-analysis-container').append(prev);
  const legacy=$('ef-home-deep');if(legacy)legacy.remove();
  installHelp(section);
  installHome();
 }
  // Explicações claras dos indicadores, sem modificar cálculos ou registros.
  function installHelp(section){
   if(!section||section.querySelector('.ef-analysis-help-trigger'))return;
   const heading=section.querySelector('.ef-analyses-heading');if(!heading)return;
   const btn=document.createElement('button');btn.type='button';btn.className='ef-analysis-help-trigger';btn.textContent='?';
   btn.title='O que significa cada indicador?';btn.setAttribute('aria-label','O que significa cada indicador das Análises?');btn.setAttribute('aria-haspopup','dialog');btn.setAttribute('aria-expanded','false');heading.append(btn);
   const glossary=[
    ['trajetoria','Trajetória (0 a 100)','Resumo exploratório das mudanças ao longo do acompanhamento. Não representa diagnóstico ou probabilidade de sucesso.'],
    ['qualidade','Qualidade dos dados / confiança (0 a 100)','Índice heurístico baseado em datas, completude e comparabilidade. Não significa percentual de precisão clínica.'],
    ['avaliacoes','Avaliações e período selecionado','Mínimo de três avaliações válidas em dias diferentes, abrangendo pelo menos 21 dias. A quarta é opcional. Histórico insuficiente bloqueia análises e relatórios.'],
    ['sinais','Sinais de atenção','Eventos que justificam revisão, como reversão, oscilações ou períodos longos sem coleta. Não são diagnósticos.'],
    ['padroes','Padrões identificados','Quantidade de eventos observados pelos motores. Um padrão não significa necessariamente um problema.'],
    ['peso','Peso corporal','Massa total em quilogramas. Hidratação, vestuário e horário da medição podem mudar o resultado.'],
    ['gordura','Gordura corporal (%)','Percentual estimado por um protocolo. Comparações devem usar método e condições de aferição equivalentes.'],
    ['massa-magra','Massa magra (kg)','Massa livre de gordura estimada, diferente de massa muscular esquelética indicada por alguns equipamentos.'],
    ['cintura','Cintura (cm)','Circunferência corporal. Para comparar datas, mantenha o mesmo ponto anatômico e a mesma técnica.'],
    ['mudancas','Mudanças da avaliação anterior','Variação absoluta desde a última coleta válida. Aumento ou redução não representa necessariamente melhora ou piora.'],
    ['consistencia','Consistência','Proporção das mudanças que seguem uma direção predominante. Não demonstra causalidade nem garante evolução clínica.'],
    ['plato','Platô aparente','Período de pequenas variações. Pode refletir estabilidade, diferenças de medição ou condições de coleta.'],
    ['pollock','Pollock (dobras cutâneas)','Estimativa por equação a partir das dobras, dependente do protocolo, avaliador e população de referência.'],
    ['bia','Bioimpedância','Estimativa influenciada por hidratação, alimentação, treino e aparelho. Não é intercambiável diretamente com Pollock.'],
    ['divergencia','Concordância entre métodos (p.p.)','Diferença absoluta em pontos percentuais: 22% contra 30% = 8 p.p. Divergências exigem cautela; concordância não prova acurácia.'],
    ['navy','US Navy','Estimativa de percentual de gordura por circunferências e altura, não uma medição independente.'],
    ['rfm','RFM','Estimativa de gordura baseada em altura/cintura. Não é uma avaliação adicional.'],
    ['whtr','Cintura / estatura','Relação da cintura com altura na mesma unidade de medida. É um índice derivado.'],
    ['acoes','Próximas ações','Sugestões de acompanhamento, coleta e conferência dos dados. Não substituem orientação profissional.'],
    ['relatorio','Relatório editável / PDF','O profissional pode revisar o texto antes da impressão. Editar o relatório não altera as avaliações armazenadas.']
   ];
   const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
   const dialog=document.createElement('dialog');dialog.className='ef-analysis-glossary';dialog.setAttribute('aria-labelledby','ef-analysis-help-title');
   dialog.innerHTML='<div class="ef-analysis-glossary-head"><div><p class="ef-analyses-overline">GUIA DE INTERPRETAÇÃO</p><h2 id="ef-analysis-help-title">Entenda os indicadores</h2><p>Explicações sobre os dados exibidos em Análises.</p></div><button class="ef-analysis-help-close" type="button" aria-label="Fechar explicações">Fechar ✕</button></div><div class="ef-analysis-glossary-content">'+glossary.map(([id,title,desc])=>'<section id="ef-help-'+id+'"><h3>'+esc(title)+'</h3><p>'+esc(desc)+'</p></section>').join('')+'</div><p class="ef-analysis-glossary-foot">As análises apoiam o acompanhamento profissional; não substituem validação de medidas ou avaliação individual.</p>';
   section.append(dialog);
   function open(id){if(!dialog.open){if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');}btn.setAttribute('aria-expanded','true');const item=id&&dialog.querySelector('#ef-help-'+id);if(item){const area=dialog.querySelector('.ef-analysis-glossary-content');if(area)area.scrollTop=Math.max(0,item.offsetTop-area.offsetTop-8);}}
   function close(){if(dialog.open&&typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');btn.setAttribute('aria-expanded','false');btn.focus()}
   btn.addEventListener('click',()=>open());dialog.querySelector('.ef-analysis-help-close').addEventListener('click',close);dialog.addEventListener('close',()=>btn.setAttribute('aria-expanded','false'));
   dialog.addEventListener('click',e=>{if(e.target===dialog)close()});
   section.addEventListener('click',e=>{const b=e.target.closest('[data-ef-glossary]');if(b){e.preventDefault();open(b.dataset.efGlossary)}});
  }
 function installHome(){
  const home=$('ef55-painel'),hero=home?.querySelector('.ef90-home');if(!hero)return;
  let node=$('ef-analyses-quick');
  if(!node){node=document.createElement('section');node.id='ef-analyses-quick';node.className='ef-analyses-quick';node.setAttribute('aria-label','Resumo das análises automáticas');
    const stats=hero.querySelector('.ef90-simple-stats');if(stats)stats.after(node);else hero.prepend(node);
  }
  const all=window.EF68?.all?.()?.studentsData||[];
  const eligible=all.filter(p=>{
   const dates=[...new Set((p.timeline||[]).map(r=>window.EFUnifiedSafety?.dateKey?.(r.data)).filter(Boolean))].sort();
   return dates.length>=3&&(Date.parse(dates.at(-1))-Date.parse(dates[0]))/86400000>=21;
  }).length;
  node.innerHTML='<div class="ef-analyses-quick-icon" aria-hidden="true">◈</div><div class="ef-analyses-quick-copy"><strong>Análises</strong><span>'+eligible+' aluno(s) com histórico temporal suficiente • interpretação no módulo exclusivo</span></div><button type="button" class="ef-analyses-open">Abrir análises <span aria-hidden="true">→</span></button>';
  node.querySelector('button').addEventListener('click',()=>window.switchTab(PAGE));
 }
 function refreshHome(){if($('tab-painel')?.classList.contains('active'))installHome()}
 function init(){ready();
  const orig=window.switchTab;
  if(typeof orig==='function')window.switchTab=function(id){const result=orig.apply(this,arguments);
   if(id===PAGE){ready();window.EFUnifiedAnalysis?.refresh?.();}
   else if(id==='tab-painel')requestAnimationFrame(refreshHome);
   return result;
  };
  const state=window.__EF63_STATE__;
  if(state&&typeof state.touch==='function'){
   const touch=state.touch;state.touch=function(){const out=touch.apply(this,arguments);requestAnimationFrame(refreshHome);return out;};
  }
  requestAnimationFrame(refreshHome);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();