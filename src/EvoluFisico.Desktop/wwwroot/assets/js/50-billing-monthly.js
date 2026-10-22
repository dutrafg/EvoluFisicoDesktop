
/* EvoluFísico2 1.0.4 estável — Caixa mensal e relatórios financeiros.
   Não cria uma segunda base: lê apenas os registros do EFCobranca existente.
   Caixa = recebido na data efetiva de pagamento; pendências = vencimento da cobrança.
*/
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const iso = value => { const v=String(value||''); return /^\d{4}-\d{2}-\d{2}(?:$|T)/.test(v) ? v.slice(0,10) : ''; };
  const month = value => iso(value).slice(0,7);
  const currentMonth = () => localToday().slice(0,7);
  const validMonth = value => /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
  const money = x => (Number(x)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const safe = x => String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const monthName = x => validMonth(x) ? new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(new Date(Number(x.slice(0,4)),Number(x.slice(5))-1,1)).replace(/^./,c=>c.toUpperCase()) : 'Período inválido';
  const displayDate = x => iso(x) ? iso(x).split('-').reverse().join('/') : '—';
  const receivedDate = c => iso(c.recebidoEm || c.data || c.createdAt);
  const dueDate = c => iso(c.vencimento || c.data || c.createdAt);
  const valueOf = c => Math.max(0, Number(c.valorTotal)||0);
  const isPaid = c => c.status === 'pago';
  const recordNames = c => [c.aluno1?.nome,c.aluno2?.nome].filter(Boolean).join(' e ') || 'Não informado';
  let selected=currentMonth(),lastMonth='',rows=[],seq=0,ready=false,locked=false;

  function summary(list, ym) {
    const paid=list.filter(c=>isPaid(c)&&month(receivedDate(c))===ym);
    const pending=list.filter(c=>!isPaid(c)&&month(dueDate(c))===ym);
    return {month:ym,paid,pending,paidTotal:paid.reduce((n,c)=>n+valueOf(c),0),pendingTotal:pending.reduce((n,c)=>n+valueOf(c),0)};
  }
  function byMonth(list) {
    const set = new Set([currentMonth()]);
    list.forEach(c=>{let k=isPaid(c)?month(receivedDate(c)):month(dueDate(c));if(validMonth(k))set.add(k)});
    return [...set].sort().reverse().map(k=>summary(list,k));
  }
  function totals(list) {
    const paid = list.filter(isPaid), pending = list.filter(c=>!isPaid(c));
    return {paidTotal:paid.reduce((n,c)=>n+valueOf(c),0),pendingTotal:pending.reduce((n,c)=>n+valueOf(c),0),paidCount:paid.length,pendingCount:pending.length};
  }
  async function read() {
    if(!window.EFCobranca?.exportData)throw Error('O módulo Cobranças ainda não foi carregado.');
    if(window.EF_Security?.isConfigured?.() && !window.EF_Security.key) throw Error('Desbloqueie o cofre em Configurações para visualizar os lançamentos financeiros.');
    const result=await window.EFCobranca.exportData();
    if(!Array.isArray(result))throw Error('Não foi possível ler o histórico financeiro.');
    return result;
  }
  function renderTable(items, paid) {
    if(!items.length)return '<p class="ef-fin-empty">Nenhum lançamento neste período.</p>';
    const sorted=[...items].sort((a,b)=>String(paid?receivedDate(b):dueDate(b)).localeCompare(String(paid?receivedDate(a):dueDate(a))));
    return `<div class="ef-fin-table-wrap"><table class="ef-fin-table"><thead><tr><th>${paid?'Recebido em':'Vencimento'}</th><th>Cliente</th><th>Serviço</th><th>Forma</th><th class="ef-fin-num">Valor</th></tr></thead><tbody>${sorted.map(c=>`<tr><td>${displayDate(paid?receivedDate(c):dueDate(c))}</td><td>${safe(recordNames(c))}</td><td>${safe(c.servicoNome||'Serviço')}</td><td>${safe(({'pix':'Pix','credito':'Crédito','debito':'Débito','dinheiro':'Dinheiro'})[c.formaPagamento]||'—')}</td><td class="ef-fin-num">${money(valueOf(c))}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function render(rowsList) {
    const r=summary(rowsList,selected), t=totals(rowsList);
    $('ef-fin-period-label').textContent=monthName(selected);
    $('ef-fin-recebido').textContent=money(r.paidTotal);
    $('ef-fin-pendente').textContent=money(r.pendingTotal);
    $('ef-fin-recebido-count').textContent=`${r.paid.length} recebimento(s)`;
    $('ef-fin-pendente-count').textContent=`${r.pending.length} cobrança(s) a receber`;
    $('ef-fin-geral').textContent=money(t.pendingTotal);
    $('ef-fin-current').textContent=monthName(currentMonth());
    $('ef-fin-month').value=selected;
    $('ef-fin-paid-table').innerHTML=renderTable(r.paid,true);
    $('ef-fin-pending-table').innerHTML=renderTable(r.pending,false);
    const months=byMonth(rowsList);
    if(!months.some(m=>m.month===selected))months.push(r);
    months.sort((a,b)=>b.month.localeCompare(a.month));
    $('ef-fin-months').innerHTML=months.map(m=>`<button class="ef-fin-monthrow ${m.month===selected?'is-active':''}" type="button" data-month="${m.month}" aria-label="Ver ${safe(monthName(m.month))}"><span>${safe(monthName(m.month))}</span><strong>${money(m.paidTotal)}</strong><span>${money(m.pendingTotal)}</span><small>${m.paid.length+m.pending.length} registro(s)</small></button>`).join('');
    // No dia 1º, o caixa atual começa em zero, enquanto os períodos anteriores são preservados.
    const active=summary(rowsList,currentMonth());
    const set=(id,v)=>{const el=$(id);if(el)el.textContent=v;};
    set('cob-kpi-faturado-mes',money(active.paidTotal));
    set('cob-kpi-faturado-qtd',`${active.paid.length} recebimento(s) neste mês`);
    set('cob-kpi-pendente-mes',money(active.pendingTotal));
    set('cob-kpi-pendente-qtd',`${active.pending.length} vencimento(s) neste mês`);
  }
  async function refresh() {
    if(!$('ef-fin-panel'))return;
    const run=++seq;
    try {
      const data=await read();if(run!==seq)return;
      locked=false;rows=data;
      $('ef-fin-security').hidden=true;
      render(data);lastMonth=currentMonth();
    } catch(e) {
      if(run!==seq)return;
      rows=[];locked=true;
      $('ef-fin-security').textContent=e.message;
      $('ef-fin-security').hidden=false;
      ['ef-fin-recebido','ef-fin-pendente','ef-fin-geral'].forEach(id=>{if($(id))$(id).textContent='—'});
      ['ef-fin-paid-table','ef-fin-pending-table','ef-fin-months'].forEach(id=>{if($(id))$(id).textContent='Dados protegidos ou indisponíveis.'});
    }
  }
  function setMonth(x) { if(!validMonth(x))return;selected=x;if(!locked)render(rows); }
  function shiftMonth(n) {let y=Number(selected.slice(0,4)),m=Number(selected.slice(5));const d=new Date(y,m-1+n,1);setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);}
  function printTables(r) {
    const tr=(records,paid)=>records.map(c=>`<tr><td>${safe(displayDate(paid?receivedDate(c):dueDate(c)))}</td><td>${safe(recordNames(c))}</td><td>${safe(c.servicoNome||'Serviço')}</td><td>${safe(({'pix':'Pix','credito':'Crédito','debito':'Débito','dinheiro':'Dinheiro'})[c.formaPagamento]||'—')}</td><td class="right">${safe(money(valueOf(c)))}</td></tr>`).join('');
    return `<section class="period"><h2>${safe(monthName(r.month))}</h2><div class="stats"><div><b>Recebido</b><strong>${money(r.paidTotal)}</strong><small>${r.paid.length} lançamentos</small></div><div><b>A receber</b><strong>${money(r.pendingTotal)}</strong><small>${r.pending.length} pendências</small></div></div>${[['Recebimentos','Recebido em',r.paid,true],['A receber','Vencimento',r.pending,false]].map(([label,dt,items,paid])=>`<h3>${label}</h3><table><thead><tr><th>${dt}</th><th>Cliente</th><th>Serviço</th><th>Pagamento</th><th class="right">Valor</th></tr></thead><tbody>${items.length?tr(items,paid):'<tr><td colspan="5">Sem lançamentos no período.</td></tr>'}</tbody></table>`).join('')}</section>`;
  }
  function printHtml(list, all) {
    const title=all?'Histórico financeiro completo':`Histórico financeiro — ${monthName(selected)}`;
    const periods=all?byMonth(list):[summary(list,selected)];
    const allTotals=totals(list);
    const nome=localStorage.getItem('evolufisico_pro_nome')||'Profissional não informado';
    const cref=localStorage.getItem('evolufisico_pro_cref')||'';
    const clinica=localStorage.getItem('evolufisico_pro_clinica')||'';
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safe(title)}</title><style>
    *{box-sizing:border-box}html,body{margin:0;font:13px/1.45 system-ui,Arial,sans-serif;color:#152d25;background:#eef4f0} .toolbar{position:sticky;top:0;display:flex;gap:12px;align-items:center;justify-content:space-between;padding:13px 20px;background:#10382c;color:white;z-index:10}.toolbar span{font-weight:650}.buttons{display:flex;gap:9px;flex-wrap:wrap}.toolbar button{padding:10px 15px;border:1px solid #c9e8d8;border-radius:9px;font-weight:750;cursor:pointer;background:transparent;color:white}.toolbar button.primary{background:#b8eed0;color:#143e2c}.sheet{max-width:210mm;margin:22px auto;padding:20mm 14mm;background:#fff;box-shadow:0 8px 28px #163b2b22}h1{font-size:23px;margin:0 0 6px;color:#0b4b36}h2{font-size:18px;margin:22px 0 10px;color:#0c5742}h3{font-size:13px;margin:14px 0 5px}p{margin:4px 0;color:#53675d}.stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}.stats div{padding:13px;border:1px solid #bfdccb;border-radius:9px}.stats b,.stats strong,.stats small{display:block}.stats strong{font-size:20px;margin:4px 0}.stats small{color:#678477}.summary{padding:10px;border:1px solid #b6d4c5;border-radius:9px;background:#f3faf6}.summary b{display:inline-block;margin-right:20px}table{width:100%;border-collapse:collapse;font-size:11px;table-layout:fixed}th,td{padding:8px 5px;text-align:left;border-bottom:1px solid #d8e4dd;overflow-wrap:anywhere}th{background:#edf7f0;color:#194b34}.right{text-align:right}.period{break-inside:auto}thead{display:table-header-group}tr{break-inside:avoid}.notice{font-size:10px;line-height:1.45;color:#617568;margin-top:22px}
    @media(max-width:620px){.toolbar{flex-wrap:wrap;padding:10px}.buttons{width:100%}.buttons button{flex:1}.sheet{margin:0;padding:18px 12px;box-shadow:none}.stats{grid-template-columns:1fr 1fr}table{font-size:10px}th,td{padding:6px 3px}}
    @media print{@page{size:A4;margin:12mm}html,body{background:white}.toolbar{display:none!important}.sheet{max-width:none;box-shadow:none;margin:0;padding:0}.period{break-before:auto}h2,h3{break-after:avoid}.notice{color:#515c54}}
    </style></head><body><div class="toolbar no-print"><span>${safe(title)}</span><div class="buttons"><button id="cancel" type="button">← Voltar / Cancelar</button><button id="print" type="button" class="primary">Salvar como PDF / Imprimir</button></div></div><main class="sheet"><header><h1>EvoluFísico · Cobranças</h1><p><strong>${safe(title)}</strong></p><p>Profissional: ${safe(nome)}${cref?' · '+safe(cref):''}${clinica?' · '+safe(clinica):''}</p><p>Emitido em ${displayDate(localToday())}</p></header>${all?`<div class="summary"><b>Recebido no histórico: ${money(allTotals.paidTotal)}</b><b>A receber: ${money(allTotals.pendingTotal)}</b><b>Registros: ${list.length}</b></div>`:''}${periods.map(printTables).join('')}<p class="notice">Caixa mensal: valores pagos agrupados pela data do recebimento; valores a receber agrupados pelo vencimento. As cobranças antigas sem data própria de pagamento usam a data do lançamento como referência. Documento gerencial baseado nos registros do aplicativo; não equivale a extrato bancário ou documento fiscal.</p></main><script>document.getElementById('print').addEventListener('click',()=>window.print());document.getElementById('cancel').addEventListener('click',()=>{window.close();if(!window.closed)document.querySelector('.toolbar span').textContent='Prévia cancelada. Feche esta aba para voltar.'});document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.getElementById('cancel').click()}});<\/script></body></html>`;
  }
  async function generatePDF(all) {
    // A janela é aberta diretamente no clique para não ser bloqueada após await.
    const w=window.open('','_blank');if(!w){alert('Permita pop-ups para abrir o relatório PDF.');return}
    try {
      const list=await read();
      w.document.open();w.document.write(printHtml(list,all));w.document.close();
      w.focus();
    } catch(e) {
      w.close();$('ef-fin-security').textContent=e.message;$('ef-fin-security').hidden=false;
    }
  }
  function init() {
    if(ready||!$('ef-fin-panel'))return;ready=true;
    $('ef-fin-month').addEventListener('change',e=>setMonth(e.target.value));
    $('ef-fin-prev').addEventListener('click',()=>shiftMonth(-1));
    $('ef-fin-next').addEventListener('click',()=>shiftMonth(1));
    $('ef-fin-today').addEventListener('click',()=>setMonth(currentMonth()));
    $('ef-fin-pdf-month').addEventListener('click',()=>generatePDF(false));
    $('ef-fin-pdf-total').addEventListener('click',()=>generatePDF(true));
    $('ef-fin-months').addEventListener('click',e=>{const x=e.target.closest('[data-month]');if(x)setMonth(x.dataset.month)});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(currentMonth()!==lastMonth)selected=currentMonth();refresh()}});
    refresh();
    // Troca de competência automaticamente à meia-noite, inclusive com a aba aberta.
    window.setInterval(()=>{if(!document.hidden && currentMonth()!==lastMonth){selected=currentMonth();refresh()}},60000);
  }
  window.EFBillingMonthly={init,refresh,setMonth,generatePDF,utils:{summary,byMonth,totals,receivedDate,dueDate,localToday,month}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

