/* Windows RC-6: optional assessment objectives. Stored inside the existing encrypted SQLite evaluation JSON. */
(function (global) {
  'use strict';
  const definitions = Object.freeze({
    emagrecimento: {label:'Emagrecimento', adjustment:-20},
    perda_peso: {label:'Perda de peso', adjustment:-20},
    hipertrofia: {label:'Hipertrofia', adjustment:10},
    definicao_muscular: {label:'Definição muscular', adjustment:0},
    recomposicao: {label:'Recomposição corporal', adjustment:0},
    condicionamento: {label:'Condicionamento físico', adjustment:0},
    manutencao: {label:'Manutenção', adjustment:0},
    personalizado: {label:'Personalizado', adjustment:0}
  });
  const fields = ['kind','metric','target','tolerance','deadline','note'];
  const byId = name => global.document.getElementById('ef322-' + name);
  const text = name => String(byId(name)?.value ?? '').trim();
  function collect() {
    const kind = text('kind');
    if (!kind || !Object.prototype.hasOwnProperty.call(definitions,kind)) return null;
    return {
      kind, metric:text('metric'), target:text('target'),
      tolerance:text('tolerance'), deadline:text('deadline'), note:text('note')
    };
  }
  const metrics = Object.freeze({peso:'Peso (kg)',gordura:'Gordura corporal (%)',massa_magra:'Massa magra (kg)',cintura:'Cintura (cm)',imc:'IMC'});
  function describe(plan) {
    if (!plan || typeof plan !== 'object') return '';
    const kind = String(plan.kind ?? '');
    if (!Object.prototype.hasOwnProperty.call(definitions,kind)) return '';
    const parts = [definitions[kind].label];
    const metric=String(plan.metric??'').trim(),target=String(plan.target??'').trim();
    const tolerance=String(plan.tolerance??'').trim(),deadline=String(plan.deadline??'').trim();
    const note=String(plan.note??'').trim().slice(0,200);
    if(metric)parts.push('Indicador: '+(Object.prototype.hasOwnProperty.call(metrics,metric)?metrics[metric]:metric.slice(0,50)));
    if(target)parts.push('Meta: '+target.slice(0,24));
    if(tolerance)parts.push('Tolerância: '+tolerance.slice(0,24));
    if(/^\d{4}-\d{2}-\d{2}$/.test(deadline))parts.push('Prazo: '+deadline.slice(8,10)+'/'+deadline.slice(5,7)+'/'+deadline.slice(0,4));
    if(note)parts.push('Observações: '+note);
    return parts.join(' · ');
  }
  function readyForTracking(plan) {
    if (!plan || !plan.kind || !plan.metric || !plan.deadline) return false;
    const raw = String(plan.target ?? '').trim();
    if (!/^\d+(?:[.,]\d+)?$/.test(raw)) return false;
    const number = Number(raw.replace(',','.'));
    const evaluationDate = String(global.document.getElementById('data_avaliacao')?.value || '');
    return Number.isFinite(number) && number > 0 &&
      /^\d{4}-\d{2}-\d{2}$/.test(plan.deadline) &&
      (!evaluationDate || plan.deadline >= evaluationDate);
  }
  function sync() {
    const enabled = Boolean(text('kind'));
    for (const field of fields.slice(1)) {
      const input = byId(field);
      if (input) input.disabled = !enabled;
    }
    const status = global.document.getElementById('ef322-status');
    if (status) {
      status.textContent = !enabled
        ? 'Sem objetivo definido; a avaliação poderá ser salva normalmente.'
        : readyForTracking(collect())
          ? 'Objetivo e meta preenchidos. O monitoramento automático ainda não está disponível nesta RC.'
          : 'Objetivo escolhido. Campos de acompanhamento opcionais; a avaliação poderá ser salva normalmente.';
    }
  }
  function restore(plan) {
    for (const field of fields) {
      const input = byId(field);
      if (input) input.value = plan?.[field] == null ? '' : String(plan[field]);
    }
    sync();
  }
  function init() {
    const kind = byId('kind');
    if (!kind) return;
    kind.addEventListener('change',sync);
    for (const field of fields.slice(1)) byId(field)?.addEventListener('input',sync);
    global.document.getElementById('data_avaliacao')?.addEventListener('change',sync);
    sync();
  }
  global.EFDesktopObjectives = Object.freeze({definitions,collect,describe,readyForTracking,restore,sync});
  if (global.document.readyState === 'loading') global.document.addEventListener('DOMContentLoaded',init);
  else init();
})(window);
