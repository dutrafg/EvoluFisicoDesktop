/* EFI Intelligence Alpha — user-controlled local model catalog.
 * EFIA owns all computations; Qwen may only rephrase validated observations. */
(() => {
  'use strict';
  const pending = new Map();
  let seq = 0;
  const native = window.chrome?.webview;

  if (native) native.addEventListener('message', event => {
    const m = event.data;
    if (!m || (m.type !== 'efi-ai-result' && m.type !== 'efi-ai-progress')) return;
    const request = pending.get(m.requestId);
    if (!request) return;
    if (m.type === 'efi-ai-progress') {
      request.onProgress?.(m);
      return;
    }
    pending.delete(m.requestId);
    if (m.ok) request.resolve(m.data);
    else request.reject(new Error(m.error || 'Operação EFI não concluída.'));
  });

  function request(action, extra = {}, onProgress = null) {
    if (!native) return Promise.reject(new Error('Recurso exclusivo do EvoluFísico Desktop.'));
    const requestId = 'efi_' + (++seq);
    return new Promise((resolve, reject) => {
      pending.set(requestId, {resolve, reject, onProgress});
      try { native.postMessage({type:'efi-ai', requestId, action, ...extra}); }
      catch (error) { pending.delete(requestId); reject(error); }
    });
  }

  const finite = v => typeof v === 'number' && Number.isFinite(v);
  function validatedFacts(result) {
    if (!result?.eligible || result.original?.safety?.canTrend !== true)
      throw new Error('A auditoria EFIA bloqueou esta análise.');
    const facts = [
      'Resumo dos cálculos e da auditoria EFIA; não fornece diagnóstico.',
      String(result.summary || '').slice(0, 400)
    ];
    for (const [key, title, unit] of [
      ['peso','Peso corporal','kg'],['cintura','Cintura','cm'],
      ['gordura','Gordura corporal estimada','p.p.'],
      ['massaMagra','Massa livre de gordura estimada','kg']
    ]) {
      const metric = result.engines?.EF79?.results?.[key];
      const comparable = result.records?.length >= 3
        && window.EFIALocal?.comparable?.(result.records, key) === true;
      const composition = ['gordura','massaMagra'].includes(key);
      const coherent = !composition || (
        (result.engines?.EF80?.issues || []).length === 0 &&
        !(result.engines?.EF80?.massBalance || []).some(x => x.status === 'incompatible')
      );
      facts.push(comparable && coherent && finite(metric?.change)
        ? title + ': variação ' + metric.change.toFixed(2) + ' ' + unit + '.'
        : title + ': comparação não liberada.');
    }
    const alerts = (result.warnings || []).filter(x => typeof x === 'string')
      .slice(0, 12).map(x => x.slice(0, 240));
    facts.push('Ressalvas: ' + (alerts.length ? alerts.join('; ') : 'nenhuma adicional informada.'));
    facts.push('Não inferir causalidade, eficácia de intervenção, tratamento ou diagnóstico.');
    return facts.join('\n').slice(0, 5900);
  }

  function mount(container, result, settingsOnly = false) {
    const summary = settingsOnly ? container : container?.querySelector('#efia-panel-intelligence');
    if (!summary || summary.querySelector('.efi-intelligence-alpha')) return;
    const section = document.createElement('section');
    section.className = 'efia-card efi-intelligence-alpha';
    section.innerHTML = `<h3>EFI Intelligence <small>Alpha</small></h3>
<p class="efi-ai-help">Interpretação local baseada nos motores EFIA. A revisão profissional é obrigatória.</p>
<label for="efi-ai-model-choice">Modelo de inteligência</label>
<select id="efi-ai-model-choice" aria-label="Escolher modelo de IA"></select>
<div class="efi-ai-actions">
<button type="button" data-efi-status>Verificar</button>
<button type="button" data-efi-install hidden>Baixar modelo</button>
<button type="button" data-efi-select hidden>Ativar modelo</button>
<button type="button" data-efi-remove hidden>Remover modelo</button>
<button type="button" data-efi-explain hidden>Gerar interpretação</button>
</div>
<p class="efi-ai-state" role="status" aria-live="polite"></p>
<progress class="efi-ai-progress" value="0" max="100" hidden aria-label="Progresso do download do modelo"></progress>
<pre class="efi-ai-answer" hidden></pre>`;
    summary.append(section);
    const el = selector => section.querySelector(selector);
    const choice = el('#efi-ai-model-choice');
    const status = el('[data-efi-status]');
    const install = el('[data-efi-install]');
    const select = el('[data-efi-select]');
    const remove = el('[data-efi-remove]');
    const explain = el('[data-efi-explain]');
    const output = el('.efi-ai-answer');
    const state = el('.efi-ai-state');
    const progressBar = el('.efi-ai-progress');
    const controls = [choice,status,install,select,remove,explain];
    let catalog = null;
    let busy = false;
    const message = value => { state.textContent = value; };
    function setBusy(value) {
      busy = value;
      controls.forEach(control => { control.disabled = value; });
    }
    function updateButtons() {
      const picked = catalog?.models?.find(model => model.id === choice.value);
      if (!picked) return;
      install.hidden = !!picked.installed;
      select.hidden = !picked.installed || picked.id === catalog.selectedId;
      remove.hidden = !picked.installed;
      explain.hidden = settingsOnly || !picked.installed || picked.id !== catalog.selectedId || !catalog.runtimeReady;
      const warning = catalog.installedRamGB > 0 && picked.recommendedRamGB > catalog.installedRamGB
        ? ' Esse modelo exige mais RAM para desempenho confortável na configuração atual de hardware.'
        : '';
      message((picked.installed ? 'Modelo instalado.' : 'Modelo disponível para download.')
        + (picked.id === catalog.selectedId ? ' Selecionado atualmente.' : '')
        + (catalog.runtimeReady ? '' : ' Runtime nativo ainda não incluído neste build Alpha.')
        + warning);
    }
    async function inspect() {
      if (busy) return;
      setBusy(true);
      try {
        const before = choice.value;
        catalog = await request('status');
        choice.replaceChildren();
        for (const model of catalog.models) {
          const option = document.createElement('option');
          option.value = model.id;
          option.textContent = `${model.label} · ${model.sizeGB.toLocaleString('pt-BR')} GB${model.installed ? ' · Instalado' : ''}`;
          choice.append(option);
        }
        const available = catalog.models.some(m => m.id === before) ? before : catalog.selectedId;
        choice.value = available;
        updateButtons();
      } catch (error) { message(error.message); }
      finally { setBusy(false); }
    }
    choice.addEventListener('change', updateButtons);
    status.addEventListener('click', inspect);
    install.addEventListener('click', async () => {
      const picked = catalog.models.find(m => m.id === choice.value);
      if (!picked || !window.confirm(`Baixar ${picked.label} (~${picked.sizeGB} GB) para este computador?`)) return;
      setBusy(true);
      message('Baixando o pacote e verificando sua integridade. Não feche o aplicativo.');
      progressBar.hidden = false;
      progressBar.value = 0;
      try {
        await request('install', {modelId:picked.id, consent:true}, info => {
          const received = Number(info.downloadedBytes) || 0;
          const total = Number(info.totalBytes) || 0;
          const percent = total > 0 ? Math.min(100, Math.floor(received / total * 100)) : 0;
          progressBar.value = percent;
          message(`Baixando modelo: ${percent}% (${(received / 1e9).toFixed(2)} GB).`);
        });
        message('Modelo instalado e verificado.');
      } catch (error) { message(error.message); }
      finally { progressBar.hidden = true; setBusy(false); await inspect(); }
    });
    select.addEventListener('click', async () => {
      setBusy(true);
      try {
        await request('select', {modelId:choice.value});
        message('Modelo ativo alterado.');
      } catch (error) { message(error.message); }
      finally { setBusy(false); await inspect(); }
    });
    remove.addEventListener('click', async () => {
      const picked = catalog.models.find(m => m.id === choice.value);
      if (!picked || !window.confirm(`Remover ${picked.label} deste computador? Os dados dos alunos serão preservados.`)) return;
      setBusy(true);
      try { await request('remove', {modelId:picked.id, consent:true}); message('Modelo removido.'); }
      catch (error) { message(error.message); }
      finally { setBusy(false); await inspect(); }
    });
    explain.addEventListener('click', async () => {
      try {
        const snapshot = window.EFIAView?.getCurrent?.();
        if (!snapshot) throw new Error('Selecione as avaliações novamente.');
        const refreshed = window.EFIAHost?.analyze?.({
          host:window, profileKey:snapshot.profileKey, selectedIds:snapshot.selectedIds
        });
        if (!refreshed?.eligible ||
            JSON.stringify(refreshed.recordsRaw) !== JSON.stringify(snapshot.result.recordsRaw))
          throw new Error('O histórico mudou. Reabra Análises para revalidar os dados.');
        const facts = validatedFacts(refreshed);
        setBusy(true);
        output.hidden = true;
        message('Gerando interpretação local...');
        const reply = await request('analyze', {summary:facts});
        output.textContent = reply.text || 'Resposta vazia.';
        output.hidden = false;
        message('Rascunho concluído; revise antes de compartilhar.');
      } catch (error) { message(error.message); }
      finally { setBusy(false); }
    });
    inspect();
  }
  window.EFIAIntelligence = Object.freeze({mount, mountSettings: container => mount(container, null, true)});
})();
