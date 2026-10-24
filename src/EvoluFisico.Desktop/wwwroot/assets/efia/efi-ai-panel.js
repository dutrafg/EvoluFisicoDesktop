/* EFI Intelligence Alpha — presentation only; computations remain with EFIA. */
(() => {
  'use strict';
  const pending = new Map();
  let seq = 0;
  const native = window.chrome && window.chrome.webview;

  if (native) {
    native.addEventListener('message', e => {
      const m = e.data;
      if (!m || m.type !== 'efi-ai-result') return;
      const request = pending.get(m.requestId);
      if (!request) return;
      pending.delete(m.requestId);
      if (m.ok) request.resolve(m.data);
      else request.reject(new Error(m.error || 'Operação EFI não concluída.'));
    });
  }

  function request(action, extra = {}) {
    if (!native) return Promise.reject(new Error('Disponível apenas no EvoluFísico Desktop.'));
    const requestId = 'efi_' + (++seq);
    return new Promise((resolve, reject) => {
      pending.set(requestId, {resolve, reject});
      try {
        native.postMessage({type: 'efi-ai', requestId, action, ...extra});
      } catch (e) {
        pending.delete(requestId);
        reject(e);
      }
    });
  }

  const finite = x => typeof x === 'number' && Number.isFinite(x);
  function validatedFacts(result) {
    if (!result || result.eligible !== true || result.original?.safety?.canTrend !== true)
      throw new Error('Análise bloqueada pela auditoria EFIA.');
    const findings = ['Resumo auditado dos motores EFIA; valores são descritivos, não diagnósticos.'];
    findings.push(String(result.summary || '').slice(0, 400));
    for (const [key, title, unit] of [
      ['peso','Peso corporal','kg'], ['cintura','Cintura','cm'],
      ['gordura','Gordura corporal estimada','p.p.'],
      ['massaMagra','Massa livre de gordura estimada','kg']
    ]) {
      const v = result.engines?.EF79?.results?.[key];
      const comparable = result.records?.length >= 3
        && window.EFIALocal?.comparable?.(result.records, key) === true;
      const composition = ['gordura','massaMagra'].includes(key);
      const coherent = !composition || (
        (result.engines?.EF80?.issues || []).length === 0 &&
        !(result.engines?.EF80?.massBalance || []).some(x => x.status === 'incompatible')
      );
      if (comparable && coherent && finite(v?.change))
        findings.push(title + ': variação ' + v.change.toFixed(2) + ' ' + unit + '.');
      else
        findings.push(title + ': comparação não liberada.');
    }
    const alerts = (result.warnings || []).filter(x => typeof x === 'string')
      .slice(0, 12).map(x => x.slice(0, 240));
    findings.push('Alertas da auditoria: ' + (alerts.length ? alerts.join('; ') : 'nenhum informado.'));
    findings.push('Não atribua causalidade, eficácia de intervenção ou diagnóstico.');
    return findings.join('\n').slice(0, 5900);
  }

  function mount(container, result) {
    const summary = container.querySelector('#efia-panel-summary');
    if (!summary || summary.querySelector('.efi-intelligence-alpha')) return;
    const section = document.createElement('section');
    section.className = 'efia-card efi-intelligence-alpha';
    section.innerHTML = '<h3>EFI Intelligence <small>Alpha</small></h3>' +
      '<p class="efi-ai-help">Interpretação local a partir da análise EFIA validada. ' +
      'A revisão profissional é obrigatória.</p>' +
      '<div class="efi-ai-actions">' +
      '<button type="button" data-efi-status>Verificar pacote de IA</button>' +
      '<button type="button" data-efi-install hidden>Instalar Qwen3.5-2B (~1,3 GB)</button>' +
      '<button type="button" data-efi-explain hidden>Gerar interpretação</button>' +
      '</div><p class="efi-ai-state" role="status" aria-live="polite"></p>' +
      '<pre class="efi-ai-answer" hidden></pre>';
    summary.append(section);
    const state = section.querySelector('.efi-ai-state');
    const install = section.querySelector('[data-efi-install]');
    const explain = section.querySelector('[data-efi-explain]');
    const status = section.querySelector('[data-efi-status]');
    const output = section.querySelector('.efi-ai-answer');
    function message(text) { state.textContent = text; }
    function busy(value) {
      install.disabled = value;
      explain.disabled = value;
      status.disabled = value;
    }
    async function inspect() {
      busy(true);
      try {
        const r = await request('status');
        install.hidden = !!r.installed;
        explain.hidden = !r.installed || !r.runtimeReady;
        message(!r.installed ? 'Pacote de IA não instalado. A análise EFIA permanece disponível.'
          : !r.runtimeReady ? 'Modelo instalado. Runtime nativo pendente deste build Alpha.'
          : 'Qwen instalado e pronto para processamento offline.');
      } catch (e) {
        message(e.message);
      } finally { busy(false); }
    }
    status.addEventListener('click', inspect);
    install.addEventListener('click', async () => {
      if (!window.confirm('Baixar aproximadamente 1,3 GB do modelo Qwen3.5-2B e instalar localmente?')) return;
      busy(true);
      message('Baixando e verificando o pacote. Não feche o aplicativo.');
      try {
        await request('install', {consent:true});
        message('Pacote verificado e instalado.');
      } catch (e) { message(e.message); }
      finally { busy(false); await inspect(); }
    });
    explain.addEventListener('click', async () => {
      // Re-read the live EFIA selection, never reuse old snapshots after edits.
      const latest = window.EFIAView?.getCurrent?.();
      try {
        if (!latest || JSON.stringify(latest.selectedIds) !== JSON.stringify(
          window.EFIAView?.getCurrent?.()?.selectedIds))
          throw new Error('Reabra a análise para atualizar a seleção.');
        const facts = validatedFacts(latest.result);
        busy(true);
        output.hidden = true;
        message('Interpretando os resultados localmente...');
        const r = await request('analyze', {summary:facts});
        output.textContent = r.text || 'Resposta vazia.';
        output.hidden = false;
        message('Rascunho gerado. Revise antes de utilizar.');
      } catch (e) { message(e.message); }
      finally { busy(false); }
    });
    inspect();
  }
  window.EFIAIntelligence = Object.freeze({mount});
})();
