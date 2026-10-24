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
    const timeline = (result.records || []).slice(-4).map(row => {
      const m = row.metrics || {};
      const n = value => finite(m[value]) ? m[value].toFixed(2) : 'não disponível';
      return String(row.date || 'data não informada') + ': peso ' + n('peso') +
        ' kg; cintura ' + n('cintura') + ' cm; gordura estimada ' + n('gordura') +
        '%; massa livre de gordura estimada ' + n('massaMagra') + ' kg.';
    });
    facts.push('Avaliações selecionadas (dados calculados e validados): ' + timeline.join(' | '));
    const e68 = (result.engines?.EF68?.findings || []).slice(0, 5)
      .map(x => [x.title, x.text].filter(v => typeof v === 'string').join(': ').slice(0, 220));
    const e70 = (result.engines?.EF70?.actions || []).slice(0, 5)
      .map(x => String(x.text || '').slice(0, 220)).filter(Boolean);
    const e78 = (result.engines?.EF78?.issues || []).slice(0, 8)
      .map(x => String(x).slice(0, 180));
    const lab = result.engines?.EF77?.lab;
    if (lab && finite(lab.adjustment))
      facts.push('EF77, suficiência documental: ajuste ' + lab.adjustment +
        '; ' + String(lab.reason || '').slice(0, 220));
    if (e68.length) facts.push('EF68, sinais: ' + e68.join(' | '));
    if (e70.length) facts.push('EF70, ações sugeridas: ' + e70.join(' | '));
    if (e78.length) facts.push('EF78, comparabilidade: ' + e78.join(' | '));
    const balance = (result.engines?.EF80?.massBalance || []).slice(0, 4)
      .map(x => String(x.date || '') + ' ' + String(x.status || ''));
    if (balance.length) facts.push('EF80, balanço de composição: ' + balance.join(' | '));
    const contextFacts = result.engines?.EF81?.facts || [];
    if (contextFacts.length)
      facts.push('EF81, registros de contexto informado: ' + contextFacts.slice(0, 8)
        .map(x => String(x.date || '') + ' ' + String(x.kind || '')).join(' | '));
    const trends = Object.entries(result.engines?.EF82?.metrics || {})
      .map(([key, value]) => key + ': ' + String(value.status || 'sem status') +
        (finite(value.theilSen30) ? ', tendência robusta por 30 dias ' + value.theilSen30 : ''));
    if (trends.length) facts.push('EF82: ' + trends.join(' | '));
    const alerts = (result.warnings || []).filter(x => typeof x === 'string')
      .slice(0, 12).map(x => x.slice(0, 180));
    facts.push('Ressalvas: ' + (alerts.length ? alerts.join('; ') : 'nenhuma adicional informada.'));
    facts.push('Não inferir causalidade, eficácia de intervenção, tratamento ou diagnóstico.');
    return facts.join('\n').slice(0, 7900);
  }

  function mount(container, result, settingsOnly = false) {
    const summary = settingsOnly ? container : container?.querySelector('#efia-panel-intelligence');
    if (!summary) return;
    const existing = summary.querySelector('.efi-intelligence-alpha');
    if (existing) { existing.__efiRefreshChat?.(); return; }
    const section = document.createElement('section');
    section.className = 'efia-card efi-intelligence-alpha';
    section.innerHTML = `<h3>EFI Intelligence <small>Alpha</small></h3>
<p class="efi-ai-help">Interpretação local baseada nos motores EFIA. A revisão profissional é obrigatória.</p>
<label>Modelo de inteligência
<select data-efi-choice aria-label="Escolher modelo de IA"></select></label>
<div class="efi-ai-actions">
<button type="button" data-efi-status>Verificar</button>
<button type="button" data-efi-install hidden>Baixar modelo</button>
<button type="button" data-efi-select hidden>Ativar modelo</button>
<button type="button" data-efi-remove hidden>Remover modelo</button>
<button type="button" data-efi-explain hidden>Gerar interpretação</button>
</div>
<p class="efi-ai-state" role="status" aria-live="polite"></p>
<progress class="efi-ai-progress" value="0" max="100" hidden aria-label="Progresso do download do modelo"></progress>
<pre class="efi-ai-answer" hidden></pre>
<section class="efi-chat" data-efi-chat hidden>
<h4>Chat sobre o aluno selecionado</h4>
<p class="efi-ai-help">Consulta somente a análise atual. O histórico fica salvo localmente e criptografado, separado dos dados do aluno.</p>
<div class="efi-chat-log" data-efi-chat-log role="log" aria-live="polite" aria-label="Histórico da conversa"></div>
<p class="efi-chat-state" data-efi-chat-state role="status" aria-live="polite"></p>
<form data-efi-chat-form>
<label for="efi-chat-question">Sua pergunta</label>
<textarea id="efi-chat-question" data-efi-chat-input maxlength="1200" rows="3" placeholder="Pergunte sobre as avaliações selecionadas"></textarea>
<div class="efi-ai-actions">
<button type="submit" data-efi-chat-send>Enviar pergunta</button>
<button type="button" data-efi-chat-clear>Limpar histórico do chat</button>
</div>
</form>
</section>`;
    summary.append(section);
    const el = selector => section.querySelector(selector);
    const choice = el('[data-efi-choice]');
    const status = el('[data-efi-status]');
    const install = el('[data-efi-install]');
    const select = el('[data-efi-select]');
    const remove = el('[data-efi-remove]');
    const explain = el('[data-efi-explain]');
    const output = el('.efi-ai-answer');
    const state = el('.efi-ai-state');
    const progressBar = el('.efi-ai-progress');
    const chatPanel = el('[data-efi-chat]');
    const chatLog = el('[data-efi-chat-log]');
    const chatState = el('[data-efi-chat-state]');
    const chatForm = el('[data-efi-chat-form]');
    const chatInput = el('[data-efi-chat-input]');
    const chatSend = el('[data-efi-chat-send]');
    const chatClear = el('[data-efi-chat-clear]');
    const controls = [choice,status,install,select,remove,explain,chatInput,chatSend,chatClear];
    let catalog = null;
    let busy = false;
    let chatMessages = [];
    let chatRecordId = '';
    let chatProfileKey = '';
    let chatLoaded = false;
    let chatLoadSequence = 0;
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
      chatPanel.hidden = settingsOnly;
      const chatReady = !settingsOnly && picked.installed && picked.id === catalog.selectedId && catalog.runtimeReady;
      chatInput.disabled = busy || !chatReady || !chatLoaded;
      chatSend.disabled = busy || !chatReady || !chatLoaded;
      chatClear.disabled = busy || !chatRecordId || !chatLoaded;
      const warning = catalog.installedRamGB > 0 && picked.recommendedRamGB > catalog.installedRamGB
        ? ' Esse modelo exige mais RAM para desempenho confortável na configuração atual de hardware.'
        : '';
      message((picked.installed ? 'Modelo instalado.' : 'Modelo disponível para download.')
        + (picked.id === catalog.selectedId ? ' Selecionado atualmente.' : '')
        + (catalog.runtimeReady ? '' : ' Runtime nativo ainda não incluído neste build Alpha.')
        + warning);
    }
    const chatStatus = value => { chatState.textContent = value; };
    function renderChatHistory() {
      chatLog.replaceChildren();
      for (const turn of chatMessages.slice(-20)) {
        const item = document.createElement('article');
        item.className = 'efi-chat-message';
        const label = document.createElement('strong');
        label.textContent = turn.role === 'user' ? 'Você' : 'EFI';
        const text = document.createElement('p');
        text.textContent = turn.content;
        item.append(label, text);
        chatLog.append(item);
      }
      chatLog.scrollTop = chatLog.scrollHeight;
    }
    async function profileRecordId(profileKey) {
      if (!window.crypto?.subtle || !window.TextEncoder)
        throw new Error('Não foi possível proteger a identidade do histórico do chat.');
      const digest = await window.crypto.subtle.digest('SHA-256',
        new TextEncoder().encode(String(profileKey)));
      const hex = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
      return 'efi-chat-v1-' + hex;
    }
    function validHistory(value) {
      if (!value || value.schema !== 1 || !Array.isArray(value.messages)) return [];
      return value.messages.filter(turn =>
        turn && ['user','assistant'].includes(turn.role) &&
        typeof turn.content === 'string' && turn.content.trim() &&
        turn.content.length <= 8000
      ).map(turn => ({...turn,status:turn.status === 'pending' ? 'pending' : 'complete'})).slice(-80);
    }
    async function ensureChatHistory() {
      const snapshot = window.EFIAView?.getCurrent?.();
      if (!snapshot?.profileKey) {
        ++chatLoadSequence;
        chatProfileKey = '';
        chatRecordId = '';
        chatLoaded = false;
        chatMessages = [];
        renderChatHistory();
        chatStatus('Selecione um aluno e uma análise para iniciar o chat.');
        updateButtons();
        return false;
      }
      const profileKey = String(snapshot.profileKey);
      if (profileKey === chatProfileKey && chatLoaded && chatRecordId) return true;
      const sequence = ++chatLoadSequence;
      chatProfileKey = profileKey;
      chatRecordId = '';
      chatLoaded = false;
      chatMessages = [];
      renderChatHistory();
      chatStatus('Carregando histórico criptografado do aluno...');
      chatInput.disabled = true;
      chatSend.disabled = true;
      const id = await profileRecordId(profileKey);
      if (sequence !== chatLoadSequence) return false;
      chatRecordId = id;
      if (!window.EFNativeStorage?.readJSON || !window.EFNativeStorage?.writeJSON) {
        chatStatus('O histórico criptografado está disponível somente no Desktop EFI Alpha.');
        return false;
      }
      try {
        const saved = await window.EFNativeStorage.readJSON(id);
        if (sequence !== chatLoadSequence || chatRecordId !== id) return false;
        chatMessages = validHistory(saved);
        chatLoaded = true;
        renderChatHistory();
        chatStatus(chatMessages.length
          ? 'Histórico local restaurado. A EFI considera até as 12 mensagens anteriores ao responder.'
          : 'Nova conversa. As mensagens serão guardadas localmente e criptografadas.');
        updateButtons();
        return true;
      } catch (error) {
        if (sequence === chatLoadSequence) {
          chatLoaded = false;
          chatStatus('Não foi possível abrir o histórico protegido: ' + error.message);
          updateButtons();
        }
        return false;
      }
    }
    function currentChatContext() {
      const snapshot = window.EFIAView?.getCurrent?.();
      if (!snapshot) throw new Error('Selecione as avaliações novamente.');
      const refreshed = window.EFIAHost?.analyze?.({
        host:window, profileKey:snapshot.profileKey, selectedIds:snapshot.selectedIds
      });
      if (!refreshed?.eligible || refreshed.original?.safety?.canTrend !== true ||
          JSON.stringify(refreshed.recordsRaw) !== JSON.stringify(snapshot.result.recordsRaw))
        throw new Error('Os dados mudaram ou a auditoria bloqueou a análise. Reabra Análises.');
      if (refreshed.recordsRaw.some(row => String(row.cliente_id) !== String(snapshot.profileKey)))
        throw new Error('A análise contém registros de mais de um aluno.');
      return validatedFacts(refreshed);
    }
    async function saveChatHistory() {
      chatMessages = chatMessages.slice(-80);
      await window.EFNativeStorage.writeJSON(chatRecordId, {
        schema:1, updatedAt:new Date().toISOString(), messages:chatMessages
      });
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
      finally { setBusy(false); updateButtons(); }
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
    chatForm.addEventListener('submit', async event => {
      event.preventDefault();
      const question = chatInput.value.trim();
      if (!question) { chatStatus('Digite uma pergunta.'); return; }
      if (question.length > 1200) { chatStatus('A pergunta deve ter até 1.200 caracteres.'); return; }
      try {
        if (!await ensureChatHistory()) return;
        const context = currentChatContext();
        const prior = chatMessages.filter(turn => turn.status !== 'pending').slice(-12).map(turn => ({
          role:turn.role, content:turn.content.slice(0, 800)
        }));
        const userTurn = {role:'user',content:question,at:new Date().toISOString(),status:'pending'};
        let userSaved = false;
        chatMessages.push(userTurn);
        renderChatHistory();
        await saveChatHistory();
        userSaved = true;
        chatInput.value = '';
        setBusy(true);
        updateButtons();
        chatStatus('A EFI está consultando os dados validados deste aluno...');
        const reply = await request('chat', {context, question, history:prior});
        const answer = String(reply.text || '').trim();
        if (!answer) throw new Error('A EFI não retornou uma resposta.');
        userTurn.status = 'complete';
        chatMessages.push({role:'assistant',content:answer.slice(0,8000),at:new Date().toISOString(),status:'complete'});
        chatMessages = chatMessages.slice(-80);
        renderChatHistory();
        try {
          await saveChatHistory();
          chatStatus('Resposta baseada na análise selecionada. Revise antes de compartilhar.');
        } catch (error) {
          chatStatus('Resposta concluída, mas não foi possível salvar o histórico: ' + error.message);
        }
      } catch (error) {
        if (!userSaved && chatMessages.at(-1) === userTurn) {
          chatMessages.pop();
          renderChatHistory();
        }
        chatStatus(error.message);
      } finally { setBusy(false); updateButtons(); }
    });
    chatClear.addEventListener('click', async () => {
      if (!chatRecordId || !window.confirm('Apagar somente o histórico local deste chat? Os dados do aluno e as avaliações serão preservados.')) return;
      setBusy(true);
      try {
        await window.EFNativeStorage.delete(chatRecordId);
        chatMessages = [];
        renderChatHistory();
        chatStatus('Histórico deste chat apagado. Os dados do aluno foram preservados.');
      } catch (error) { chatStatus('Não foi possível apagar o histórico: ' + error.message); }
      finally { setBusy(false); updateButtons(); }
    });
    section.__efiRefreshChat = () => { ensureChatHistory(); };
    inspect();
    ensureChatHistory();
  }
  window.EFIAIntelligence = Object.freeze({mount, mountSettings: container => mount(container, null, true)});
})();
