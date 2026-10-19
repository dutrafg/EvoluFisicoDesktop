/* 22-runtime.js */
/* ==========================================================================
   EVOLUFÍSICO v9.0-beta — MÓDULO DE COBRANÇA, PRECIFICAÇÃO E HISTÓRICO
   Foco exclusivo na precificação e histórico com Totais e Por Aluno
   ========================================================================== */
(function() {
    'use strict';

    const DB_KEY = 'evolufisico_cobrancas_db';
    let billingCache = null, billingRaw = null;
    async function loadBilling() {
        const raw=localStorage.getItem(DB_KEY);
        if (billingCache && raw===billingRaw) return structuredClone(billingCache);
        if (!raw) { billingCache=[]; billingRaw=raw; return []; }
        let data;
        try { data=JSON.parse(raw); } catch(e) {
            console.warn('[EvoluFísico] Histórico financeiro corrompido:', e);
            billingCache=[]; billingRaw=raw; return [];
        }
        const list=data&&data.__efEncrypted?await EF_Security.decryptObject(data.payload):data;
        if (!Array.isArray(list)) throw new Error('Histórico financeiro inválido. Restaure um backup.');
        billingCache=list;billingRaw=raw;
        return structuredClone(list);
    }


    function esc(v) {
        return String(v == null ? '' : v)
            .replace(/[&<>"']/g, function(c) {
                return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
            });
    }

    function sanitizeCsv(v) {
        let s = String(v == null ? '' : v).replace(/;/g, ' ').trim();
        if (/^[=+\-@]/.test(s)) {
            s = "'" + s;
        }
        return s;
    }


    function formatarData(dataIso) {
        if (!dataIso) return '—';
        const limpa = String(dataIso).split('T')[0];
        const partes = limpa.split('-');
        if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
        return dataIso;
    }

    const state = {
        modalidade: '1', // '1' = Individual, '2' = Dupla
        aluno1: { nome: '' },
        aluno2: { nome: '' },
        servicoId: 'completa',
        servicoNomePersonalizado: '',
        valorBaseUnitario: 150.00,
        data: new Date().toISOString().split('T')[0],
        tipoDesconto: 'porcentagem', // 'porcentagem' | 'valor'
        descontoInput: 0,
        motivoDesconto: '',
        formaPagamento: 'pix', // 'pix' | 'credito' | 'debito' | 'dinheiro'
        parcelasCartao: 1,
        valorDinheiroEntregue: 0,
        statusPagamento: 'pago', // 'pago' | 'pendente'
        
        // Filtros do Histórico
        filtroTexto: '',
        filtroStatus: 'todos', // 'todos' | 'pago' | 'pendente' | 'pix' | 'cartao' | 'dinheiro' | 'dupla' | 'individual'
        visaoHistorico: 'extrato' // 'extrato' | 'alunos'
    };

    const PRECOS_SERVICOS = {
        completa: 150.00,
        reavaliacao: 100.00,
        bioimpedancia: 80.00,
        treino_consultoria: 250.00,
        trimestral: 350.00,
        semestral: 600.00,
        personalizado: 150.00
    };

    function gerarIdCobranca() {
        return 'cob_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    }

    function carregarCobrancas() { return structuredClone(billingCache || []); }
    async function writeBilling(lista, key=EF_Security.key, protectedMode=EF_Security.isConfigured()) {
        if (!Array.isArray(lista)) throw new Error('Histórico financeiro inválido');
        const packet=protectedMode?{__efEncrypted:true,payload:await EF_Security.encryptObject(lista,key)}:lista;
        const raw=JSON.stringify(packet);
        localStorage.setItem(DB_KEY,raw);
        billingRaw=raw;billingCache=structuredClone(lista);
        return true;
    }
    async function salvarCobrancasDb(lista) {
        if (window.EF_Security && EF_Security.isConfigured() && !EF_Security.key) {
            const pass = prompt('🔐 O cofre está protegido. Digite a chave mestra para salvar a cobrança de forma criptografada:');
            if (!pass || !(await EF_Security.unlock(pass))) {
                notificar('Operação cancelada: a cobrança não pôde ser salva com o cofre bloqueado.', 'warning');
                return false;
            }
        }
        try { return await writeBilling(lista); }
        catch(e) { notificar('Não foi possível salvar a cobrança: '+e.message,'error'); return false; }
    }


    function notificar(msg, tipo) {
        if (typeof window.efToast === 'function') {
            window.efToast(msg, tipo || 'info');
        } else if (typeof window !== 'undefined' && typeof window.alert === 'function') {
            window.alert(msg);
        } else if (typeof alert === 'function') {
            alert(msg);
        } else {
            console.log(msg);
        }
    }

    // Modal de confirmação próprio: window.confirm() é bloqueado/ignorado em PWAs instalados
    // e WebViews (retorna false sem mostrar nada), o que impedia a exclusão.
    function confirmar(msg, onConfirm, rotuloOk) {
        const antigo = document.getElementById('cob-confirm-overlay');
        if (antigo) antigo.remove();

        const overlay = document.createElement('div');
        overlay.id = 'cob-confirm-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:1rem;';
        overlay.innerHTML =
            '<div style="background:var(--card-bg,#fff);color:var(--text-main,#0f172a);border-radius:14px;max-width:380px;width:100%;padding:1.25rem;box-shadow:0 20px 50px rgba(0,0,0,.35);">' +
              '<div style="font-weight:700;margin-bottom:.5rem;">Confirmar exclusão</div>' +
              '<div id="cob-confirm-msg" style="font-size:.9rem;line-height:1.4;margin-bottom:1rem;"></div>' +
              '<div style="display:flex;gap:.5rem;justify-content:flex-end;">' +
                '<button type="button" id="cob-confirm-cancel" class="btn btn-secondary btn-sm">Cancelar</button>' +
                '<button type="button" id="cob-confirm-ok" class="btn btn-danger btn-sm"></button>' +
              '</div>' +
            '</div>';
        document.body.appendChild(overlay);
        overlay.querySelector('#cob-confirm-msg').textContent = msg;
        overlay.querySelector('#cob-confirm-ok').textContent = rotuloOk || '🗑️ Excluir';

        const fechar = () => { overlay.remove(); document.removeEventListener('keydown', onKey, true); };
        const onKey = (e) => { if (e.key === 'Escape') fechar(); };
        document.addEventListener('keydown', onKey, true);

        overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });
        overlay.querySelector('#cob-confirm-cancel').addEventListener('click', fechar);
        overlay.querySelector('#cob-confirm-ok').addEventListener('click', () => {
            fechar();
            try { onConfirm(); } catch (err) { console.error(err); }
        });
        overlay.querySelector('#cob-confirm-cancel').focus();
    }

    function formatarMoeda(val) {
        const v = typeof val === 'number' && !isNaN(val) ? val : 0;
        return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function obterNomeServico() {
        if (state.servicoId === 'personalizado') {
            return state.servicoNomePersonalizado.trim() || 'Serviço Personalizado';
        }
        const sel = document.getElementById('cob_servico_select');
        if (sel && sel.selectedIndex >= 0) {
            return sel.options[sel.selectedIndex].text.split('(')[0].trim();
        }
        return 'Avaliação Física Completa';
    }

    function popularSelectAlunos() {
        let alunosCadastrados = [];
        try {
            if (typeof avaliacoes !== 'undefined' && Array.isArray(avaliacoes)) {
                alunosCadastrados = [...new Set(avaliacoes.map(a => a.nome).filter(Boolean))];
            } else {
                const bkp = localStorage.getItem('avaliacoes') || localStorage.getItem('evolufisico_avaliacoes');
                if (bkp) {
                    const parsed = JSON.parse(bkp);
                    if (Array.isArray(parsed)) {
                        alunosCadastrados = [...new Set(parsed.map(a => a.nome).filter(Boolean))];
                    }
                }
            }
        } catch(e) {
            console.warn('Não foi possível carregar lista de alunos', e);
        }

        const sel1 = document.getElementById('cob_select_aluno1');
        const sel2 = document.getElementById('cob_select_aluno2');
        if (!sel1 || !sel2) return;

        let opts = '<option value="">-- Selecione um aluno cadastrado --</option>';
        alunosCadastrados.sort().forEach(nome => {
            opts += `<option value="${esc(nome)}">${esc(nome)}</option>`;
        });
        opts += '<option value="__manual__">➕ Outro (Digitar manualmente)</option>';

        sel1.innerHTML = opts;
        sel2.innerHTML = opts;
    }

    function aoSelecionarAluno(alunoNum, valor) {
        if (valor === '__manual__' || !valor) {
            const inputNome = document.getElementById(alunoNum === 1 ? 'cob_nome1' : 'cob_nome2');
            if (inputNome && valor === '__manual__') {
                inputNome.value = '';
                inputNome.focus();
            }
            if (alunoNum === 1) state.aluno1.nome = inputNome ? inputNome.value : '';
            else state.aluno2.nome = inputNome ? inputNome.value : '';
            recalcularEAtualizarUI();
            return;
        }

        if (alunoNum === 1) {
            state.aluno1.nome = valor;
            const in1 = document.getElementById('cob_nome1');
            if (in1) in1.value = valor;
        } else {
            state.aluno2.nome = valor;
            const in2 = document.getElementById('cob_nome2');
            if (in2) in2.value = valor;
        }

        recalcularEAtualizarUI();
    }

    function setModalidade(mod) {
        state.modalidade = mod === '2' ? '2' : '1';

        const btn1 = document.getElementById('cob-btn-pessoa-1');
        const btn2 = document.getElementById('cob-btn-pessoa-2');
        const bannerDuo = document.getElementById('cob-duo-alert');
        const aluno2Wrap = document.getElementById('cob-aluno2-wrapper');
        const badge = document.getElementById('cob-badge-modalidade');

        if (state.modalidade === '2') {
            if (btn1) btn1.classList.remove('active');
            if (btn2) btn2.classList.add('active');
            if (bannerDuo) bannerDuo.classList.remove('hidden');
            if (aluno2Wrap) aluno2Wrap.classList.remove('hidden');
            if (badge) {
                badge.innerText = 'Dupla (2 Alunos)';
                badge.style.background = '#8b5cf6';
                badge.style.color = '#fff';
            }
        } else {
            if (btn1) btn1.classList.add('active');
            if (btn2) btn2.classList.remove('active');
            if (bannerDuo) bannerDuo.classList.add('hidden');
            if (aluno2Wrap) aluno2Wrap.classList.add('hidden');
            if (badge) {
                badge.innerText = 'Individual (1 Aluno)';
                badge.style.background = '';
                badge.style.color = '';
            }
        }

        recalcularEAtualizarUI();
    }

    function aoMudarServico(servicoId) {
        state.servicoId = servicoId;
        const boxCustom = document.getElementById('cob-servico-custom-box');
        if (boxCustom) {
            if (servicoId === 'personalizado') boxCustom.classList.remove('hidden');
            else boxCustom.classList.add('hidden');
        }

        if (PRECOS_SERVICOS[servicoId] !== undefined) {
            state.valorBaseUnitario = PRECOS_SERVICOS[servicoId];
            const inValor = document.getElementById('cob_valor_base');
            if (inValor) inValor.value = state.valorBaseUnitario.toFixed(2);
        }

        recalcularEAtualizarUI();
    }

    function ajustarValorBase(delta) {
        const inValor = document.getElementById('cob_valor_base');
        let atual = parseFloat(inValor ? inValor.value : state.valorBaseUnitario) || 0;
        atual = Math.max(0, atual + delta);
        state.valorBaseUnitario = atual;
        if (inValor) inValor.value = atual.toFixed(2);
        recalcularEAtualizarUI();
    }

    function setTipoDesconto(tipo) {
        state.tipoDesconto = tipo === 'valor' ? 'valor' : 'porcentagem';

        const btnPct = document.getElementById('cob-btn-desc-pct');
        const btnVal = document.getElementById('cob-btn-desc-val');
        const lblInput = document.getElementById('cob-label-desconto-input');

        if (state.tipoDesconto === 'valor') {
            if (btnPct) btnPct.classList.remove('active');
            if (btnVal) btnVal.classList.add('active');
            if (lblInput) lblInput.innerText = 'Desconto Fixo (R$)';
        } else {
            if (btnPct) btnPct.classList.add('active');
            if (btnVal) btnVal.classList.remove('active');
            if (lblInput) lblInput.innerText = 'Desconto (%)';
        }

        recalcularEAtualizarUI();
    }

    function aplicarChipDesconto(valor, tipo, motivo) {
        setTipoDesconto(tipo);
        state.descontoInput = valor;
        state.motivoDesconto = motivo || '';

        const inDesc = document.getElementById('cob_desconto_input');
        if (inDesc) inDesc.value = valor;

        const inMotivo = document.getElementById('cob_desconto_motivo');
        if (inMotivo) inMotivo.value = state.motivoDesconto;

        document.querySelectorAll('.cob-chip').forEach(c => c.classList.remove('active'));
        if (valor === 0 && tipo === 'porcentagem') {
            const c0 = document.getElementById('cob-chip-0');
            if (c0) c0.classList.add('active');
        } else if (valor === 10 && tipo === 'porcentagem') {
            const c10 = document.getElementById('cob-chip-10');
            if (c10) c10.classList.add('active');
        } else if (valor === 15 && tipo === 'porcentagem') {
            const c15 = document.getElementById('cob-chip-15');
            if (c15) c15.classList.add('active');
        } else if (valor === 20 && tipo === 'porcentagem') {
            const c20 = document.getElementById('cob-chip-20');
            if (c20) c20.classList.add('active');
        } else if (valor === 25 && tipo === 'porcentagem') {
            const c25 = document.getElementById('cob-chip-25');
            if (c25) c25.classList.add('active');
        } else if (valor === 30 && tipo === 'valor') {
            const cfid = document.getElementById('cob-chip-fidelidade');
            if (cfid) cfid.classList.add('active');
        } else if (valor === 100 && tipo === 'porcentagem') {
            const c100 = document.getElementById('cob-chip-100');
            if (c100) c100.classList.add('active');
        }

        recalcularEAtualizarUI();
    }

    function aplicarDescontoDuplaPadrao() {
        aplicarChipDesconto(15, 'porcentagem', 'Combo Especial Dupla (15% OFF)');
    }

    function setStatusPagamento(status) {
        state.statusPagamento = status === 'pendente' ? 'pendente' : 'pago';
        const btnPago = document.getElementById('cob-hero-status-pago');
        const btnPendente = document.getElementById('cob-hero-status-pendente');

        if (state.statusPagamento === 'pago') {
            if (btnPago) btnPago.classList.add('active');
            if (btnPendente) btnPendente.classList.remove('active');
        } else {
            if (btnPago) btnPago.classList.remove('active');
            if (btnPendente) btnPendente.classList.add('active');
        }
    }

    function setFormaPagamento(forma) {
        state.formaPagamento = ['pix', 'credito', 'debito', 'dinheiro'].includes(forma) ? forma : 'pix';

        ['pix', 'credito', 'debito', 'dinheiro'].forEach(f => {
            const btn = document.getElementById(`cob-pay-btn-${f}`);
            if (btn) {
                if (f === state.formaPagamento) btn.classList.add('active');
                else btn.classList.remove('active');
            }
        });

        const detailCredito = document.getElementById('cob-pay-detail-credito');
        const detailDinheiro = document.getElementById('cob-pay-detail-dinheiro');

        if (detailCredito) {
            if (state.formaPagamento === 'credito') detailCredito.classList.remove('hidden');
            else detailCredito.classList.add('hidden');
        }

        if (detailDinheiro) {
            if (state.formaPagamento === 'dinheiro') detailDinheiro.classList.remove('hidden');
            else detailDinheiro.classList.add('hidden');
        }

        atualizarResumoParcelasETroco();
    }

    function aoMudarParcelas(num) {
        state.parcelasCartao = Math.max(1, parseInt(num) || 1);
        atualizarResumoParcelasETroco();
    }

    function calcularTroco() {
        const inTroco = document.getElementById('cob_dinheiro_recebido');
        const entregue = parseFloat(inTroco ? inTroco.value : 0) || 0;
        state.valorDinheiroEntregue = entregue;

        const vals = calcularValores();
        const displayTroco = document.getElementById('cob-troco-display');
        if (displayTroco) {
            if (entregue > 0) {
                const troco = Math.max(0, entregue - vals.totalFinal);
                if (entregue < vals.totalFinal) {
                    displayTroco.innerText = `Faltam: ${formatarMoeda(vals.totalFinal - entregue)}`;
                    displayTroco.style.color = '#ef4444';
                } else {
                    displayTroco.innerText = `Troco: ${formatarMoeda(troco)}`;
                    displayTroco.style.color = '#4ade80';
                }
            } else {
                displayTroco.innerText = 'Troco: R$ 0,00';
                displayTroco.style.color = '#4ade80';
            }
        }
    }

    function atualizarResumoParcelasETroco() {
        const vals = calcularValores();
        const resParcela = document.getElementById('cob-parcela-resumo');
        if (resParcela) {
            const p = state.parcelasCartao || 1;
            const valorParcela = vals.totalFinal > 0 ? (vals.totalFinal / p) : 0;
            resParcela.innerText = `${p}x de ${formatarMoeda(valorParcela)}${p === 1 ? ' (à vista)' : ''}`;
        }
        calcularTroco();
    }


    function calcularValores() {
        const qPessoas = state.modalidade === '2' ? 2 : 1;
        const subtotal = Math.round(state.valorBaseUnitario * qPessoas * 100) / 100;
        
        let valorDesconto = 0;
        if (state.tipoDesconto === 'porcentagem') {
            const pct = Math.min(100, Math.max(0, state.descontoInput));
            valorDesconto = Math.round((subtotal * (pct / 100)) * 100) / 100;
        } else {
            valorDesconto = Math.min(subtotal, Math.max(0, state.descontoInput));
            valorDesconto = Math.round(valorDesconto * 100) / 100;
        }

        const totalFinal = Math.max(0, Math.round((subtotal - valorDesconto) * 100) / 100);
        const valorPorPessoa = qPessoas === 2 ? Math.round((totalFinal / 2) * 100) / 100 : totalFinal;

        return {
            qPessoas,
            subtotal,
            valorDesconto,
            descontoPct: subtotal > 0 ? (valorDesconto / subtotal) * 100 : 0,
            totalFinal,
            valorPorPessoa
        };
    }

    function recalcularEAtualizarUI() {
        const in1 = document.getElementById('cob_nome1');
        if (in1) state.aluno1.nome = in1.value;

        const in2 = document.getElementById('cob_nome2');
        if (in2) state.aluno2.nome = in2.value;

        const inCustom = document.getElementById('cob_servico_nome_custom');
        if (inCustom) state.servicoNomePersonalizado = inCustom.value;

        const inBase = document.getElementById('cob_valor_base');
        if (inBase) state.valorBaseUnitario = Math.max(0, parseFloat(inBase.value) || 0);

        const inData = document.getElementById('cob_data');
        if (inData) state.data = inData.value || new Date().toISOString().split('T')[0];

        const inDesc = document.getElementById('cob_desconto_input');
        if (inDesc) state.descontoInput = Math.max(0, parseFloat(inDesc.value) || 0);

        const inMotivo = document.getElementById('cob_desconto_motivo');
        if (inMotivo) state.motivoDesconto = inMotivo.value;

        const vals = calcularValores();

        // Atualizar Hero Card
        const heroSubtotal = document.getElementById('cob-hero-subtotal');
        if (heroSubtotal) heroSubtotal.innerText = formatarMoeda(vals.subtotal);

        const heroQtd = document.getElementById('cob-hero-qtd-lbl');
        if (heroQtd) heroQtd.innerText = vals.qPessoas === 2 ? '2 pessoas' : '1 pessoa';

        const heroDesconto = document.getElementById('cob-hero-desconto');
        if (heroDesconto) {
            heroDesconto.innerText = vals.valorDesconto > 0 
                ? `- ${formatarMoeda(vals.valorDesconto)} (${vals.descontoPct.toFixed(1)}%)`
                : '- R$ 0,00';
        }

        const heroTotal = document.getElementById('cob-hero-total');
        if (heroTotal) heroTotal.innerText = formatarMoeda(vals.totalFinal);

        // VALOR POR ALUNO
        const heroPerPerson = document.getElementById('cob-hero-per-person');
        if (heroPerPerson) heroPerPerson.innerText = formatarMoeda(vals.valorPorPessoa);

        const heroPerStudentDesc = document.getElementById('cob-hero-per-student-desc');
        if (heroPerStudentDesc) {
            heroPerStudentDesc.innerText = vals.qPessoas === 2 
                ? 'Rateio igualitário (50% para cada aluno)' 
                : 'Atendimento individual (1 aluno)';
        }

        // Badge desconto
        const badgeDesc = document.getElementById('cob-badge-desconto-aplicado');
        if (badgeDesc) {
            if (vals.valorDesconto > 0) {
                badgeDesc.innerText = `${vals.descontoPct.toFixed(0)}% OFF`;
                badgeDesc.style.background = '#ef4444';
                badgeDesc.style.color = '#fff';
            } else {
                badgeDesc.innerText = '0% off';
                badgeDesc.style.background = '';
                badgeDesc.style.color = '';
            }
        }

        atualizarResumoParcelasETroco();
    }

    async function salvarCobrancaNoHistorico() {
        await loadBilling();
        recalcularEAtualizarUI();

        const nome1 = state.aluno1.nome.trim();
        if (!nome1) {
            notificar('Por favor, informe o nome do aluno principal para registrar a cobrança.', 'warning');
            const in1 = document.getElementById('cob_nome1');
            if (in1) in1.focus();
            return;
        }

        let nome2 = '';
        if (state.modalidade === '2') {
            nome2 = state.aluno2.nome.trim();
            if (!nome2) {
                notificar('Por favor, informe o nome do 2º aluno na modalidade em dupla.', 'warning');
                const in2 = document.getElementById('cob_nome2');
                if (in2) in2.focus();
                return;
            }
        }

        const vals = calcularValores();
        const nova = {
            id: gerarIdCobranca(),
            data: state.data || new Date().toISOString().split('T')[0],
            modalidade: state.modalidade, // '1' ou '2'
            qPessoas: vals.qPessoas,
            aluno1: { nome: nome1 },
            aluno2: state.modalidade === '2' ? { nome: nome2 } : null,
            servicoId: state.servicoId,
            servicoNome: obterNomeServico(),
            valorBaseUnitario: state.valorBaseUnitario,
            subtotal: vals.subtotal,
            tipoDesconto: state.tipoDesconto,
            descontoInput: state.descontoInput,
            valorDesconto: vals.valorDesconto,
            motivoDesconto: state.motivoDesconto,
            valorTotal: vals.totalFinal,
            valorPorAluno: vals.valorPorPessoa,
            formaPagamento: state.formaPagamento || 'pix',
            parcelasCartao: state.formaPagamento === 'credito' ? (state.parcelasCartao || 1) : 1,
            status: state.statusPagamento, // 'pago' ou 'pendente'
            createdAt: new Date().toISOString()
        };

        const lista = carregarCobrancas();
        lista.unshift(nova);
        if (!await salvarCobrancasDb(lista)) return;

        renderizarHistoricoCompleto();

        if (typeof window.efToast === 'function') {
            window.efToast(`✅ Cobrança de ${formatarMoeda(nova.valorTotal)} registrada com sucesso!`, 'success');
        } else {
            notificar(`✅ Cobrança de ${formatarMoeda(nova.valorTotal)} (${formatarMoeda(nova.valorPorAluno)} por aluno) registrada no histórico!`);
        }
    }

    async function alternarStatusNoHistorico(id) {
        await loadBilling();
        const alvo = String(id);
        const lista = carregarCobrancas();
        const item = lista.find(c => String(c.id) === alvo);
        if (!item) return;

        item.status = item.status === 'pago' ? 'pendente' : 'pago';
        if (!await salvarCobrancasDb(lista)) return;
        renderizarHistoricoCompleto();
    }

    function excluirCobrancaDoHistorico(id) {
        const alvo = String(id);
        confirmar('Deseja realmente excluir este registro de cobrança do histórico?', async function() {
            await loadBilling();
            const lista = carregarCobrancas();
            const nova = lista.filter(c => String(c.id) !== alvo);
            if (nova.length === lista.length) {
                notificar('Registro não encontrado (já foi excluído?).', 'warning');
                renderizarHistoricoCompleto();
                return;
            }
            if (!await salvarCobrancasDb(nova)) return;
            renderizarHistoricoCompleto();
            notificar('🗑️ Cobrança excluída com sucesso!', 'info');
        });
    }

    async function limparTodoHistorico() {
        await loadBilling();
        const lista = carregarCobrancas();
        if (lista.length === 0) {
            notificar('O histórico já está vazio.', 'info');
            return;
        }
        confirmar(`Tem certeza que deseja apagar todos os ${lista.length} registros de cobrança? Esta ação não pode ser desfeita.`, async function() {
            await loadBilling();
            if (!await salvarCobrancasDb([])) return;
            renderizarHistoricoCompleto();
            notificar('🗑️ Histórico de cobranças limpo.', 'info');
        }, '🗑️ Apagar tudo');
    }

    function setFiltroStatus(status) {
        state.filtroStatus = status;
        ['todos', 'pago', 'pendente', 'pix', 'cartao', 'dinheiro', 'dupla', 'individual'].forEach(s => {
            const b = document.getElementById(`cob-filter-btn-${s}`);
            if (b) {
                if (s === status) b.classList.add('active');
                else b.classList.remove('active');
            }
        });
        renderizarHistoricoCompleto();
    }

    function setVisaoHistorico(visao) {
        state.visaoHistorico = visao;
        const bExtrato = document.getElementById('cob-view-btn-extrato');
        const bAlunos = document.getElementById('cob-view-btn-alunos');
        const wrapExtrato = document.getElementById('cob-view-extrato-wrapper');
        const wrapAlunos = document.getElementById('cob-view-alunos-wrapper');

        if (visao === 'alunos') {
            if (bExtrato) bExtrato.classList.remove('active');
            if (bAlunos) bAlunos.classList.add('active');
            if (wrapExtrato) wrapExtrato.classList.add('hidden');
            if (wrapAlunos) wrapAlunos.classList.remove('hidden');
        } else {
            if (bExtrato) bExtrato.classList.add('active');
            if (bAlunos) bAlunos.classList.remove('active');
            if (wrapExtrato) wrapExtrato.classList.remove('hidden');
            if (wrapAlunos) wrapAlunos.classList.add('hidden');
        }

        renderizarHistoricoCompleto();
    }

    function filtrarHistorico() {
        const inBusca = document.getElementById('cob-busca-historico');
        if (inBusca) state.filtroTexto = inBusca.value.toLowerCase().trim();
        renderizarHistoricoCompleto();
    }

    function obterRegistrosFiltrados() {
        const lista = carregarCobrancas();
        return lista.filter(c => {
            // Filtro de status / modalidade / forma de pagamento
            if (state.filtroStatus === 'pago' && c.status !== 'pago') return false;
            if (state.filtroStatus === 'pendente' && c.status !== 'pendente') return false;
            if (state.filtroStatus === 'pix' && c.formaPagamento !== 'pix') return false;
            if (state.filtroStatus === 'cartao' && c.formaPagamento !== 'credito' && c.formaPagamento !== 'debito') return false;
            if (state.filtroStatus === 'dinheiro' && c.formaPagamento !== 'dinheiro') return false;
            if (state.filtroStatus === 'dupla' && c.modalidade !== '2') return false;
            if (state.filtroStatus === 'individual' && c.modalidade === '2') return false;

            // Filtro de texto livre
            if (state.filtroTexto) {
                const termo = state.filtroTexto;
                const nome1 = (c.aluno1 && c.aluno1.nome ? c.aluno1.nome : '').toLowerCase();
                const nome2 = (c.aluno2 && c.aluno2.nome ? c.aluno2.nome : '').toLowerCase();
                const serv = (c.servicoNome || '').toLowerCase();
                const dataFormatada = formatarData(c.data).toLowerCase();
                if (!nome1.includes(termo) && !nome2.includes(termo) && !serv.includes(termo) && !dataFormatada.includes(termo)) {
                    return false;
                }
            }
            return true;
        });
    }

    function renderizarHistoricoCompleto() {
        const todas = carregarCobrancas();
        const filtradas = obterRegistrosFiltrados();

        // 1. Atualizar KPIs Gerais com Totais e Por Aluno
        atualizarKpis(todas);

        // Atualizar Badge de Contagem
        const countBadge = document.getElementById('cob-history-total-count');
        if (countBadge) {
            countBadge.innerText = `${filtradas.length} de ${todas.length} registro(s)`;
        }

        const emptyBox = document.getElementById('cob-history-empty');
        const wrapExtrato = document.getElementById('cob-view-extrato-wrapper');
        const wrapAlunos = document.getElementById('cob-view-alunos-wrapper');

        if (todas.length === 0) {
            if (emptyBox) emptyBox.classList.remove('hidden');
            if (wrapExtrato) wrapExtrato.classList.add('hidden');
            if (wrapAlunos) wrapAlunos.classList.add('hidden');
            return;
        }

        if (emptyBox) emptyBox.classList.add('hidden');
        if (state.visaoHistorico === 'alunos') {
            if (wrapExtrato) wrapExtrato.classList.add('hidden');
            if (wrapAlunos) wrapAlunos.classList.remove('hidden');
            renderizarTabelaAlunos(filtradas);
        } else {
            if (wrapExtrato) wrapExtrato.classList.remove('hidden');
            if (wrapAlunos) wrapAlunos.classList.add('hidden');
            renderizarTabelaExtrato(filtradas);
        }
    }

    function atualizarKpis(cobrancas) {
        let totalPago = 0;
        let totalPendente = 0;
        let countPago = 0;
        let countPendente = 0;
        let somaAlunos = 0;
        const setAlunosUnicos = new Set();

        cobrancas.forEach(c => {
            const vTotal = Number(c.valorTotal) || 0;
            const qP = Number(c.qPessoas) || (c.modalidade === '2' ? 2 : 1);
            somaAlunos += qP;

            if (c.aluno1 && c.aluno1.nome) setAlunosUnicos.add(c.aluno1.nome.trim().toLowerCase());
            if (c.aluno2 && c.aluno2.nome) setAlunosUnicos.add(c.aluno2.nome.trim().toLowerCase());

            if (c.status === 'pago') {
                totalPago += vTotal;
                countPago++;
            } else {
                totalPendente += vTotal;
                countPendente++;
            }
        });

        const totalGeral = totalPago + totalPendente;
        const ticketMedio = somaAlunos > 0 ? (totalGeral / somaAlunos) : 0;

        const kpiPago = document.getElementById('cob-kpi-faturado-mes');
        if (kpiPago) kpiPago.innerText = formatarMoeda(totalPago);

        const kpiPagoQtd = document.getElementById('cob-kpi-faturado-qtd');
        if (kpiPagoQtd) kpiPagoQtd.innerText = `${countPago} recebimento(s) pago(s)`;

        const kpiPend = document.getElementById('cob-kpi-pendente-mes');
        if (kpiPend) kpiPend.innerText = formatarMoeda(totalPendente);

        const kpiPendQtd = document.getElementById('cob-kpi-pendente-qtd');
        if (kpiPendQtd) kpiPendQtd.innerText = `${countPendente} cobrança(s) pendente(s)`;

        const kpiGeral = document.getElementById('cob-kpi-total-geral');
        if (kpiGeral) kpiGeral.innerText = formatarMoeda(totalGeral);

        const kpiTicket = document.getElementById('cob-kpi-ticket-medio');
        if (kpiTicket) kpiTicket.innerText = formatarMoeda(ticketMedio);

        const kpiTicketSub = document.getElementById('cob-kpi-ticket-sub');
        if (kpiTicketSub) kpiTicketSub.innerText = `Média por aluno (${somaAlunos} atendimentos)`;

        const kpiAlunos = document.getElementById('cob-kpi-total-alunos');
        if (kpiAlunos) kpiAlunos.innerText = setAlunosUnicos.size;

        const kpiAvalSub = document.getElementById('cob-kpi-total-avaliacoes-sub');
        if (kpiAvalSub) kpiAvalSub.innerText = `${cobrancas.length} cobranças registradas`;
    }

    
    function obterBadgeFormaPagamento(forma, parcelas) {
        if (forma === 'credito') {
            const p = parcelas > 1 ? ` (${parcelas}x)` : '';
            return `<span class="tag" style="background:#f5f3ff; color:#6d28d9; border:1px solid #ddd6fe;">💳 Crédito${p}</span>`;
        }
        if (forma === 'debito') {
            return `<span class="tag" style="background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0;">💳 Débito</span>`;
        }
        if (forma === 'dinheiro') {
            return `<span class="tag" style="background:#fefce8; color:#a16207; border:1px solid #fef08a;">💵 Dinheiro</span>`;
        }
        return `<span class="tag" style="background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe;">📱 Pix</span>`;
    }

    function renderizarTabelaExtrato(cobrancas) {
        const tbody = document.getElementById('cob-history-tbody');
        const tfoot = document.getElementById('cob-history-tfoot');
        if (!tbody) return;

        if (cobrancas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:2rem; color:var(--text-muted);">Nenhum lançamento encontrado com os filtros selecionados.</td></tr>`;
            if (tfoot) tfoot.innerHTML = '';
            return;
        }

        let somaTotalVisivel = 0;
        let somaAlunosVisiveis = 0;
        let html = '';

        cobrancas.forEach(c => {
            const vTotal = Number(c.valorTotal) || 0;
            const vPorAluno = Number(c.valorPorAluno) || (c.qPessoas === 2 ? vTotal / 2 : vTotal);
            somaTotalVisivel += vTotal;
            somaAlunosVisiveis += (c.qPessoas || (c.modalidade === '2' ? 2 : 1));

            const isDupla = c.modalidade === '2';
            const nome1 = c.aluno1 && c.aluno1.nome ? esc(c.aluno1.nome) : '—';
            const nome2 = c.aluno2 && c.aluno2.nome ? esc(c.aluno2.nome) : '';

            let nomesHtml = `<div style="font-weight:700; color:var(--text-main);">👤 ${nome1}</div>`;
            if (isDupla) {
                nomesHtml = `
                    <div style="font-weight:700; color:var(--text-main);">👥 ${nome1}</div>
                    <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">&amp; ${nome2}</div>
                `;
            }

            const statusClass = c.status === 'pago' ? 'pago' : 'pendente';
            const statusLabel = c.status === 'pago' ? '🟢 Pago' : '🟡 Pendente';

            html += `
                <tr>
                    <td style="white-space:nowrap; font-variant-numeric:tabular-nums; color:var(--text-muted);">${formatarData(c.data)}</td>
                    <td>${nomesHtml}</td>
                    <td>
                        <span class="tag" style="${isDupla ? 'background:#8b5cf6; color:#fff;' : ''}">
                            ${isDupla ? '👥 Dupla (2x)' : '👤 Individual'}
                        </span>
                    </td>
                    <td>
                        <div style="font-weight:600;">${esc(c.servicoNome || 'Avaliação')}</div>
                        ${c.motivoDesconto ? `<small style="color:var(--text-muted); font-size:0.72rem;">🏷️ ${esc(c.motivoDesconto)}</small>` : ''}
                    </td>
                    <td>
                        <span class="cob-badge-total">${formatarMoeda(vTotal)}</span>
                    </td>
                    <td>
                        <span class="cob-badge-per-aluno">
                            ${formatarMoeda(vPorAluno)} / aluno
                        </span>
                    </td>
                    <td>
                        ${obterBadgeFormaPagamento(c.formaPagamento, c.parcelasCartao)}
                    </td>
                    <td>
                        <button type="button" class="cob-status-pill ${statusClass}" data-cob-action="toggle" data-cob-id="${esc(c.id)}" title="Clique para alternar entre Pago e Pendente">
                            ${statusLabel}
                        </button>
                    </td>
                    <td style="text-align:right; white-space:nowrap;">
                        <button type="button" class="btn btn-danger btn-sm cob-btn-excluir" data-cob-action="delete" data-cob-id="${esc(c.id)}" title="Excluir esta cobrança" aria-label="Excluir esta cobrança">
                            🗑️ Excluir
                        </button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;

        // Rodapé com Totais da Visualização
        if (tfoot) {
            const mediaPorAlunoVisivel = somaAlunosVisiveis > 0 ? (somaTotalVisivel / somaAlunosVisiveis) : 0;
            tfoot.innerHTML = `
                <tr>
                    <td colspan="2" style="font-size:0.84rem; text-transform:uppercase; letter-spacing:0.04em;">
                        📊 Totais da Visualização:
                    </td>
                    <td colspan="2" style="font-size:0.84rem; color:var(--text-muted);">
                        ${cobrancas.length} cobrança(s) &bull; ${somaAlunosVisiveis} aluno(s)
                    </td>
                    <td style="color:#007aff; font-size:1.05rem;">
                        ${formatarMoeda(somaTotalVisivel)}
                    </td>
                    <td style="color:#047857; font-size:0.92rem;">
                        ${formatarMoeda(mediaPorAlunoVisivel)} / aluno
                    </td>
                    <td style="font-size:0.75rem; color:var(--text-muted);">
                        —
                    </td>
                    <td colspan="2" style="text-align:right; font-size:0.75rem; color:var(--text-muted);">
                        Clique no status para alterar
                    </td>
                </tr>
            `;
        }
    }

    function renderizarTabelaAlunos(cobrancas) {
        const tbody = document.getElementById('cob-alunos-tbody');
        const tfoot = document.getElementById('cob-alunos-tfoot');
        if (!tbody) return;

        const mapaAlunos = {};

        cobrancas.forEach(c => {
            const vPorAluno = Number(c.valorPorAluno) || (Number(c.valorTotal) / (c.qPessoas || 1));

            // Aluno 1
            if (c.aluno1 && c.aluno1.nome) {
                const n1 = c.aluno1.nome.trim();
                if (!mapaAlunos[n1]) {
                    mapaAlunos[n1] = { nome: n1, avaliacoes: 0, pago: 0, pendente: 0, total: 0 };
                }
                mapaAlunos[n1].avaliacoes++;
                if (c.status === 'pago') mapaAlunos[n1].pago += vPorAluno;
                else mapaAlunos[n1].pendente += vPorAluno;
                mapaAlunos[n1].total += vPorAluno;
            }

            // Aluno 2 (se dupla)
            if (c.modalidade === '2' && c.aluno2 && c.aluno2.nome) {
                const n2 = c.aluno2.nome.trim();
                if (!mapaAlunos[n2]) {
                    mapaAlunos[n2] = { nome: n2, avaliacoes: 0, pago: 0, pendente: 0, total: 0 };
                }
                mapaAlunos[n2].avaliacoes++;
                if (c.status === 'pago') mapaAlunos[n2].pago += vPorAluno;
                else mapaAlunos[n2].pendente += vPorAluno;
                mapaAlunos[n2].total += vPorAluno;
            }
        });

        const listaAlunos = Object.values(mapaAlunos);
        if (listaAlunos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">Nenhum aluno encontrado para consolidar.</td></tr>`;
            if (tfoot) tfoot.innerHTML = '';
            return;
        }

        listaAlunos.sort((a, b) => b.total - a.total);

        let somaPago = 0;
        let somaPend = 0;
        let somaGeral = 0;
        let somaAval = 0;
        let html = '';

        listaAlunos.forEach(item => {
            somaPago += item.pago;
            somaPend += item.pendente;
            somaGeral += item.total;
            somaAval += item.avaliacoes;

            const mediaAval = item.avaliacoes > 0 ? (item.total / item.avaliacoes) : 0;
            const emDia = item.pendente <= 0.001;

            html += `
                <tr>
                    <td style="font-weight:700; color:var(--text-main);">
                        👤 ${esc(item.nome)}
                    </td>
                    <td style="text-align:center; font-variant-numeric:tabular-nums; font-weight:600;">
                        ${item.avaliacoes}
                    </td>
                    <td style="color:#059669; font-weight:700; font-variant-numeric:tabular-nums;">
                        ${formatarMoeda(item.pago)}
                    </td>
                    <td style="color:#d97706; font-weight:700; font-variant-numeric:tabular-nums;">
                        ${item.pendente > 0 ? formatarMoeda(item.pendente) : '—'}
                    </td>
                    <td style="color:#007aff; font-weight:800; font-size:0.95rem; font-variant-numeric:tabular-nums;">
                        ${formatarMoeda(item.total)}
                    </td>
                    <td style="color:var(--text-muted); font-variant-numeric:tabular-nums;">
                        ${formatarMoeda(mediaAval)}
                    </td>
                    <td>
                        <span class="tag" style="${emDia ? 'background:#ecfdf5; color:#047857; border:1px solid #a7f3d0;' : 'background:#fffbeb; color:#b45309; border:1px solid #fde68a;'}">
                            ${emDia ? '🟢 Em Dia' : '🟡 Com Pendência'}
                        </span>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;

        if (tfoot) {
            const mediaGeralAluno = listaAlunos.length > 0 ? (somaGeral / listaAlunos.length) : 0;
            tfoot.innerHTML = `
                <tr>
                    <td>📊 TOTAL (${listaAlunos.length} alunos)</td>
                    <td style="text-align:center;">${somaAval} aval.</td>
                    <td style="color:#059669;">${formatarMoeda(somaPago)}</td>
                    <td style="color:#d97706;">${formatarMoeda(somaPend)}</td>
                    <td style="color:#007aff; font-size:1.05rem;">${formatarMoeda(somaGeral)}</td>
                    <td colspan="2" style="color:var(--text-muted); font-size:0.8rem;">
                        Média Acumulada / Aluno: <b>${formatarMoeda(mediaGeralAluno)}</b>
                    </td>
                </tr>
            `;
        }
    }

    function exportarCsvHistorico() {
        const lista = carregarCobrancas();
        if (lista.length === 0) {
            notificar('Não há dados no histórico para exportar.', 'info');
            return;
        }

        let csv = 'Data;Aluno 1;Aluno 2;Modalidade;Qtd Alunos;Servico;Valor Total (R$);Valor Por Aluno (R$);Forma Pagamento;Status;Desconto Aplicado (R$);Motivo Desconto\n';

        lista.forEach(c => {
            const d = formatarData(c.data);
            const a1 = sanitizeCsv(c.aluno1 && c.aluno1.nome ? c.aluno1.nome : '');
            const a2 = sanitizeCsv(c.aluno2 && c.aluno2.nome ? c.aluno2.nome : '');
            const mod = c.modalidade === '2' ? 'Dupla' : 'Individual';
            const qP = c.qPessoas || (c.modalidade === '2' ? 2 : 1);
            const serv = sanitizeCsv(c.servicoNome || '');
            const total = (Number(c.valorTotal) || 0).toFixed(2).replace('.', ',');
            const porAluno = (Number(c.valorPorAluno) || 0).toFixed(2).replace('.', ',');
            const st = c.status === 'pago' ? 'Pago' : 'Pendente';
            const desc = (Number(c.valorDesconto) || 0).toFixed(2).replace('.', ',');
            const motivo = sanitizeCsv(c.motivoDesconto || '');

                        const formaStr = c.formaPagamento === 'credito' ? `Crédito (${c.parcelasCartao || 1}x)` : (c.formaPagamento === 'debito' ? 'Débito' : (c.formaPagamento === 'dinheiro' ? 'Dinheiro' : 'Pix'));
            csv += `${d};${a1};${a2};${mod};${qP};${serv};${total};${porAluno};${formaStr};${st};${desc};${motivo}\n`;
        });

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `EvoluFisico_Cobrancas_Estavel_v8.9_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function resetarFormulario() {
        state.modalidade = '1';
        state.aluno1.nome = '';
        state.aluno2.nome = '';
        state.servicoId = 'completa';
        state.servicoNomePersonalizado = '';
        state.valorBaseUnitario = PRECOS_SERVICOS.completa;
        state.data = new Date().toISOString().split('T')[0];
        state.tipoDesconto = 'porcentagem';
        state.descontoInput = 0;
        state.motivoDesconto = '';
        state.statusPagamento = 'pago';

        const sel1 = document.getElementById('cob_select_aluno1');
        if (sel1) sel1.value = '';
        const in1 = document.getElementById('cob_nome1');
        if (in1) in1.value = '';

        const sel2 = document.getElementById('cob_select_aluno2');
        if (sel2) sel2.value = '';
        const in2 = document.getElementById('cob_nome2');
        if (in2) in2.value = '';

        const selServ = document.getElementById('cob_servico_select');
        if (selServ) selServ.value = 'completa';

        const inCustom = document.getElementById('cob_servico_nome_custom');
        if (inCustom) inCustom.value = '';

        const inBase = document.getElementById('cob_valor_base');
        if (inBase) inBase.value = state.valorBaseUnitario.toFixed(2);

        const inData = document.getElementById('cob_data');
        if (inData) inData.value = state.data;

        const inDesc = document.getElementById('cob_desconto_input');
        if (inDesc) inDesc.value = '0';

        const inMotivo = document.getElementById('cob_desconto_motivo');
        if (inMotivo) inMotivo.value = '';

        setModalidade('1');
        setTipoDesconto('porcentagem');
        setStatusPagamento('pago');
        setFormaPagamento('pix');
        const selP = document.getElementById('cob_select_parcelas');
        if (selP) selP.value = '1';
        const inD = document.getElementById('cob_dinheiro_recebido');
        if (inD) inD.value = '';
        aplicarChipDesconto(0, 'porcentagem', 'Sem desconto');

        recalcularEAtualizarUI();
    }

    function mount() {
        loadBilling().then(renderizarHistoricoCompleto).catch(e=>console.warn("Cobranças indisponíveis: "+e.message));
        const nav = document.querySelector('.nav-tabs');
        const diagBtn = document.getElementById('tab-btn-diagnostics');
        let cobBtn = document.getElementById('tab-btn-cobranca');
        
        // 1. Botão da aba estritamente após tab-btn-diagnostics
        if (!cobBtn) {
            cobBtn = document.createElement('button');
            cobBtn.className = 'nav-tab-btn';
            cobBtn.id = 'tab-btn-cobranca';
            cobBtn.type = 'button';
            cobBtn.onclick = function() { switchTab('tab-cobranca'); };
            cobBtn.innerHTML = '<span>💳</span> <span>Cobrança</span>';

            if (diagBtn && diagBtn.parentNode) {
                diagBtn.parentNode.insertBefore(cobBtn, diagBtn.nextSibling);
            } else if (nav) {
                nav.appendChild(cobBtn);
            }
        } else if (diagBtn && cobBtn.previousElementSibling !== diagBtn && diagBtn.parentNode) {
            diagBtn.parentNode.insertBefore(cobBtn, diagBtn.nextSibling);
        }

        // 2. Seção #tab-cobranca estritamente após #tab-diagnostics
        const diagPanel = document.getElementById('tab-diagnostics');
        const cobPanel = document.getElementById('tab-cobranca');
        if (diagPanel && cobPanel && cobPanel.previousElementSibling !== diagPanel && diagPanel.parentNode) {
            diagPanel.parentNode.insertBefore(cobPanel, diagPanel.nextSibling);
        }

        popularSelectAlunos();
        const inData = document.getElementById('cob_data');
        if (inData && !inData.value) inData.value = state.data;

        const inBase = document.getElementById('cob_valor_base');
        if (inBase && !inBase.value) inBase.value = state.valorBaseUnitario.toFixed(2);

        recalcularEAtualizarUI();
        renderizarHistoricoCompleto();
    }

    // Interceptar switchTab
    const _oldSwitch = window.switchTab;
    if (typeof _oldSwitch === 'function') {
        window.switchTab = function(id) {
            const r = _oldSwitch.apply(this, arguments);
            if (id === 'tab-cobranca') {
                document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
                const btn = document.getElementById('tab-btn-cobranca');
                if (btn) btn.classList.add('active');
                if (window.EFCobranca && window.EFCobranca.atualizarUI) window.EFCobranca.atualizarUI();
            }
            return r;
        };
    }

    // Exportar API Global EFCobranca
    window.EFCobranca = {
        exportData: loadBilling,
        importData: async function(lista, replace=false, skip=false) {
            const existing=replace?[]:await loadBilling();
            const map=new Map(existing.map(x=>[String(x.id),x]));
            for (const item of lista) { const row=structuredClone(item); if(!row.id) row.id=gerarIdCobranca(); if(!skip || !map.has(String(row.id))) map.set(String(row.id),row); }
            await writeBilling([...map.values()]);renderizarHistoricoCompleto();
        },
        protect: async function(key=EF_Security.key) { const list=await loadBilling(); await writeBilling(list,key,true); },
        unprotect: async function() {const list=await loadBilling();await writeBilling(list,null,false);},
        clearMemory: function(){billingCache=null;billingRaw=null;},
        version: '9.0-beta',
        mounted: true,
        state: state,
        mount: mount,
        formatarData: formatarData,
        formatarMoeda: formatarMoeda,
        calcularValores: calcularValores,
        recalcular: recalcularEAtualizarUI,
        ajustarValorBase: ajustarValorBase,
        setModalidade: setModalidade,
        aoMudarServico: aoMudarServico,
        aoSelecionarAluno: aoSelecionarAluno,
        setTipoDesconto: setTipoDesconto,
        aplicarChipDesconto: aplicarChipDesconto,
        aplicarDescontoDuplaPadrao: aplicarDescontoDuplaPadrao,
        setStatusPagamento: setStatusPagamento,
        setFormaPagamento: setFormaPagamento,
        aoMudarParcelas: aoMudarParcelas,
        calcularTroco: calcularTroco,
        salvarCobrancaNoHistorico: salvarCobrancaNoHistorico,
        alternarStatusNoHistorico: alternarStatusNoHistorico,
        excluirCobrancaDoHistorico: excluirCobrancaDoHistorico,
        limparTodoHistorico: limparTodoHistorico,
        setFiltroStatus: setFiltroStatus,
        setVisaoHistorico: setVisaoHistorico,
        filtrarHistorico: filtrarHistorico,
        exportarCsvHistorico: exportarCsvHistorico,
        resetarFormulario: resetarFormulario,
        atualizarUI: function() {
            mount();
            popularSelectAlunos();
            recalcularEAtualizarUI();
            renderizarHistoricoCompleto();
        }
    };

    // Paleta de Comando Ctrl+K
    setTimeout(() => {
        try {
            if (typeof acoes !== 'undefined' && Array.isArray(acoes)) {
                acoes = acoes.filter(a => !(a[0] && a[0].includes('Cobrança')));
                acoes.push(['💳 Cobrança & Precificação', 'Alt+6', function() { switchTab('tab-cobranca'); }]);
            }
        } catch(e) {}
    }, 150);

    // Tecla de atalho Alt+6
    document.addEventListener('keydown', (e) => {
        if (e.altKey && !e.ctrlKey && !e.metaKey && e.key === '6') {
            e.preventDefault();
            switchTab('tab-cobranca');
        }
    });

    // Delegação de eventos: funciona mesmo quando a tabela é re-renderizada.
    document.addEventListener('click', function(e) {
        const btn = e.target && e.target.closest ? e.target.closest('[data-cob-action]') : null;
        if (!btn) return;
        const id = btn.getAttribute('data-cob-id');
        const acao = btn.getAttribute('data-cob-action');
        if (!id) return;
        e.preventDefault();
        if (acao === 'delete') excluirCobrancaDoHistorico(id);
        else if (acao === 'toggle') alternarStatusNoHistorico(id);
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
    setTimeout(mount, 100);
    setTimeout(mount, 500);
})();


/* ==========================================================================
   MOTOR DE AJUDA & DEFINIÇÕES CLÍNICAS (EF_HELP_SYSTEM)
   ========================================================================== */
window.EF_HELP_DEFINICOES = {"nome": {"title": "Nome Completo", "desc": "Nome completo do aluno ou paciente para identificação clínica e geração de relatórios oficiais."}, "email": {"title": "E-mail de Contato", "desc": "Endereço eletrônico utilizado para arquivamento, envio de relatórios e correspondência clínica."}, "whatsapp": {"title": "WhatsApp / Telefone", "desc": "Número com DDD para contato direto, envio de laudos em PDF e acompanhamento da evolução."}, "sexo": {"title": "Sexo Biológico", "desc": "Essencial para a seleção das equações preditivas de densidade corporal (Pollock), fórmulas de TMB e índices de saúde."}, "idade": {"title": "Idade Cronológica", "desc": "Idade em anos completos. Fator determinante no cálculo da densidade corporal (Jackson & Pollock), faixas de normalidade e TMB."}, "altura": {"title": "Estatura / Altura (cm)", "desc": "Medida em centímetros (ex: 175). Utilizada para o cálculo de IMC, Relação Cintura-Estatura (RCE), BRI e estimativa de massa magra."}, "data_avaliacao": {"title": "Data da Avaliação", "desc": "Data em que a coleta dos dados físicos foi realizada. Fundamental para a linha do tempo e cálculo de taxas semanais."}, "data_proxima_avaliacao": {"title": "Próxima Avaliação (Retorno)", "desc": "Data estipulada para a reavaliação física e fechamento do ciclo de treino/periodização (geralmente entre 30 e 60 dias)."}, "checkin_semana": {"title": "Check-in / Período", "desc": "Identificador da semana ou fase do acompanhamento (ex: Inicial / Avaliação 1, Semana 4, etc.)."}, "fase": {"title": "Fase no Programa", "desc": "Objetivo atual do ciclo: Emagrecimento, Hipertrofia, Manutenção, Recomposição Corporal ou Transição."}, "avaliador_clinica": {"title": "Clínica / Consultório", "desc": "Nome do estabelecimento, assessoria ou estúdio que constará no cabeçalho dos laudos em PDF."}, "avaliador_nome": {"title": "Profissional Avaliador", "desc": "Nome do profissional de Educação Física, Nutricionista ou Médico responsável pela coleta e parecer técnico."}, "avaliador_registro": {"title": "Registro Profissional", "desc": "Número de registro no conselho de classe profissional (CREF, CRN ou CRM) para validação legal do laudo emitido."}, "peso": {"title": "Peso Corporal Total (kg)", "desc": "Massa corporal total aferida em balança calibrada, com o indivíduo descalço e com vestimentas leves."}, "peri_pescoco": {"title": "Perímetro do Pescoço (cm)", "desc": "Medido logo abaixo da proeminência laríngea (pomo de Adão), perpendicular ao eixo do pescoço. Padrão da Marinha Americana."}, "peri_ombros": {"title": "Perímetro dos Ombros (cm)", "desc": "Circunferência máxima ao nível dos deltoides, na porção média mais proeminente, com braços relaxados ao lado do corpo."}, "peri_abdomen": {"title": "Perímetro Abdominal (cm)", "desc": "Medido exatamente sobre a cicatriz umbilical (nível do umbigo), em posição ortostática ao final de uma expiração normal."}, "cintura": {"title": "Perímetro da Cintura (cm)", "desc": "Medida na menor curvatura do tronco (entre a última costela e a crista ilíaca), ao final de expiração normal. Utilizada na RCQ e RCE."}, "quadril": {"title": "Perímetro do Quadril (cm)", "desc": "Circunferência no ponto de maior protuberância glútea. Essencial para avaliar distribuição ginoide/androide e o índice RCQ."}, "braco_esq": {"title": "Braço Esquerdo (cm)", "desc": "Perímetro do braço relaxado no ponto médio entre o acrômio da escápula e o olécrano da ulna."}, "braco_dir": {"title": "Braço Direito (cm)", "desc": "Perímetro do braço relaxado no ponto médio entre o acrômio e o olécrano. Útil para verificar simetrias bilaterais."}, "coxa_esq": {"title": "Coxa Esquerda (cm)", "desc": "Medida no ponto médio entre a prega inguinal e a borda superior da patela, com o peso distribuído uniformemente nas duas pernas."}, "coxa_dir": {"title": "Coxa Direita (cm)", "desc": "Medida no ponto médio entre a linha inguinal e o polo superior da patela. Avalia desenvolvimento muscular e assimetrias."}, "panturrilha": {"title": "Panturrilha / Perna (cm)", "desc": "Circunferência máxima da perna no plano horizontal, com o avaliado em pé e peso distribuído. Indicador de massa muscular periférica."}, "dobra_triceps": {"title": "Dobra Cutânea Tricipital (mm)", "desc": "Dobra vertical na face posterior do braço, no ponto médio entre o processo acromial e o olécrano. Braço solto e relaxado."}, "dobra_subescapular": {"title": "Dobra Cutânea Subescapular (mm)", "desc": "Dobra oblíqua a 45 graus, localizada 1 a 2 cm abaixo do ângulo inferior da escápula, acompanhando as linhas naturais de clivagem."}, "dobra_suprailiaca": {"title": "Dobra Cutânea Supra-ilíaca (mm)", "desc": "Dobra diagonal na linha axilar anterior, imediatamente acima da crista ilíaca. Marcador sensível de adiposidade abdominal."}, "dobra_peitoral": {"title": "Dobra Cutânea Peitoral / Torácica (mm)", "desc": "Homens: metade da distância entre a linha axilar anterior e o mamilo (diagonal). Mulheres: 1/3 da distância a partir da axila."}, "dobra_axilar": {"title": "Dobra Cutânea Axilar Média (mm)", "desc": "Dobra vertical ou ligeiramente oblíqua na linha axilar média, no nível da junção xifosternal do esterno."}, "dobra_abdominal": {"title": "Dobra Cutânea Abdominal (mm)", "desc": "Dobra vertical localizada a cerca de 2 cm à direita da cicatriz umbilical. Avalia o acúmulo de gordura subcutânea no abdômen."}, "dobra_coxa": {"title": "Dobra Cutânea da Coxa (mm)", "desc": "Dobra vertical na face anterior da coxa, no ponto médio entre o ligamento inguinal e a borda superior da patela. Perna sem carga."}, "bia_peso": {"title": "Peso na Balança de BIA (kg)", "desc": "Peso aferido no momento exato do exame de bioimpedância para calibrar a resistência e reatância dos tecidos corporais."}, "bia_pgordura": {"title": "Percentual de Gordura BIA (%)", "desc": "Proporção de gordura em relação ao peso corporal total, estimada pela impedância tecidual e condutividade da água corporal."}, "bia_pmusculo": {"title": "Percentual de Músculo Esquelético (%)", "desc": "Porcentagem de massa muscular ativa voluntária responsável pela força física, postura e taxa de metabolismo em repouso."}, "bia_imc": {"title": "Índice de Massa Corporal (kg/m²)", "desc": "Relação entre o peso e o quadrado da estatura (kg/m²). Classifica estado nutricional conforme parâmetros da OMS."}, "bia_gordura_kg": {"title": "Massa Gorda Absoluta (kg)", "desc": "Quantidade total em quilogramas de tecido adiposo corporal (gordura essencial + gordura de reserva armazenada)."}, "bia_mme": {"title": "Massa Muscular Esquelética (kg)", "desc": "Massa absoluta em kg composta apenas pelos músculos esqueléticos, sendo o principal tecido metabólico treinável."}, "bia_tmb": {"title": "Taxa Metabólica Basal - BIA (kcal)", "desc": "Energia mínima calórica diária necessária para manter as funções vitais em repouso absoluto calculada pelo aparelho."}, "bia_visceral": {"title": "Nível de Gordura Visceral", "desc": "Classificação da gordura profunda que envolve órgãos abdominais. Níveis até 9 = saudável; 10 a 14 = elevado; 15+ = crítico."}, "bia_idade_corporal": {"title": "Idade Biológica / Corporal (anos)", "desc": "Estimativa algorítmica da idade metabólica comparando a composição corporal do avaliado com as médias da população saudável."}, "bia_rcq": {"title": "Relação Cintura / Quadril (RCQ)", "desc": "Razão cintura / quadril calculada pelo equipamento. Importante indicador de risco cardiovascular e padrão de distribuição de gordura."}, "bia_risco": {"title": "Classificação de Risco Cardiovascular", "desc": "Estratificação do risco de desfechos metabólicos adversos baseada nos valores combinados de RCQ, gordura visceral e percentual de gordura."}, "bia_analise_texto": {"title": "Análise Clínica da Bioimpedância", "desc": "Campo livre para observações do avaliador sobre o estado de hidratação, protocolo pré-exame (jejum, cafeína) e interpretação do laudo."}, "foto_frente": {"title": "Foto Anterior (Frente)", "desc": "Registro fotográfico frontal, braços levemente afastados, postura natural e luz uniforme para análise de simetria e definição."}, "foto_perfil_direito": {"title": "Foto em Perfil Direito", "desc": "Registro lateral direito, braços posicionados sem obstruir a linha da cintura e abdômen, avaliando curvaturas posturais e projeção."}, "foto_perfil_esquerdo": {"title": "Foto em Perfil Esquerdo", "desc": "Registro lateral esquerdo para comparação e validação do alinhamento da pelve, coluna e tônus muscular."}, "foto_costas": {"title": "Foto Posterior (Costas)", "desc": "Registro dorsal, demonstrando desenvolvimento de grande dorsal, trapézio, eretores da espinha, glúteos e posterior de coxas."}, "foto_extra": {"title": "Foto Livre / Detalhe / Postural", "desc": "Foto opcional para registrar poses específicas de fisiculturismo, detalhes de desvios posturais ou áreas específicas de evolução."}, "energia": {"title": "Nível de Energia e Disposição (1 a 5)", "desc": "Autoavaliação do nível de vitalidade e disposição física geral para os treinos e rotina diária no último período."}, "aderencia_treino": {"title": "Aderência ao Treino Planejado", "desc": "Grau de cumprimento das sessões de treino prescritas: 100% (todos os treinos), 80-99% (quase todos), 50-79% ou <50%."}, "aderencia_dieta": {"title": "Aderência ao Plano Nutricional", "desc": "Nível de fidelidade à rotina alimentar e hídrica estipulada durante o período de acompanhamento."}, "ef6_sono": {"title": "Qualidade do Sono (1 a 5)", "desc": "Avaliação subjetiva da qualidade do sono, sensação de descanso matinal e recuperação neuromuscular (escala 1 a 5)."}, "ef6_estresse": {"title": "Nível de Estresse (1 a 5)", "desc": "Impacto de fatores psicossociais, ansiedade e sobrecarga de trabalho sobre a recuperação e regulação hormonal (escala 1 a 5)."}, "ef6_dor": {"title": "Dor ou Desconforto Relatado", "desc": "Identificação de queixas articulares ou musculares (ex: joelhos, ombros, lombar) que exijam modulação de volume ou intensidade."}, "ef6_meta_pg": {"title": "Meta Alvo de % de Gordura", "desc": "Percentual de gordura corporal almejado para o próximo ciclo de reavaliação ou fim da temporada."}, "ef6_meta_peso": {"title": "Meta Alvo de Peso (kg)", "desc": "Peso corporal total pretendido pelo aluno/paciente em consenso com o avaliador."}, "ef6_meta_prazo": {"title": "Prazo Estipulado para a Meta", "desc": "Data limite planejada para o alcance dos objetivos estabelecidos de peso e composição corporal."}, "ef6_status": {"title": "Status Geral do Check-in", "desc": "Classificação global do progresso: Excelente evolução, Em evolução satisfatória, Atenção necessária ou Estagnado."}, "ef6_fortes": {"title": "Pontos Fortes da Evolução", "desc": "Destaque das maiores conquistas do aluno no período (ex: ganho de força, consistência nos treinos, redução de circunferência abdominal)."}, "ef6_atencao": {"title": "Pontos de Atenção", "desc": "Fatores de risco ou desvios que demandam intervenção (ex: ingestão de água insuficiente, queixas de fadiga, fins de semana)."}, "ef6_treino": {"title": "Ajustes no Treinamento", "desc": "Modificações necessárias na periodização, como progressão de carga, volume semanal por grupo muscular ou densidade das sessões."}, "ef6_dieta": {"title": "Ajustes na Dieta / Estilo de Vida", "desc": "Orientações comportamentais e de estilo de vida para suporte à recuperação energética e recomposição corporal."}, "ef6_proximos": {"title": "Próximos Passos até a Reavaliação", "desc": "Metas práticas de curto prazo a serem executadas rigorosamente pelo aluno até a próxima data de retorno."}, "observacoes": {"title": "Feedback e Relato do Aluno", "desc": "Comentários pessoais do próprio aluno sobre como se sentiu durante o processo, dificuldades e motivações."}, "parecer_profissional": {"title": "Parecer Técnico do Avaliador", "desc": "Síntese técnica conclusiva emitida pelo profissional responsável. Este texto é impresso em destaque na página principal do relatório em PDF."}, "compare-client-select": {"title": "Filtrar Aluno / Paciente", "desc": "Selecione o aluno cadastrado para visualizar seu histórico completo e comparar duas avaliações distintas lado a lado."}, "compare-baseline-select": {"title": "Avaliação 1 (Base / Anterior)", "desc": "Ponto de partida temporal utilizado como referência inicial para calcular o saldo de recomposição corporal (Prisma 2)."}, "compare-current-select": {"title": "Avaliação 2 (Atual / Recente)", "desc": "Avaliação mais recente a ser confrontada com a avaliação base para medir variações de massa magra, gordura e medidas."}, "cob_select_aluno1": {"title": "Aluno 1 (Titular / Responsável)", "desc": "Vincule o aluno principal do sistema para preenchimento automático de dados e vinculação direta ao histórico financeiro."}, "cob_nome1": {"title": "Nome do Aluno 1", "desc": "Nome do pagador ou primeiro integrante avaliado na sessão."}, "cob_select_aluno2": {"title": "2º Aluno (Parceiro / Dupla)", "desc": "Selecione o segundo aluno caso a cobrança seja para atendimento em casal, amigos ou dupla com valor compartilhado."}, "cob_nome2": {"title": "Nome do 2º Aluno", "desc": "Nome do parceiro ou segundo aluno que participa da modalidade em dupla."}, "cob_servico_select": {"title": "Tipo de Serviço / Pacote", "desc": "Pacote clínico selecionado: Avaliação Física Completa (Dobras + BIA), Consulta Nutricional, Consultoria Esportiva ou Personalizado."}, "cob_servico_nome_custom": {"title": "Descrição do Serviço Personalizado", "desc": "Discriminação detalhada do serviço quando for selecionada a opção 'Outro Serviço / Personalizado'."}, "cob_valor_base": {"title": "Valor Unitário por Pessoa (R$)", "desc": "Preço tabelado por pessoa antes dos descontos. Na modalidade em dupla, o valor base será multiplicado por 2."}, "cob_data": {"title": "Data da Avaliação / Cobrança", "desc": "Data em que o serviço foi prestado ou em que o pagamento foi registrado."}, "cob_desconto_input": {"title": "Percentual de Desconto (%)", "desc": "Desconto comercial aplicado sobre o valor bruto (ex: 5% à vista, 10% estudante, 15% pacote trimestral ou 20% promoção dupla)."}, "cob_desconto_motivo": {"title": "Motivo do Desconto", "desc": "Justificativa comercial do benefício concedido (ex: Pagamento à vista em dinheiro, Parceria com academia, Familiar)."}, "cob_select_parcelas": {"title": "Número de Parcelas (Cartão de Crédito)", "desc": "Quantidade de parcelas no cartão (de 1x à vista até 12x). O sistema calcula o valor de cada parcela automaticamente."}, "cob_dinheiro_recebido": {"title": "Valor em Dinheiro Entregue", "desc": "Montante em notas entregue pelo cliente. O sistema calcula imediatamente o valor exato do troco a ser devolvido."}, "cfg_pro_nome": {"title": "Nome do Profissional Responsável", "desc": "Nome do avaliador que será salvo como padrão nas próximas avaliações e no rodapé/cabeçalho dos documentos."}, "cfg_pro_cref": {"title": "Registro Profissional Padrão", "desc": "Seu número no conselho (CREF, CRN ou CRM) com a sigla do estado (ex: CREF 012345-G/PR)."}, "cfg_pro_clinica": {"title": "Nome do Consultório / Estúdio", "desc": "Nome da marca, academia, clínica ou estúdio de personal que aparecerá impresso nos laudos."}, "ef77-src": {"title": "Fonte dos Dados do Lab", "desc": "Escolha se deseja importar os dados diretamente de uma avaliação do cadastro ou preencher manualmente para simulações."}, "ef77-sexo": {"title": "Sexo Biológico (Fórmulas)", "desc": "Determina as constantes biológicas aplicadas nas equações de TMB (Harris-Benedict, Mifflin) e composição corporal."}, "ef77-idade": {"title": "Idade (Simulação Lab)", "desc": "Idade cronológica em anos para cálculo da Taxa Metabólica Basal e faixas de frequência cardíaca de treino."}, "ef77-altura": {"title": "Altura em Centímetros", "desc": "Estatura utilizada no cálculo de TMB, RCE, BRI (Índice de Redondeza Corporal) e ABSI (Índice de Forma Corporal)."}, "ef77-peso": {"title": "Peso Atual (kg)", "desc": "Peso corporal total utilizado como base para o dispêndio energético e particionamento de tecidos."}, "ef77-pescoco": {"title": "Circunferência do Pescoço (cm)", "desc": "Utilizado na equação da Marinha dos EUA para estimativa complementar de percentual de gordura sem adipômetro."}, "ef77-cintura": {"title": "Circunferência da Cintura (cm)", "desc": "Utilizada nos cálculos de RCE (relação cintura-estatura), RCQ e índice de adiposidade central."}, "ef77-quadril": {"title": "Circunferência do Quadril (cm)", "desc": "Utilizada para determinar a relação cintura-quadril e distribuição de gordura ginoide versus androide."}, "ef77-pollock": {"title": "% Gordura Pollock (7 Dobras)", "desc": "Percentual de gordura subcutânea aferido pelo protocolo de 7 dobras de Jackson & Pollock."}, "ef77-bia": {"title": "% Gordura Bioimpedância", "desc": "Percentual de gordura aferido por bioimpedância elétrica para comparação direta com o método de dobras."}, "ef77-fcrep": {"title": "Frequência Cardíaca de Repouso (bpm)", "desc": "Batimentos por minuto em repouso. Utilizada na fórmula de Karvonen para prescrição de zonas alvo de treinamento aeróbico."}, "ef77-fator": {"title": "Nível de Atividade Física (Fator PAL)", "desc": "Multiplicador do gasto calórico diário: Sedentário (1.2), Leve (1.375), Moderado (1.55), Intenso (1.725) ou Muito Intenso (1.9)."}, "ef77-obj": {"title": "Objetivo Energético", "desc": "Ajuste sobre o gasto calórico total (GET): Manutenção (0%), Déficit Calórico (-20% para emagrecimento) ou Superávit (+10% para hipertrofia)."}, "ef77-formula": {"title": "Equação Preditiva de TMB", "desc": "Selecione a fórmula: Harris-Benedict (1984 atualizada), Mifflin-St Jeor (padrão-ouro em indivíduos eutróficos), Katch-McArdle (baseada em massa magra) ou Harris-Benedict (1919 clássica)."}, "ef77-alvo": {"title": "Meta Alvo de % Gordura", "desc": "Percentual de gordura desejado para calcular a quantidade exata de massa gorda a eliminar mantendo a massa magra preservada."}, "desafio_transformacao": {"title": "Desafio de Transformação", "desc": "Identifica se o aluno está inscrito em desafios sazonais de transformação corporal (ex: 60 ou 90 dias) para relatórios específicos."}, "cob_modalidade": {"title": "Modalidade do Atendimento", "desc": "Selecione se o atendimento é Individual (1 pessoa) ou em Dupla / Casal (2 pessoas com rateio de valor e comprovante conjunto)."}, "cob_desconto_modalidade": {"title": "Modalidade do Desconto", "desc": "Escolha se o desconto concedido será calculado como porcentagem (%) sobre o valor total ou como valor fixo em reais (R$)."}, "cob_forma_pagamento": {"title": "Forma de Pagamento", "desc": "Opções comerciais disponíveis: Pix (com QR Code copia e cola), Cartão de Crédito (com parcelas), Cartão de Débito ou Dinheiro em espécie."}, "cob_status": {"title": "Status do Pagamento", "desc": "Situação financeira do serviço: 'Pago' (liquidado na hora), 'Pendente' (a receber) ou 'Cortesia / Isento'."}, "bkp_tipo": {"title": "Tipo de Backup dos Dados", "desc": "Backup Completo (com todas as fotos e históricos), Backup Leve (somente métricas e textos, <100KB) ou Backup Filtrado por Aluno."}, "bkp_restaurar": {"title": "Método de Restauração", "desc": "Mesclar e Atualizar (adiciona novos e preserva existentes), Apenas Novos (não toca nos atuais) ou Substituição Completa."}};

window.EF_HelpSystem = (function() {
    var popover = null;
    var activeBtn = null;
    var hideTimeout = null;

    function init() {
        createPopoverElement();
        injectButtons();
        setupObserver();
        setupGlobalEvents();
    }

    function createPopoverElement() {
        if (document.getElementById('ef-help-popover')) return;
        popover = document.createElement('div');
        popover.id = 'ef-help-popover';
        popover.innerHTML = '<div class="popover-header"><span class="popover-title">ℹ️ Ajuda</span><button type="button" class="popover-close" aria-label="Fechar">&times;</button></div><div class="popover-body"></div>';
        document.body.appendChild(popover);

        popover.querySelector('.popover-close').addEventListener('click', function(e) {
            e.stopPropagation();
            hide();
        });

        popover.addEventListener('mouseenter', function() {
            if (hideTimeout) clearTimeout(hideTimeout);
        });
        popover.addEventListener('mouseleave', function() {
            hide();
        });
    }

    function getDefinition(key, labelText) {
        if (window.EF_HELP_DEFINICOES[key]) {
            return window.EF_HELP_DEFINICOES[key];
        }
        // Normalização de chaves para buscar equivalência
        var cleanKey = (key || '').toLowerCase().replace(/^(ef77-|cob_|peri_|bia_|ef6_|dobra_)/, '');
        for (var k in window.EF_HELP_DEFINICOES) {
            var cK = k.toLowerCase().replace(/^(ef77-|cob_|peri_|bia_|ef6_|dobra_)/, '');
            if (cK && cK === cleanKey) {
                return window.EF_HELP_DEFINICOES[k];
            }
        }

        // Busca por similaridade no texto do label
        if (labelText) {
            var lt = labelText.toLowerCase();
            if (lt.indexOf('pescoço') >= 0) return window.EF_HELP_DEFINICOES['peri_pescoco'];
            if (lt.indexOf('ombro') >= 0) return window.EF_HELP_DEFINICOES['peri_ombros'];
            if (lt.indexOf('abdômen') >= 0 || lt.indexOf('abdomen') >= 0) return window.EF_HELP_DEFINICOES['peri_abdomen'];
            if (lt.indexOf('cintura') >= 0) return window.EF_HELP_DEFINICOES['cintura'];
            if (lt.indexOf('quadril') >= 0) return window.EF_HELP_DEFINICOES['quadril'];
            if (lt.indexOf('braço') >= 0 || lt.indexOf('braco') >= 0) return window.EF_HELP_DEFINICOES['braco_dir'];
            if (lt.indexOf('coxa') >= 0 && lt.indexOf('dobra') >= 0) return window.EF_HELP_DEFINICOES['dobra_coxa'];
            if (lt.indexOf('coxa') >= 0) return window.EF_HELP_DEFINICOES['coxa_dir'];
            if (lt.indexOf('panturrilha') >= 0) return window.EF_HELP_DEFINICOES['panturrilha'];
            if (lt.indexOf('tríceps') >= 0 || lt.indexOf('tricipital') >= 0) return window.EF_HELP_DEFINICOES['dobra_triceps'];
            if (lt.indexOf('subescapular') >= 0) return window.EF_HELP_DEFINICOES['dobra_subescapular'];
            if (lt.indexOf('supra') >= 0) return window.EF_HELP_DEFINICOES['dobra_suprailiaca'];
            if (lt.indexOf('peitoral') >= 0) return window.EF_HELP_DEFINICOES['dobra_peitoral'];
            if (lt.indexOf('axilar') >= 0) return window.EF_HELP_DEFINICOES['dobra_axilar'];
            if (lt.indexOf('visceral') >= 0) return window.EF_HELP_DEFINICOES['bia_visceral'];
            if (lt.indexOf('metabolismo') >= 0 || lt.indexOf('tmb') >= 0) return window.EF_HELP_DEFINICOES['bia_tmb'];
            if (lt.indexOf('músculo') >= 0 || lt.indexOf('musculo') >= 0 || lt.indexOf('mme') >= 0) return window.EF_HELP_DEFINICOES['bia_mme'];
            if (lt.indexOf('frequência cardíaca') >= 0 || lt.indexOf('fc repouso') >= 0) return window.EF_HELP_DEFINICOES['ef77-fcrep'];
            if (lt.indexOf('atividade') >= 0) return window.EF_HELP_DEFINICOES['ef77-fator'];
            if (lt.indexOf('objetivo') >= 0) return window.EF_HELP_DEFINICOES['ef77-obj'];
            if (lt.indexOf('fórmula') >= 0) return window.EF_HELP_DEFINICOES['ef77-formula'];
            if (lt.indexOf('desafio') >= 0) return window.EF_HELP_DEFINICOES['desafio_transformacao'];
            if (lt.indexOf('serviço') >= 0 || lt.indexOf('servico') >= 0) return window.EF_HELP_DEFINICOES['cob_servico_select'];
            if (lt.indexOf('desconto') >= 0) return window.EF_HELP_DEFINICOES['cob_desconto_input'];
            if (lt.indexOf('pagamento') >= 0) return window.EF_HELP_DEFINICOES['cob_forma_pagamento'];
            if (lt.indexOf('parcela') >= 0) return window.EF_HELP_DEFINICOES['cob_select_parcelas'];
            if (lt.indexOf('backup') >= 0) return window.EF_HELP_DEFINICOES['bkp_tipo'];
            if (lt.indexOf('restaurar') >= 0) return window.EF_HELP_DEFINICOES['bkp_restaurar'];
        }

        return {
            title: labelText ? labelText.replace(/[*:]/g, '').trim() : "Ajuda do Campo",
            desc: "Preencha este campo de acordo com os dados coletados na avaliação ou protocolo clínico."
        };
    }

    function injectButtons() {
        var labels = document.querySelectorAll('label');
        labels.forEach(function(lbl) {
            if (lbl.querySelector('.ef-help-btn')) return;
            var forAttr = lbl.getAttribute('for');
            var rawText = lbl.textContent.replace(/[*:]/g, '').trim();

            // Evitar botões em labels simples de checkbox/radio como "Sim" ou "Não"
            if (rawText === 'Sim' || rawText === 'Não') return;
            if (lbl.closest('.ef-help-btn')) return;

            var key = forAttr || '';
            // Se forAttr não existe, tentar encontrar input interno
            if (!key) {
                var inp = lbl.querySelector('input, select, textarea');
                if (inp && inp.id) key = inp.id;
            }

            var info = getDefinition(key, rawText);
            if (!info) return;

            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ef-help-btn';
            btn.setAttribute('aria-label', 'Ajuda sobre ' + info.title);
            btn.title = info.title + ': ' + info.desc;
            btn.textContent = '?';
            btn.dataset.helpTitle = info.title;
            btn.dataset.helpDesc = info.desc;

            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggle(btn, info);
            });

            btn.addEventListener('mouseenter', function() {
                if (window.innerWidth > 600) {
                    show(btn, info);
                }
            });

            btn.addEventListener('mouseleave', function() {
                if (window.innerWidth > 600) {
                    hideTimeout = setTimeout(hide, 250);
                }
            });

            lbl.appendChild(btn);
        });
    }

    function show(btn, info) {
        if (!popover) createPopoverElement();
        if (hideTimeout) clearTimeout(hideTimeout);
        activeBtn = btn;

        popover.querySelector('.popover-title').innerHTML = 'ℹ️ ' + (info.title || btn.dataset.helpTitle || 'Ajuda');
        popover.querySelector('.popover-body').textContent = info.desc || btn.dataset.helpDesc || '';

        popover.classList.add('active');

        if (window.innerWidth > 600) {
            var rect = btn.getBoundingClientRect();
            var popRect = popover.getBoundingClientRect();
            var top = rect.bottom + window.scrollY + 6;
            var left = rect.left + window.scrollX - 20;

            // Previne overflow à direita
            if (left + 330 > window.innerWidth) {
                left = window.innerWidth - 340;
            }
            if (left < 10) left = 10;

            // Se estourar a parte inferior da janela, abre para cima
            if (rect.bottom + popRect.height + 20 > window.innerHeight) {
                top = rect.top + window.scrollY - popRect.height - 6;
            }

            popover.style.top = top + 'px';
            popover.style.left = left + 'px';
        }
    }

    function hide() {
        if (popover) {
            popover.classList.remove('active');
        }
        activeBtn = null;
    }

    function toggle(btn, info) {
        if (activeBtn === btn && popover && popover.classList.contains('active')) {
            hide();
        } else {
            show(btn, info);
        }
    }

    function setupObserver() {
        // Observa mutações para injetar em novos elementos inseridos dinamicamente (como na aba Lab ou novos modais)
        var observer = new MutationObserver(function(mutations) {
            var shouldReinject = false;
            mutations.forEach(function(m) {
                if (m.addedNodes.length > 0) shouldReinject = true;
            });
            if (shouldReinject) {
                injectButtons();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function setupGlobalEvents() {
        document.addEventListener('click', function(e) {
            if (popover && popover.classList.contains('active')) {
                if (!popover.contains(e.target) && !e.target.classList.contains('ef-help-btn')) {
                    hide();
                }
            }
        });

        window.addEventListener('resize', function() {
            if (popover && popover.classList.contains('active')) hide();
        });
        window.addEventListener('scroll', function() {
            if (window.innerWidth > 600 && popover && popover.classList.contains('active')) hide();
        }, { passive: true });
    }

    return {
        init: init,
        reinject: injectButtons,
        show: show,
        hide: hide
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    window.EF_HelpSystem.init();
});
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.EF_HelpSystem.init();
}
