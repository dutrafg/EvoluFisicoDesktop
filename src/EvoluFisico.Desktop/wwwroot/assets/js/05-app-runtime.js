/* 03-runtime.js */
// =========================================================================
        // MÓDULO CIENTÍFICO: SOMATOTIPO HEATH-CARTER & SOMATOCARTA SVG (V4.6)
        // =========================================================================
        const CalculadoraSomatotipo = {
            calcular: function(alturaCm, pesoKg, triceps, subescapular, suprailiaca, panturrilhaDobra, bracoContr, panturrilhaPerim) {
                const alt = parseFloat(alturaCm);
                const peso = parseFloat(pesoKg);
                const tri = parseFloat(triceps);
                const sub = parseFloat(subescapular);
                const sup = parseFloat(suprailiaca);
                const ptDobra = parseFloat(panturrilhaDobra) || 12.0;
                const braco = parseFloat(bracoContr);
                const pant = parseFloat(panturrilhaPerim);

                if (![alt, peso, tri, sub, sup, braco, pant].every(v => Number.isFinite(v) && v > 0)) {
                    return {
                        endomorfia: '--',
                        mesomorfia: '--',
                        ectomorfia: '--',
                        x: null,
                        y: null,
                        classificacao: 'Dados insuficientes',
                        insuficiente: true
                    };
                }

                // 1. Endomorfia (Carter 2002)
                const soma3 = (tri + sub + sup) * (170.18 / alt);
                let endo = -0.7182 + (0.1451 * soma3) - (0.00068 * Math.pow(soma3, 2)) + (0.0000014 * Math.pow(soma3, 3));
                endo = Math.max(0.1, parseFloat(endo.toFixed(1)));

                // 2. Ectomorfia
                const hwr = alt / Math.cbrt(peso);
                let ecto = 0.1;
                if (hwr >= 40.75) {
                    ecto = (hwr * 0.732) - 28.58;
                } else if (hwr >= 38.25) {
                    ecto = (hwr * 0.463) - 17.63;
                }
                ecto = Math.max(0.1, parseFloat(ecto.toFixed(1)));

                // 3. Mesomorfia (Carter 2002)
                const diamUmero = parseFloat((alt * 0.0393).toFixed(1));
                const diamFemur = parseFloat((alt * 0.0535).toFixed(1));
                const bracoCorrigido = braco - (tri / 10.0);
                const pantCorrigida = pant - (ptDobra / 10.0);

                let meso = (0.858 * diamUmero) + (0.601 * diamFemur) + (0.188 * bracoCorrigido) + (0.161 * pantCorrigida) - (0.131 * alt) + 4.5;
                meso = Math.max(0.1, parseFloat(meso.toFixed(1)));

                const x = parseFloat((ecto - endo).toFixed(1));
                const y = parseFloat(((2 * meso) - (endo + ecto)).toFixed(1));

                let classificacao = 'Central / Equilibrado';
                if (meso > endo && meso > ecto) {
                    if (endo > ecto + 0.5) classificacao = 'Meso-Endomorfo';
                    else if (ecto > endo + 0.5) classificacao = 'Ecto-Mesomorfo';
                    else classificacao = 'Mesomorfo Equilibrado';
                } else if (endo > meso && endo > ecto) {
                    if (meso > ecto + 0.5) classificacao = 'Endo-Mesomorfo';
                    else if (ecto > meso + 0.5) classificacao = 'Endo-Ectomorfo';
                    else classificacao = 'Endomorfo Equilibrado';
                } else if (ecto > endo && ecto > meso) {
                    if (meso > endo + 0.5) classificacao = 'Meso-Ectomorfo';
                    else classificacao = 'Ectomorfo Equilibrado';
                }

                return {
                    endomorfia: endo,
                    mesomorfia: meso,
                    ectomorfia: ecto,
                    x: x,
                    y: y,
                    classificacao: classificacao
                };
            },

            renderizarSomatocartaSvg: function(x, y) {
                if (typeof x !== 'number' || typeof y !== 'number' || !isFinite(x) || !isFinite(y)) {
                    return '<div style="text-align:center;font-size:0.75rem;color:#64748b;padding:1.5rem 0;">Somatocarta indisponível: faltam dobras (tríceps, subescapular, suprailíaca), braço ou panturrilha.</div>';
                }
                const svgW = 200, svgH = 170;
                const originX = 100, originY = 95;
                const scaleX = 8.5;
                const scaleY = 5.5;

                const posX = Math.max(10, Math.min(190, originX + (x * scaleX)));
                const posY = Math.max(10, Math.min(160, originY - (y * scaleY)));

                return `
                <svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" style="margin: 0 auto; display: block; overflow: visible;">
                    <polygon points="100,20 20,150 180,150" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
                    <line x1="100" y1="20" x2="100" y2="150" stroke="#e2e8f0" stroke-dasharray="3,3"/>
                    <line x1="20" y1="150" x2="180" y2="150" stroke="#e2e8f0" stroke-dasharray="3,3"/>
                    <line x1="50" y1="95" x2="150" y2="95" stroke="#e2e8f0" stroke-dasharray="3,3"/>
                    <text x="100" y="14" font-size="8" font-weight="bold" fill="#0071e3" text-anchor="middle">MESOMORFIA (+Y)</text>
                    <text x="18" y="162" font-size="7.5" font-weight="bold" fill="#ff9500" text-anchor="start">ENDOMORFIA (-X)</text>
                    <text x="182" y="162" font-size="7.5" font-weight="bold" fill="#34c759" text-anchor="end">ECTOMORFIA (+X)</text>
                    <circle cx="${posX}" cy="${posY}" r="5" fill="#ff3b30" stroke="#ffffff" stroke-width="2"/>
                    <text x="${posX + 7}" y="${posY + 3}" font-size="8.5" font-weight="bold" fill="#ff3b30">(${x}, ${y})</text>
                </svg>
                `;
            }
        };
        CalculadoraSomatotipo.doRegistro = function(aval) {
            const d = (aval && aval.dobras) || {}, p = (aval && aval.perimetria) || {};
            const alt = parseFloat(aval && aval.altura), peso = parseFloat(aval && aval.peso);
            const tri = parseFloat(d.triceps), sub = parseFloat(d.subescapular), sup = parseFloat(d.suprailiaca);
            const braco = parseFloat(p.braco_dir || p.braco_esq || aval.braco_dir), pant = parseFloat(p.panturrilha || aval.panturrilha);
            const ok = [alt, peso, tri, sub, sup, braco, pant].every(v => Number.isFinite(v) && v > 0);
            if (!ok) {
                return { endomorfia: '--', mesomorfia: '--', ectomorfia: '--', x: null, y: null, classificacao: 'Dados insuficientes', insuficiente: true };
            }
            return CalculadoraSomatotipo.calcular(alt, peso, tri, sub, sup, parseFloat(d.panturrilha) || 12.0, braco, pant);
        };
        window.CalculadoraSomatotipo = CalculadoraSomatotipo;

        // Triagem PAR-Q+
        function atualizarStatusParQLive() {
            let simCount = 0;
            for (let i = 1; i <= 7; i++) {
                if (document.getElementById(`parq_q${i}`)?.checked) simCount++;
            }
            const badge = document.getElementById('parq-live-badge');
            if (badge) {
                if (simCount === 0) {
                    badge.textContent = '✅ Apto sem restrições';
                    badge.style.background = 'var(--apple-green-light)';
                    badge.style.color = '#1b7a36';
                } else {
                    badge.textContent = `⚠️ Necessita Liberação Médica (${simCount} alerta${simCount > 1 ? 's' : ''})`;
                    badge.style.background = 'var(--apple-orange-light)';
                    badge.style.color = '#944a00';
                }
            }
        }
        window.atualizarStatusParQLive = atualizarStatusParQLive;

        // DADOS DE DEMONSTRAÇÃO V4.6 (CARLOS MENDES)
        function obterDuasAvaliacoesDemo() {
            return [
                {
                    id: 'eval_carlos_baseline',
                    nome: 'Carlos Mendes',
                    email: 'carlos.mendes@exemplo.com',
                    whatsapp: '11988887777',
                    sexo: 'M',
                    idade: 33,
                    altura: 183,
                    peso: 97.4,
                    data_avaliacao: '2026-08-31',
                    data_proxima_avaliacao: '2026-09-28',
                    checkin_semana: 'Semana 1 (Baseline)',
                    fase: 'Cutting',
                    avaliador_nome: '',
                    avaliador_registro: '',
                    avaliador_clinica: '',
                    perimetria: {
                        pescoco: 41.0, ombros: 124.0, torax: 110.0, abdomen: 90.0, cintura: 88.0, quadril: 104.0,
                        braco_esq: 38.0, braco_dir: 40.5, coxa_esq: 63.0, coxa_dir: 60.5, panturrilha: 40.0
                    },
                    perimetria_soma: 789.0,
                    dobras: {
                        triceps: 8.5, subescapular: 23.0, peitoral: 9.0, axilar: 12.0, suprailiaca: 24.0, abdominal: 16.0, coxa: 11.0, panturrilha: 14.0
                    },
                    dobras_resultado: {
                        id: 'pollock7',
                        nome: 'Jackson & Pollock (7 Dobras)',
                        soma: '103.5',
                        densidade: '1.0634',
                        percGordura: '15.5',
                        massaGorda: '15.1',
                        massaMagra: '82.3',
                        classificacao: 'Bom (Fitness)'
                    },
                    bioimpedancia: {
                        peso: 97.4, pgordura: 15.8, mme: 44.5, gordura_kg: 15.4, imc: 29.1, tmb: 2050, pmusculo: 45.7
                    },
                    parq: { q1: false, q2: false, q3: false, q4: false, q5: false, q6: false, q7: false },
                    energia: 3,
                    aderencia_treino: '100% no plano',
                    aderencia_dieta: '100% no plano',
                    desafio: 'Sim',
                    observacoes: 'Iniciando protocolo de recomposição corporal.',
                    parecer_profissional: 'Aluno apresenta excelente base muscular (82.3 kg de massa magra). Meta prioritária: lapidação estética e redução do %G para 12% mantendo volume.',
                    fotos: {
                        frente: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="100%" height="100%" fill="%231e293b"/><text x="50%" y="45%" fill="%23ffffff" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">Carlos Mendes</text><text x="50%" y="55%" fill="%2338bdf8" font-size="16" font-family="sans-serif" text-anchor="middle">1. Frente - Sem 1 (97.4 kg)</text></svg>',
                        perfil_direito: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="100%" height="100%" fill="%231e293b"/><text x="50%" y="45%" fill="%23ffffff" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">Carlos Mendes</text><text x="50%" y="55%" fill="%2338bdf8" font-size="16" font-family="sans-serif" text-anchor="middle">2. Perfil Dir - Sem 1</text></svg>',
                        perfil_esquerdo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="100%" height="100%" fill="%231e293b"/><text x="50%" y="45%" fill="%23ffffff" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">Carlos Mendes</text><text x="50%" y="55%" fill="%2338bdf8" font-size="16" font-family="sans-serif" text-anchor="middle">3. Perfil Esq - Sem 1</text></svg>',
                        costas: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="100%" height="100%" fill="%231e293b"/><text x="50%" y="45%" fill="%23ffffff" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">Carlos Mendes</text><text x="50%" y="55%" fill="%2338bdf8" font-size="16" font-family="sans-serif" text-anchor="middle">4. Costas - Sem 1</text></svg>',
                        extra: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="100%" height="100%" fill="%231e293b"/><text x="50%" y="45%" fill="%23ffffff" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">Carlos Mendes</text><text x="50%" y="55%" fill="%2338bdf8" font-size="16" font-family="sans-serif" text-anchor="middle">5. Postural - Sem 1</text></svg>',
                        lado: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="100%" height="100%" fill="%231e293b"/><text x="50%" y="45%" fill="%23ffffff" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">Carlos Mendes</text><text x="50%" y="55%" fill="%2338bdf8" font-size="16" font-family="sans-serif" text-anchor="middle">2. Perfil Dir - Sem 1</text></svg>'
                    }
                },
                {
                    id: 'eval_carlos_week4',
                    nome: 'Carlos Mendes',
                    email: 'carlos.mendes@exemplo.com',
                    whatsapp: '11988887777',
                    sexo: 'M',
                    idade: 33,
                    altura: 183,
                    peso: 95.1,
                    data_avaliacao: '2026-09-28',
                    data_proxima_avaliacao: '2026-10-26',
                    checkin_semana: 'Semana 4 (Reavaliação)',
                    fase: 'Cutting',
                    avaliador_nome: '',
                    avaliador_registro: '',
                    avaliador_clinica: '',
                    perimetria: {
                        pescoco: 40.5, ombros: 125.0, torax: 110.5, abdomen: 86.5, cintura: 85.0, quadril: 102.5,
                        braco_esq: 38.5, braco_dir: 41.0, coxa_esq: 63.5, coxa_dir: 61.0, panturrilha: 40.2
                    },
                    perimetria_soma: 784.9,
                    dobras: {
                        triceps: 7.0, subescapular: 19.5, peitoral: 7.5, axilar: 10.0, suprailiaca: 19.0, abdominal: 13.0, coxa: 9.5, panturrilha: 12.0
                    },
                    dobras_resultado: {
                        id: 'pollock7',
                        nome: 'Jackson & Pollock (7 Dobras)',
                        soma: '85.5',
                        densidade: '1.0691',
                        percGordura: '13.1',
                        massaGorda: '12.5',
                        massaMagra: '82.6',
                        classificacao: 'Excelente (Atleta)'
                    },
                    bioimpedancia: {
                        peso: 95.1, pgordura: 13.4, mme: 45.2, gordura_kg: 12.7, imc: 28.4, tmb: 2075, pmusculo: 47.5
                    },
                    parq: { q1: false, q2: false, q3: false, q4: false, q5: false, q6: false, q7: false },
                    energia: 4,
                    aderencia_treino: '100% no plano',
                    aderencia_dieta: '95% no plano',
                    desafio: 'Não',
                    observacoes: 'Redução notável da gordura abdominal e melhora na postura dorsal.',
                    parecer_profissional: 'Evolução fantástica em 4 semanas! Redução de 2.4% de gordura corporal com preservação e ganho de 300g de massa muscular. Atingimento da meta de 12% previsto para o próximo check-in.',
                    fotos: {
                        frente: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="100%" height="100%" fill="%230f172a"/><text x="50%" y="45%" fill="%23ffffff" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">Carlos Mendes</text><text x="50%" y="55%" fill="%234ade80" font-size="16" font-family="sans-serif" text-anchor="middle">1. Frente - Sem 4 (95.1 kg)</text></svg>',
                        perfil_direito: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="100%" height="100%" fill="%230f172a"/><text x="50%" y="45%" fill="%23ffffff" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">Carlos Mendes</text><text x="50%" y="55%" fill="%234ade80" font-size="16" font-family="sans-serif" text-anchor="middle">2. Perfil Dir - Sem 4</text></svg>',
                        perfil_esquerdo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="100%" height="100%" fill="%230f172a"/><text x="50%" y="45%" fill="%23ffffff" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">Carlos Mendes</text><text x="50%" y="55%" fill="%234ade80" font-size="16" font-family="sans-serif" text-anchor="middle">3. Perfil Esq - Sem 4</text></svg>',
                        costas: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="100%" height="100%" fill="%230f172a"/><text x="50%" y="45%" fill="%23ffffff" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">Carlos Mendes</text><text x="50%" y="55%" fill="%234ade80" font-size="16" font-family="sans-serif" text-anchor="middle">4. Costas - Sem 4</text></svg>',
                        extra: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="100%" height="100%" fill="%230f172a"/><text x="50%" y="45%" fill="%23ffffff" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">Carlos Mendes</text><text x="50%" y="55%" fill="%234ade80" font-size="16" font-family="sans-serif" text-anchor="middle">5. Postural - Sem 4</text></svg>',
                        lado: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="100%" height="100%" fill="%230f172a"/><text x="50%" y="45%" fill="%23ffffff" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">Carlos Mendes</text><text x="50%" y="55%" fill="%234ade80" font-size="16" font-family="sans-serif" text-anchor="middle">2. Perfil Dir - Sem 4</text></svg>'
                    }
                }
            ];
        }
        window.obterDuasAvaliacoesDemo = obterDuasAvaliacoesDemo;

        // =========================================================================
        // UTILITÁRIOS DE ROBUSTEZ & SEGURANÇA (V5.1 STUDIO)
        // =========================================================================
        const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
        const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };
        const idSeguro = id => String(id).replace(/[^A-Za-z0-9_-]/g, '_');
        
        function hojeISO(offsetDias = 0) {
            const d = new Date();
            d.setDate(d.getDate() + offsetDias);
            return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        }

        function cmpAval(a, b) {
            return String(a.data_avaliacao || '').localeCompare(String(b.data_avaliacao || '')) ||
                   String(a.timestamp || '').localeCompare(String(b.timestamp || ''));
        }

        function limparTexto(s) {
            if (s == null) return '';
            return String(s)
                .replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, '')
                .replace(/<\s*(?:iframe|embed|object|meta|link|style)[^>]*>/gi, '')
                .replace(/<\s*\/?[a-zA-Z][a-zA-Z0-9]*\b[^>]*>/g, '')
                .trim();
        }

        function sanitizarRegistro(r, _nested) {
            if (!r || typeof r !== 'object') return r;
            const out = {};
            for (const k of Object.keys(r)) {
                const v = r[k];
                if (k === 'fotos') {
                    out.fotos = {};
                    const poses = ['frente', 'perfil_direito', 'perfil_esquerdo', 'costas', 'extra', 'lado'];
                    poses.forEach(p => {
                        const val = v?.[p];
                        let ehValido = false;
                        if (typeof val === 'string') {
                            if (/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(val)) {
                                ehValido = true;
                            } else if (/^blob:[A-Za-z0-9:/._-]+$/i.test(val)) {
                                ehValido = true;
                            } else if (/^data:image\/svg\+xml;(base64,[A-Za-z0-9+/=]+|utf8,[A-Za-z0-9%.,# \-_()<>=:;/!]+)$/i.test(val)) {
                                const semScript = !/["'`]|onerror|onload|onclick|onmouseover|javascript:|<script|<foreignObject|<animate|<set/i.test(val);
                                let semScriptBase64 = true;
                                if (val.includes(';base64,')) {
                                    try {
                                        const decoded = atob(val.split(';base64,')[1]);
                                        if (/<script|<foreignObject|<animate|<set|onerror|onload|javascript:/i.test(decoded)) {
                                            semScriptBase64 = false;
                                        }
                                    } catch(_) { semScriptBase64 = false; }
                                }
                                ehValido = semScript && semScriptBase64;
                            }
                        }
                        out.fotos[p] = ehValido ? val : '';
                    });
                } else if (typeof v === 'string') {
                    out[k] = limparTexto(v);
                } else if (v && typeof v === 'object' && !Array.isArray(v)) {
                    out[k] = sanitizarRegistro(v, true);
                } else if (Array.isArray(v)) {
                    out[k] = v.map(x => typeof x === 'string' ? limparTexto(x) : (x && typeof x === 'object' ? sanitizarRegistro(x, true) : x));
                } else {
                    out[k] = v;
                }
            }
            ['perimetria', 'dobras', 'bioimpedancia'].forEach(g => {
                if (out[g] && typeof out[g] === 'object') {
                    Object.keys(out[g]).forEach(k => {
                        if (typeof out[g][k] === 'string' && k !== 'risco' && k !== 'analise_texto' && out[g][k] !== '') {
                            out[g][k] = num(out[g][k]);
                        }
                    });
                }
            });
            if (!_nested) { out.peso = num(out.peso); out.altura = num(out.altura); out.idade = num(out.idade); }
            if (r.id) out.id = idSeguro(r.id);
            return out;
        }

        function retornoAtrasado(a) {
            return !!a.data_proxima_avaliacao && a.data_proxima_avaliacao < hojeISO();
        }

        function baixarJSON(obj, filename) {
            const url = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }));
            const dl = document.createElement('a');
            dl.href = url;
            dl.download = filename;
            document.body.appendChild(dl);
            dl.click();
            dl.remove();
            setTimeout(() => URL.revokeObjectURL(url), 2000);
        }

        function exportarCSV() {
            if (!avaliacoes || avaliacoes.length === 0) {
                alert('Nenhuma avaliação encontrada para exportação.');
                return;
            }
            const cols = [
                'Nome Aluno', 'E-mail', 'WhatsApp', 'Sexo', 'Idade', 'Altura (cm)',
                'Data Avaliação', 'Próxima Avaliação', 'Check-in / Semana', 'Fase',
                'Peso (kg)', '%G Pollock', '%G BIA', 'Massa Magra (kg)', 'MME BIA (kg)',
                'IMC', 'RCQ', 'Soma Perimetria (cm)', 'Soma Dobras (mm)', 'Nível Energia',
                'Score Aderência', 'Status do Parecer', 'Meta %G', 'Sono (1-5)', 'Estresse (1-5)'
            ];
            const cel = v => {
                let t = String(v ?? '');
                const trimmed = t.trimStart();
                if (/^-?\d+\.\d+$/.test(trimmed)) {
                    t = trimmed.replace('.', ',');
                } else if (/^[=+\-@\t\r]/.test(trimmed) && !/^-?\d+([.,]\d+)?$/.test(trimmed)) {
                    t = "'" + t;
                }
                return '"' + t.replace(/"/g, '""') + '"';
            };
            const linhas = avaliacoes.map(a => [
                a.nome, a.email, a.whatsapp, a.sexo, a.idade, a.altura,
                a.data_avaliacao, a.data_proxima_avaliacao || '', a.checkin_semana, a.fase,
                a.peso, a.dobras_resultado?.percGordura ?? '', a.bioimpedancia?.pgordura ?? '',
                a.dobras_resultado?.massaMagra ?? '', a.bioimpedancia?.mme ?? '',
                a.bioimpedancia?.imc ?? '', a.bioimpedancia?.rcq ?? '',
                a.perimetria_soma ?? '', a.dobras_resultado?.soma ?? '',
                a.energia ?? '', a.parecer_v6?.score ?? '', a.parecer_v6?.status ?? '',
                a.parecer_v6?.meta_pgordura ?? '', a.parecer_v6?.sono ?? '', a.parecer_v6?.estresse ?? ''
            ].map(cel).join(';'));

            const csvContent = '﻿' + [cols.map(cel).join(';'), ...linhas].join('\r\n');
            const nomeCsv = 'evolufisico_avaliacoes_' + hojeISO() + '.csv';
            if (EF_Security.enabled && EF_Security.key) {
                EF_Security.exportEncryptedText(csvContent, nomeCsv, 'text/csv;charset=utf-8').then(()=>{ if(window.efToast) efToast('🔐 CSV criptografado gerado.'); });
                return;
            }
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const dl = document.createElement('a');
            dl.href = url;
            dl.download = nomeCsv;
            document.body.appendChild(dl);
            dl.click();
            dl.remove();
            setTimeout(() => URL.revokeObjectURL(url), 2000);
        }
        window.exportarCSV = exportarCSV;


        /* =========================================================================
           v7.7.0 — COFRE DE DADOS / CHAVE MESTRA
           AES-256-GCM + PBKDF2-SHA-256. A senha nunca é persistida.
           ========================================================================= */
        const EF_SECURITY_META_KEY = 'evolufisico_security_meta_v1';
        const EF_SECURITY_STORAGE_KEY = 'evolufisico_vault_v1';
        const EF_SECURITY_SNAPSHOT_KEY = 'evolufisico_backup_safety_snapshot_v1';
        const EF_SECURITY_VERIFIER = 'EvoluFisico::MASTER::VERIFIER::v1';

        const EF_Security = {
            enabled: false,
            key: null,
            meta: null,
            iterations: 250000,

            _b64(bytes) {
                const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
                let s = '';
                const chunk = 0x2000;
                for (let i = 0; i < u8.length; i += chunk) s += String.fromCharCode.apply(null, u8.subarray(i, Math.min(i + chunk, u8.length)));
                return btoa(s);
            },
            _unb64(str) {
                const bin = atob(str);
                const u8 = new Uint8Array(bin.length);
                for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
                return u8;
            },
            async _derive(password, salt, iterations) {
                const material = await crypto.subtle.importKey(
                    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']
                );
                return crypto.subtle.deriveKey(
                    { name: 'PBKDF2', salt, iterations: iterations || this.iterations, hash: 'SHA-256' },
                    material,
                    { name: 'AES-GCM', length: 256 },
                    false,
                    ['encrypt', 'decrypt']
                );
            },
            async encryptText(text, key = this.key) {
                if (!key) throw new Error('Cofre bloqueado. Informe a chave mestra.');
                const iv = crypto.getRandomValues(new Uint8Array(12));
                const data = new TextEncoder().encode(String(text));
                const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
                return { v: 1, alg: 'AES-256-GCM', iv: this._b64(iv), ct: this._b64(cipher) };
            },
            async decryptText(packet, key = this.key) {
                if (!key) throw new Error('Cofre bloqueado. Informe a chave mestra.');
                if (!packet || packet.alg !== 'AES-256-GCM' || !packet.iv || !packet.ct) throw new Error('Pacote criptografado inválido.');
                const plain = await crypto.subtle.decrypt(
                    { name: 'AES-GCM', iv: this._unb64(packet.iv) },
                    key, this._unb64(packet.ct)
                );
                return new TextDecoder().decode(plain);
            },
            async encryptBytes(bytes, key = this.key) {
                if (!key) throw new Error('Cofre bloqueado. Informe a chave mestra.');
                const iv = crypto.getRandomValues(new Uint8Array(12));
                const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(await new Response(bytes).arrayBuffer());
                const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
                return { v: 1, alg: 'AES-256-GCM', iv: this._b64(iv), ct: this._b64(cipher) };
            },
            async encryptObject(obj, key = this.key) {
                return this.encryptText(JSON.stringify(obj), key);
            },
            async decryptObject(packet, key = this.key) {
                return JSON.parse(await this.decryptText(packet, key));
            },
            async createMeta(password) {
                if (!window.crypto?.subtle) throw new Error('Web Crypto API indisponível neste navegador.');
                const salt = crypto.getRandomValues(new Uint8Array(16));
                const key = await this._derive(password, salt);
                const verifier = await this.encryptText(EF_SECURITY_VERIFIER, key);
                return { version: 1, kdf: 'PBKDF2-SHA-256', iterations: this.iterations, salt: this._b64(salt), verifier, createdAt: new Date().toISOString() };
            },
            async setupNewPassword(password) {
                if (this.isConfigured() && this.enabled && this.key) {
                    return this.redefinirSenha(password);
                }
                const meta = await this.createMeta(password);
                this.meta = meta;
                this.key = await this._derive(password, this._unb64(meta.salt));
                this.enabled = true;
                localStorage.setItem(EF_SECURITY_META_KEY, JSON.stringify(meta));
                await this.migrarDadosExistentesParaCofre();
                if (window.EFCobranca) await EFCobranca.protect();
                this._updateUI();
                return true;
            },
            // Grava (limpa + regrava) o IndexedDB numa ÚNICA transação: ou tudo, ou nada.
            _idbSubstituirTudo(linhas) {
                return new Promise((resolve, reject) => {
                    const tx = db.transaction([STORE_NAME], 'readwrite');
                    const st = tx.objectStore(STORE_NAME);
                    st.clear();
                    for (const r of linhas) st.put(r);
                    tx.oncomplete = () => resolve();
                    tx.onerror = () => reject(tx.error || new Error('Falha ao gravar no IndexedDB'));
                    tx.onabort = () => reject(tx.error || new Error('Transação abortada'));
                });
            },
            async redefinirSenha(novaSenha) {
                if (!this.enabled || !this.key) {
                    throw new Error('O cofre precisa estar desbloqueado para alterar a senha.');
                }
                if (!novaSenha || novaSenha.length < 10) {
                    throw new Error('A nova chave mestra deve ter no mínimo 10 caracteres.');
                }
                const chaveAntiga = this.key;
                const lista = Array.isArray(avaliacoes) ? avaliacoes : [];
                const meta = await this.createMeta(novaSenha);
                const novaChave = await this._derive(novaSenha, this._unb64(meta.salt), meta.iterations);

                // 1) Prepara TUDO em memória com a chave nova (nada é gravado ainda)
                const vaultNovo = JSON.stringify(await this.encryptObject(lista, novaChave));
                const linhasNovas = [];
                for (const item of lista) linhasNovas.push({ id: item.id, __efEncrypted: true, payload: await this.encryptObject(item, novaChave) });

                let snapNovo = null;
                try {
                    const snapRaw = localStorage.getItem(EF_SECURITY_SNAPSHOT_KEY);
                    if (snapRaw) {
                        let snapDec;
                        try { snapDec = await this.decryptObject(JSON.parse(snapRaw), chaveAntiga); } catch (_) { snapDec = JSON.parse(snapRaw); }
                        if (snapDec) snapNovo = JSON.stringify(await this.encryptObject(snapDec, novaChave));
                    }
                } catch (e) { console.warn('Snapshot não pôde ser re-criptografado:', e); }

                let autoNovo = null;
                try {
                    const salvo = localStorage.getItem(AUTOSAVE_KEY);
                    if (salvo) {
                        const raw = JSON.parse(salvo);
                        if (raw && raw.__efEncrypted) {
                            const rascunho = await this.decryptObject(raw.payload, chaveAntiga);
                            autoNovo = JSON.stringify({ __efEncrypted: true, payload: await this.encryptObject(rascunho, novaChave) });
                        }
                    }
                } catch (e) { console.warn('Rascunho não pôde ser re-criptografado:', e); }

                // 2) Guarda o estado anterior para poder desfazer em caso de falha
                const financial = window.EFCobranca ? await EFCobranca.exportData() : null;
                const financialNew = financial ? JSON.stringify({__efEncrypted:true,payload:await this.encryptObject(financial,novaChave)}) : null;
                const chavesLS = ['evolufisico_cobrancas_db', EF_SECURITY_META_KEY, EF_SECURITY_STORAGE_KEY, EF_SECURITY_SNAPSHOT_KEY, AUTOSAVE_KEY];
                const backupLS = {}; chavesLS.forEach(k => backupLS[k] = localStorage.getItem(k));
                const linhasAntigas = [];
                if (db) for (const item of lista) linhasAntigas.push({ id: item.id, __efEncrypted: true, payload: await this.encryptObject(item, chaveAntiga) });

                // 3) IndexedDB (atômico) e depois LocalStorage (meta por último)
                if (db) await this._idbSubstituirTudo(linhasNovas);
                try {
                    localStorage.setItem(EF_SECURITY_STORAGE_KEY, vaultNovo);
                    if (snapNovo) localStorage.setItem(EF_SECURITY_SNAPSHOT_KEY, snapNovo);
                    if (autoNovo) localStorage.setItem(AUTOSAVE_KEY, autoNovo);
                    if (financialNew) localStorage.setItem('evolufisico_cobrancas_db',financialNew);
                    localStorage.setItem(EF_SECURITY_META_KEY, JSON.stringify(meta));
                    if (window.EFCobranca) EFCobranca.clearMemory();
                } catch (e) {
                    chavesLS.forEach(k => { try { if (backupLS[k] === null) localStorage.removeItem(k); else localStorage.setItem(k, backupLS[k]); } catch (_) {} });
                    if (db) { try { await this._idbSubstituirTudo(linhasAntigas); } catch (_) {} }
                    throw new Error('Não foi possível gravar a nova chave (nada foi alterado): ' + e.message);
                }

                this.meta = meta;
                this.key = novaChave;
                this.enabled = true;
                this._updateUI();

                if (window.__EF63_STATE__) window.__EF63_STATE__.touch();
                atualizarContadorHistorico();
                preencherSeletoresComparacao();
                agendarRenderHistorico();
                return true;
            },
            async removerSenha() {
                if (!this.enabled || !this.key) {
                    throw new Error('O cofre precisa estar desbloqueado para remover a senha.');
                }
                const lista = Array.isArray(avaliacoes) ? avaliacoes : [];

                // Sem IndexedDB, o LocalStorage é o único destino: precisa gravar antes de qualquer remoção.
                if (!db) {
                    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lista)); }
                    catch (e) { throw new Error('Não foi possível gravar os dados sem criptografia (nada foi alterado): ' + e.message); }
                }

                // 1) IndexedDB em formato plano, numa única transação (registros gravados como estão)
                if (db) await this._idbSubstituirTudo(lista.map(item => item));

                // 2) Snapshot de segurança
                try {
                    const snapRaw = localStorage.getItem(EF_SECURITY_SNAPSHOT_KEY);
                    if (snapRaw) {
                        let snapDec;
                        try { snapDec = await this.decryptObject(JSON.parse(snapRaw), this.key); } catch (_) { snapDec = JSON.parse(snapRaw); }
                        if (snapDec) localStorage.setItem('evolufisico_backup_safety_snapshot', JSON.stringify(snapDec));
                        localStorage.removeItem(EF_SECURITY_SNAPSHOT_KEY);
                    }
                } catch (e) { console.warn('Erro ao decodificar snapshot na remoção de senha:', e); }

                // 3) Rascunho do formulário
                try {
                    const salvo = localStorage.getItem(AUTOSAVE_KEY);
                    if (salvo) {
                        const raw = JSON.parse(salvo);
                        if (raw && raw.__efEncrypted) {
                            localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(await this.decryptObject(raw.payload, this.key)));
                        }
                    }
                } catch (e) { console.warn('Rascunho não pôde ser descriptografado:', e); }

                // 4) Cópia em LocalStorage (opcional quando há IndexedDB: fotos podem estourar a cota) e remoção do cofre
                if (db) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lista)); } catch (e) { console.warn('Cópia em LocalStorage ignorada (cota):', e); } }
                if (window.EFCobranca) await EFCobranca.unprotect();
                localStorage.removeItem(EF_SECURITY_META_KEY);
                localStorage.removeItem(EF_SECURITY_STORAGE_KEY);

                this.enabled = false;
                this.key = null;
                this.meta = null;
                this._updateUI();

                if (window.__EF63_STATE__) window.__EF63_STATE__.touch();
                atualizarContadorHistorico();
                preencherSeletoresComparacao();
                agendarRenderHistorico();
                return true;
            },
            async unlock(password) {
                const meta = JSON.parse(localStorage.getItem(EF_SECURITY_META_KEY) || 'null');
                if (!meta) return false;
                try {
                    const key = await this._derive(password, this._unb64(meta.salt), meta.iterations);
                    const check = await this.decryptText(meta.verifier, key);
                    if (check !== EF_SECURITY_VERIFIER) throw new Error('Chave inválida');
                    this.meta = meta;
                    this.key = key;
                    this.enabled = true;
                    if (window.EFCobranca) await EFCobranca.protect();
                    this._updateUI();
                    return true;
                } catch (e) {
                    return false;
                }
            },
            lock() {
                if (window.EFCobranca) EFCobranca.clearMemory();
                this.key = null;
                this.enabled = !!localStorage.getItem(EF_SECURITY_META_KEY);
                this._updateUI();
            },
            isConfigured() { return !!localStorage.getItem(EF_SECURITY_META_KEY); },

            async inicializar() {
                if (!this.isConfigured()) {
                    this.enabled = false;
                    this._updateUI();
                    return true;
                }
                this.enabled = true;
                while (!this.key) {
                    const senha = prompt('🔐 EvoluFísico protegido\n\nDigite a chave mestra para desbloquear os dados:');
                    if (senha === null) return false;
                    if (await this.unlock(senha)) return true;
                    alert('❌ Chave mestra incorreta.');
                }
                return true;
            },

            async migrarDadosExistentesParaCofre() {
                try {
                    const legado = localStorage.getItem(STORAGE_KEY);
                    if (legado) {
                        let dados = null;
                        try { dados = JSON.parse(legado); } catch (_) {}
                        if (Array.isArray(dados)) {
                            localStorage.setItem(EF_SECURITY_STORAGE_KEY, JSON.stringify(await this.encryptObject(dados)));
                            localStorage.removeItem(STORAGE_KEY);
                        }
                    } else if (Array.isArray(avaliacoes) && avaliacoes.length > 0) {
                        localStorage.setItem(EF_SECURITY_STORAGE_KEY, JSON.stringify(await this.encryptObject(avaliacoes)));
                    }
                } catch (e) { console.warn('Falha ao proteger LocalStorage legado:', e); }

                if (db && this.enabled && this.key) {
                    try {
                        const rows = await new Promise((resolve, reject) => {
                            const tx = db.transaction([STORE_NAME], 'readonly');
                            const req = tx.objectStore(STORE_NAME).getAll();
                            req.onsuccess = () => resolve(req.result || []);
                            req.onerror = () => reject(req.error);
                        });
                        const encryptedRows = [];
                        for (const item of rows) {
                            if (item && item.__efEncrypted) encryptedRows.push(item);
                            else if (item && item.id) encryptedRows.push({ id:item.id, __efEncrypted:true, payload:await this.encryptObject(item) });
                        }
                        await new Promise((resolve, reject) => {
                            const tx = db.transaction([STORE_NAME], 'readwrite');
                            const store = tx.objectStore(STORE_NAME);
                            for (const row of encryptedRows) store.put(row);
                            tx.oncomplete = () => resolve();
                            tx.onerror = () => reject(tx.error);
                            tx.onabort = () => reject(tx.error || new Error('Transação abortada'));
                        });
                    } catch (e) { console.warn('Falha ao criptografar registros existentes:', e); alert('⚠️ Alguns registros salvos neste navegador não puderam ser criptografados. Faça um backup agora e tente ativar a criptografia novamente.'); }
                }
                try {
                    const snap = localStorage.getItem('evolufisico_backup_safety_snapshot');
                    if (snap) {
                        const obj = JSON.parse(snap);
                        localStorage.setItem(EF_SECURITY_SNAPSHOT_KEY, JSON.stringify(await this.encryptObject(obj)));
                        localStorage.removeItem('evolufisico_backup_safety_snapshot');
                    }
                } catch (e) { console.warn('Falha ao proteger snapshot de segurança:', e); }
            },

            async saveVaultArray(arr) {
                if (!this.enabled || !this.key) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
                    return;
                }
                localStorage.setItem(EF_SECURITY_STORAGE_KEY, JSON.stringify(await this.encryptObject(arr)));
                localStorage.removeItem(STORAGE_KEY);
            },

            async loadVaultArray() {
                if (this.enabled && this.key) {
                    const raw = localStorage.getItem(EF_SECURITY_STORAGE_KEY);
                    if (raw) return this.decryptObject(JSON.parse(raw));
                    const legado = localStorage.getItem(STORAGE_KEY);
                    if (legado) {
                        const dados = JSON.parse(legado);
                        if (Array.isArray(dados)) {
                            localStorage.setItem(EF_SECURITY_STORAGE_KEY, JSON.stringify(await this.encryptObject(dados)));
                            localStorage.removeItem(STORAGE_KEY);
                        }
                        return dados;
                    }
                    return null;
                }
                const raw = localStorage.getItem(STORAGE_KEY);
                return raw ? JSON.parse(raw) : null;
            },

            async exportEncryptedText(text, filename, mime='application/json') {
                const packet = await this.encryptText(text);
                const envelope = {
                    app: 'EvoluFísico',
                    security: 'AES-256-GCM',
                    version: 1,
                    encrypted: true,
                    kdf: this.meta ? { name: 'PBKDF2-SHA-256', salt: this.meta.salt, iterations: this.meta.iterations || this.iterations } : undefined,
                    originalName: filename,
                    mimeType: mime,
                    createdAt: new Date().toISOString(),
                    payload: packet
                };
                const outName = filename.replace(/\.[^.]+$/, '') + '.efx';
                const blob = new Blob([JSON.stringify(envelope, null, 2)], {type:'application/octet-stream'});
                const url = URL.createObjectURL(blob);
                const dl = document.createElement('a');
                dl.href = url; dl.download = outName;
                document.body.appendChild(dl); dl.click(); dl.remove();
                setTimeout(()=>URL.revokeObjectURL(url), 2000);
                return outName;
            },

            async decryptImportedText(text) {
                let env;
                try { env = JSON.parse(text); } catch (_) { throw new Error('Arquivo criptografado inválido.'); }
                if (!env.encrypted || env.security !== 'AES-256-GCM' || !env.payload) throw new Error('Este arquivo não é um pacote EvoluFísico criptografado.');
                let chave = this.key;
                const kdf = env.kdf;
                if (kdf && kdf.salt && (!chave || !this.meta || this.meta.salt !== kdf.salt)) {
                    const senha = prompt('🔐 Este backup foi criptografado em outro cofre.\n\nDigite a chave mestra usada na criação do arquivo:');
                    if (senha === null) throw new Error('Importação cancelada.');
                    chave = await this._derive(senha, this._unb64(kdf.salt), kdf.iterations);
                }
                let textoPlano;
                try { textoPlano = await this.decryptText(env.payload, chave); }
                catch (e) { throw new Error(chave ? 'Chave mestra incorreta ou arquivo corrompido.' : e.message); }
                return { text: textoPlano, originalName: env.originalName || 'arquivo.json', mimeType: env.mimeType || 'application/octet-stream' };
            },

            async exportBackup(envelope, filename) {
                if (!this.enabled || !this.key) throw new Error('Ative/desbloqueie a chave mestra antes de exportar.');
                return this.exportEncryptedText(JSON.stringify(envelope), filename, 'application/json');
            },

            _updateUI() {
                const badge = document.getElementById('ef-security-badge');
                if (badge) {
                    badge.textContent = this.enabled && this.key ? '🔐 Cofre desbloqueado' : (this.isConfigured() ? '🔒 Cofre bloqueado' : '⚪ Criptografia desativada');
                    badge.style.color = this.enabled && this.key ? '#15803d' : (this.isConfigured() ? '#b45309' : '#64748b');
                }
            }
        };
        window.EF_Security = EF_Security;

        function abrirConfiguracaoCriptografia() {
            let div = document.getElementById('ef-security-modal');
            if (!div) {
                div = document.createElement('div');
                div.id = 'ef-security-modal';
                div.className = 'modal-overlay';
                document.body.appendChild(div);
            }
            renderizarModalCriptografia();
            div.classList.remove('hidden');
        }

        function fecharConfiguracaoCriptografia() {
            const div = document.getElementById('ef-security-modal');
            if (div) div.classList.add('hidden');
        }

        function renderizarModalCriptografia() {
            const div = document.getElementById('ef-security-modal');
            if (!div) return;

            const isDesbloqueado = EF_Security.enabled && EF_Security.key;
            const isConfigurado = EF_Security.isConfigured();

            if (isDesbloqueado) {
                div.innerHTML = `
                  <div class="modal-card" style="max-width:540px;width:95%;">
                    <div class="modal-header">
                      <div class="modal-title" style="display:flex;align-items:center;gap:8px;">
                        <span>🔐</span> <span>Segurança e Chave Mestra</span>
                      </div>
                      <button class="modal-close-btn" onclick="fecharConfiguracaoCriptografia()">&times;</button>
                    </div>
                    <div class="modal-body" style="padding:1.25rem;">
                      <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:0.85rem 1rem; margin-bottom:1.1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                        <div>
                          <span style="font-size:0.75rem; color:#166534; font-weight:700; text-transform:uppercase;">Status do Cofre</span>
                          <div style="font-size:1.02rem; font-weight:700; color:#14532d;">🟢 Desbloqueado e Ativo</div>
                        </div>
                        <button type="button" class="btn btn-outline btn-sm" onclick="bloquearCofreEFechar()" title="Bloquear o cofre imediatamente">🔒 Bloquear Agora</button>
                      </div>

                      <div class="info-box" style="margin-bottom:1.25rem;">
                        <strong>AES-256-GCM + PBKDF2:</strong> O cofre está aberto e os dados estão em memória. Você pode alterar sua chave mestra ou resetar/remover a proteção por senha.
                      </div>

                      <!-- Seção 1: Alterar / Redefinir Chave Mestra -->
                      <div style="border:1px solid #e2e8f0; border-radius:14px; padding:1.1rem; background:#ffffff; margin-bottom:1.25rem;">
                        <h4 style="font-size:0.92rem; font-weight:700; color:#0f172a; margin-bottom:0.35rem; display:flex; align-items:center; gap:6px;">
                          <span>🔑</span> <span>Alterar Chave Mestra</span>
                        </h4>
                        <p style="font-size:0.78rem; color:#64748b; line-height:1.45; margin-bottom:0.85rem;">
                          Define uma nova senha e re-criptografa todos os registros do IndexedDB e LocalStorage.
                        </p>
                        <div class="input-group">
                          <label style="font-size:0.78rem; font-weight:600;">Nova chave mestra (mínimo 10 caracteres)</label>
                          <input id="ef-security-pass1" type="password" autocomplete="new-password" placeholder="Digite a nova chave mestra">
                        </div>
                        <div class="input-group" style="margin-top:0.75rem;">
                          <label style="font-size:0.78rem; font-weight:600;">Confirmar nova chave mestra</label>
                          <input id="ef-security-pass2" type="password" autocomplete="new-password" placeholder="Confirme a nova chave mestra">
                        </div>
                        <div id="ef-security-status" style="font-size:0.78rem; margin-top:0.6rem; min-height:1.2em;"></div>
                        <div style="display:flex; justify-content:flex-end; margin-top:0.85rem;">
                          <button type="button" class="btn btn-primary btn-sm" id="ef-btn-alterar-senha" onclick="executarAlterarChaveMestra()">
                            🔐 Atualizar Chave Mestra
                          </button>
                        </div>
                      </div>

                      <!-- Seção 2: Resetar Senha / Desativar Proteção -->
                      <div style="border:1px solid #fed7aa; border-radius:14px; padding:1.1rem; background:#fff7ed;">
                        <h4 style="font-size:0.92rem; font-weight:700; color:#9a3412; margin-bottom:0.35rem; display:flex; align-items:center; gap:6px;">
                          <span>🔓</span> <span>Resetar Senha / Desativar Cofre</span>
                        </h4>
                        <p style="font-size:0.78rem; color:#7c2d12; line-height:1.45; margin-bottom:0.85rem;">
                          Descriptografa todos os registros e remove a chave mestra. Seus dados permanecerão salvos normalmente no navegador em modo padrão desprotegido.
                        </p>
                        <div style="display:flex; justify-content:flex-end;">
                          <button type="button" class="btn btn-warning btn-sm" id="ef-btn-resetar-senha" onclick="executarResetarRemoverSenha()" style="background:#ea580c; color:#fff; border:0;">
                            ⚠️ Resetar Senha (Remover Proteção)
                          </button>
                        </div>
                      </div>
                    </div>
                    <div class="modal-footer" style="display:flex; justify-content:flex-end; gap:8px;">
                      <button class="btn btn-secondary" onclick="fecharConfiguracaoCriptografia()">Fechar</button>
                    </div>
                  </div>
                `;
            } else if (isConfigurado) {
                div.innerHTML = `
                  <div class="modal-card" style="max-width:520px;width:95%;">
                    <div class="modal-header">
                      <div class="modal-title" style="display:flex;align-items:center;gap:8px;">
                        <span>🔒</span> <span>Cofre Bloqueado</span>
                      </div>
                      <button class="modal-close-btn" onclick="fecharConfiguracaoCriptografia()">&times;</button>
                    </div>
                    <div class="modal-body" style="padding:1.25rem;">
                      <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:12px; padding:0.85rem 1rem; margin-bottom:1rem; color:#92400e; font-size:0.85rem; line-height:1.5;">
                        🔒 <strong>O cofre está bloqueado.</strong> Para alterar ou resetar a senha com segurança, você precisa primeiro desbloquear os dados com a chave mestra atual.
                      </div>
                      <div class="input-group">
                        <label style="font-size:0.78rem; font-weight:600;">Chave mestra atual</label>
                        <input id="ef-security-pass-unlock" type="password" placeholder="Digite a chave mestra atual">
                      </div>
                      <div id="ef-security-status" style="font-size:0.78rem;margin-top:0.75rem;min-height:1.2em;"></div>
                    </div>
                    <div class="modal-footer" style="display:flex; justify-content:flex-end; gap:8px;">
                      <button class="btn btn-secondary" onclick="fecharConfiguracaoCriptografia()">Cancelar</button>
                      <button class="btn btn-primary" onclick="desbloquearPeloModal()">🔓 Desbloquear</button>
                    </div>
                  </div>
                `;
            } else {
                div.innerHTML = `
                  <div class="modal-card" style="max-width:520px;width:95%;">
                    <div class="modal-header">
                      <div class="modal-title" style="display:flex;align-items:center;gap:8px;">
                        <span>🔐</span> <span>Segurança e Chave Mestra</span>
                      </div>
                      <button class="modal-close-btn" onclick="fecharConfiguracaoCriptografia()">&times;</button>
                    </div>
                    <div class="modal-body" style="padding:1.25rem;">
                      <div class="info-box" style="margin-bottom:1rem;">
                        <strong>AES-256-GCM + PBKDF2-SHA-256:</strong> Ao ativar, seus dados locais, fotos e backups serão protegidos com criptografia. A senha nunca é salva no disco.
                      </div>
                      <p style="font-size:.84rem;color:#334155;margin-bottom:1rem;line-height:1.5;">
                        Protege o banco local (IndexedDB) e arquivos exportados contra acesso não autorizado no dispositivo.
                      </p>
                      <div class="input-group">
                        <label style="font-size:0.78rem; font-weight:600;">Nova chave mestra (mínimo 10 caracteres)</label>
                        <input id="ef-security-pass1" type="password" autocomplete="new-password" placeholder="Digite uma chave forte">
                      </div>
                      <div class="input-group" style="margin-top:0.75rem;">
                        <label style="font-size:0.78rem; font-weight:600;">Confirmar chave mestra</label>
                        <input id="ef-security-pass2" type="password" autocomplete="new-password" placeholder="Repita a chave mestra">
                      </div>
                      <div id="ef-security-status" style="font-size:0.78rem;margin-top:0.75rem;min-height:1.2em;"></div>
                    </div>
                    <div class="modal-footer" style="display:flex; justify-content:flex-end; gap:8px;">
                      <button class="btn btn-secondary" onclick="fecharConfiguracaoCriptografia()">Cancelar</button>
                      <button class="btn btn-primary" onclick="ativarOuAlterarCriptografia()">🔐 Ativar Proteção</button>
                    </div>
                  </div>
                `;
            }
        }

        async function ativarOuAlterarCriptografia() {
            const p1 = document.getElementById('ef-security-pass1')?.value || '';
            const p2 = document.getElementById('ef-security-pass2')?.value || '';
            const st = document.getElementById('ef-security-status');
            if (p1.length < 10) {
                if (st) { st.textContent = 'A chave mestra deve ter pelo menos 10 caracteres.'; st.style.color = '#dc2626'; }
                return;
            }
            if (p1 !== p2) {
                if (st) { st.textContent = 'As chaves digitadas não coincidem.'; st.style.color = '#dc2626'; }
                return;
            }
            try {
                await EF_Security.setupNewPassword(p1);
                if (st) { st.textContent = '✅ Criptografia ativada e dados existentes protegidos.'; st.style.color = '#16a34a'; }
                if (window.efToast) efToast('🔐 Cofre de dados ativado com sucesso.');
                setTimeout(() => {
                    renderizarModalCriptografia();
                }, 1000);
            } catch (e) {
                console.error(e);
                if (st) { st.textContent = '❌ Não foi possível ativar: ' + e.message; st.style.color = '#dc2626'; }
            }
        }

        async function executarAlterarChaveMestra() {
            const p1 = document.getElementById('ef-security-pass1')?.value || '';
            const p2 = document.getElementById('ef-security-pass2')?.value || '';
            const st = document.getElementById('ef-security-status');
            const btn = document.getElementById('ef-btn-alterar-senha');
            if (p1.length < 10) {
                if (st) { st.textContent = 'A chave mestra deve ter pelo menos 10 caracteres.'; st.style.color = '#dc2626'; }
                return;
            }
            if (p1 !== p2) {
                if (st) { st.textContent = 'As chaves digitadas não coincidem.'; st.style.color = '#dc2626'; }
                return;
            }
            if (btn) { btn.disabled = true; btn.textContent = 'Criptografando...'; }
            if (st) { st.textContent = 'Re-criptografando registros com a nova chave...'; st.style.color = '#2563eb'; }
            try {
                await EF_Security.redefinirSenha(p1);
                if (st) { st.textContent = '✅ Chave mestra alterada com sucesso! Todos os registros foram re-criptografados.'; st.style.color = '#16a34a'; }
                document.getElementById('ef-security-pass1').value = '';
                document.getElementById('ef-security-pass2').value = '';
                if (window.efToast) efToast('🔐 Chave mestra alterada com sucesso!');
                setTimeout(() => {
                    renderizarModalCriptografia();
                }, 1200);
            } catch (e) {
                console.error(e);
                if (st) { st.textContent = '❌ Erro ao alterar chave: ' + e.message; st.style.color = '#dc2626'; }
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = '🔐 Atualizar Chave Mestra'; }
            }
        }

        async function executarResetarRemoverSenha() {
            if (!confirm('⚠️ Tem certeza que deseja RESETAR A SENHA e desativar o cofre criptografado?\n\nTodos os registros salvos neste navegador serão descriptografados e mantidos no modo aberto padrão (sem senha).')) {
                return;
            }
            const btn = document.getElementById('ef-btn-resetar-senha');
            if (btn) { btn.disabled = true; btn.textContent = 'Descriptografando...'; }
            try {
                await EF_Security.removerSenha();
                if (window.efToast) efToast('🔓 Senha resetada e cofre desativado com sucesso.');
                else alert('✅ Senha resetada com sucesso! Os dados foram descriptografados e salvos no modo padrão sem senha.');
                fecharConfiguracaoCriptografia();
            } catch (e) {
                console.error(e);
                alert('Erro ao resetar senha: ' + e.message);
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = '⚠️ Resetar Senha / Desativar Cofre'; }
            }
        }

        async function desbloquearPeloModal() {
            const pass = document.getElementById('ef-security-pass-unlock')?.value || '';
            const st = document.getElementById('ef-security-status');
            if (!pass) {
                if (st) { st.textContent = 'Digite a chave mestra.'; st.style.color = '#dc2626'; }
                return;
            }
            const ok = await EF_Security.unlock(pass);
            if (!ok) {
                if (st) { st.textContent = '❌ Chave mestra incorreta.'; st.style.color = '#dc2626'; }
                return;
            }
            if (window.efToast) efToast('🔓 Cofre desbloqueado com sucesso!');
            await carregarAvaliacoesDoDB();
            renderizarModalCriptografia();
        }

        function bloquearCofreEFechar() {
            fecharConfiguracaoCriptografia();
            bloquearCofre();
        }

        function bloquearCofre() {
            if (!EF_Security.isConfigured()) return;
            EF_Security.lock();
            avaliacoes = [];
            window.avaliacoes = avaliacoes;
            if (window.__EF63_STATE__) window.__EF63_STATE__.touch();
            atualizarContadorHistorico();
            preencherSeletoresComparacao();
            renderizarHistorico();
            if (typeof fecharModalDetalhes === 'function') fecharModalDetalhes();
            if (typeof fecharVisualizacaoPacienteWeb === 'function') fecharVisualizacaoPacienteWeb();
            if (typeof fecharModalLaudoWeb === 'function') fecharModalLaudoWeb();
            if (typeof fecharConfiguracaoCriptografia === 'function') fecharConfiguracaoCriptografia();
            if (typeof resetFormulario === 'function') resetFormulario();
            if (window.efToast) efToast('🔒 Cofre bloqueado com sucesso.');
            else alert('🔒 Cofre bloqueado. Digite a chave mestra para acessar novamente.');
        }

        window.abrirConfiguracaoCriptografia = abrirConfiguracaoCriptografia;
        window.fecharConfiguracaoCriptografia = fecharConfiguracaoCriptografia;
        window.renderizarModalCriptografia = renderizarModalCriptografia;
        window.ativarOuAlterarCriptografia = ativarOuAlterarCriptografia;
        window.executarAlterarChaveMestra = executarAlterarChaveMestra;
        window.executarResetarRemoverSenha = executarResetarRemoverSenha;
        window.desbloquearPeloModal = desbloquearPeloModal;
        window.bloquearCofreEFechar = bloquearCofreEFechar;
        window.bloquearCofre = bloquearCofre;
        window.abrirConfiguracaoCriptografia = abrirConfiguracaoCriptografia;
        window.fecharConfiguracaoCriptografia = fecharConfiguracaoCriptografia;
        window.renderizarModalCriptografia = renderizarModalCriptografia;
        window.ativarOuAlterarCriptografia = ativarOuAlterarCriptografia;
        window.executarAlterarChaveMestra = executarAlterarChaveMestra;
        window.executarResetarRemoverSenha = executarResetarRemoverSenha;
        window.desbloquearPeloModal = desbloquearPeloModal;
        window.bloquearCofreEFechar = bloquearCofreEFechar;

        const DB_NAME = 'EvoluFisicoDB';
        const DB_VERSION = 2;
        const STORE_NAME = 'avaliacoes';
        const STORAGE_KEY = 'evolufisico_v3_db';
        const AUTOSAVE_KEY = 'evolufisico_autosave_draft';

        let db = null;
        let avaliacoes = [];
        let fotosTemporariasBlob = { frente: null, perfil_direito: null, perfil_esquerdo: null, costas: null, extra: null };
        let urlsPreviewTemporarias = { frente: null, perfil_direito: null, perfil_esquerdo: null, costas: null, extra: null };
        let fotosTemporarias = { frente: '', perfil_direito: '', perfil_esquerdo: '', costas: '', extra: '', lado: '' };
        let pastaHandle = null;
        let avaliacaoEmVisualizacaoId = null;
        let editarAvaliacao = function(id) { if (typeof window.editarAvaliacao === 'function') return window.editarAvaliacao(id); };
        let autoSaveTimeout = null;

        window.__EF63_STATE__ = window.__EF63_STATE__ || { version: 0 };
        window.__EF63_STATE__.getAvaliacoes = function(){ return (typeof avaliacoes !== 'undefined' ? avaliacoes : window.avaliacoes) || []; };
        window.__EF63_STATE__.touch = function(){ this.version++; };

        function encontrarAvaliacaoPorId(id) {
            if (id === null || id === undefined || id === '') return null;
            const strId = String(id);
            const lista = (typeof avaliacoes !== 'undefined' && Array.isArray(avaliacoes) && avaliacoes.length > 0)
                ? avaliacoes
                : ((window.avaliacoes && Array.isArray(window.avaliacoes) && window.avaliacoes.length > 0)
                    ? window.avaliacoes
                    : (window.__EF63_STATE__ && typeof window.__EF63_STATE__.getAvaliacoes === 'function'
                        ? (window.__EF63_STATE__.getAvaliacoes() || [])
                        : []));

            let found = lista.find(a => a && (a.id === id || String(a.id) === strId));
            if (found) return found;

            if (typeof idSeguro === 'function') {
                const segId = idSeguro(strId);
                found = lista.find(a => a && a.id != null && (
                    idSeguro(a.id) === strId ||
                    String(a.id) === segId ||
                    idSeguro(a.id) === segId
                ));
                if (found) return found;
            }
            return null;
        }
        window.encontrarAvaliacaoPorId = encontrarAvaliacaoPorId;

        function gerarIdSeguro() {
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                return 'eval_' + crypto.randomUUID();
            }
            return 'eval_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
        }

        async function initDB() {
            if (window.indexedDB) {
                db = await new Promise(resolve => {
                    let request;
                    try { request=indexedDB.open(DB_NAME,DB_VERSION); } catch(e){resolve(null);return;}
                    request.onupgradeneeded=e=>{const database=e.target.result;if(!database.objectStoreNames.contains(STORE_NAME)){const store=database.createObjectStore(STORE_NAME,{keyPath:'id'});store.createIndex('data_avaliacao','data_avaliacao',{unique:false});store.createIndex('nome','nome',{unique:false});}};
                    request.onerror=()=>resolve(null);
                    request.onsuccess=()=>resolve(request.result);
                    request.onblocked=()=>{if(window.efToast)efToast('Feche outras abas para liberar o banco local.','warn')};
                });
            }
            await migrarLocalStorageParaIndexedDB();
            await carregarAvaliacoesDoDB();
            return db;
        }
        async function carregarAvaliacoesDoDB() {
            let rows;
            if(db) rows=await new Promise((resolve,reject)=>{const tx=db.transaction([STORE_NAME],'readonly');const req=tx.objectStore(STORE_NAME).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error);});
            else rows=await EF_Security.loadVaultArray();
            const out=[];let migrated=false;
            for(const row of rows||[]){const item=row&&row.__efEncrypted?await EF_Security.decryptObject(row.payload):row;if(!item)continue; migrated ||= !item.cliente_id;out.push(item);}
            out.forEach(a=>EFIdentity.ensure(a,out));out.sort(cmpAval);
            if(migrated){
                if(db){const encrypted=[];for(const item of out)encrypted.push(EF_Security.enabled?{id:item.id,__efEncrypted:true,payload:await EF_Security.encryptObject(item)}:item);await EF_Security._idbSubstituirTudo(encrypted);}
                else await EF_Security.saveVaultArray(out);
            }
            avaliacoes=out;window.avaliacoes=out;
            if(window.__EF63_STATE__)window.__EF63_STATE__.touch();
            atualizarContadorHistorico();preencherSeletoresComparacao();renderizarHistorico();
            return out;
        }

        async function salvarAvaliacaoNoDB(registro) {
            if (EF_Security.isConfigured() && !EF_Security.key) {
                const pass = prompt('🔐 O cofre está protegido. Digite a chave mestra para salvar a avaliação de forma criptografada:');
                if (!pass || !(await EF_Security.unlock(pass))) {
                    throw new Error('Operação cancelada: a avaliação não pode ser gravada sem a chave mestra ativa.');
                }
            }
            const clientChoice = document.getElementById('ef-client-identity');
            if (registro.__fromForm && clientChoice && clientChoice.dataset.changed === '1') {
                if (clientChoice.value === 'new') registro.cliente_id = 'client_' + (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8));
                else if (clientChoice.value !== 'auto') registro.cliente_id = clientChoice.value;
            }
            delete registro.__fromForm;
            EFIdentity.ensure(registro, avaliacoes);
            registro = sanitizarRegistro(registro);
            let registroPersistido = registro;
            if (EF_Security.enabled && EF_Security.key) {
                registroPersistido = { id: registro.id, __efEncrypted: true, payload: await EF_Security.encryptObject(registro) };
            }
            const nova = avaliacoes.filter(a => a.id !== registro.id).concat(registro).sort(cmpAval);
            if (db) {
                try {
                    await new Promise((resolve, reject) => {
                        const tx = db.transaction([STORE_NAME], 'readwrite');
                        tx.objectStore(STORE_NAME).put(registroPersistido);
                        tx.oncomplete = resolve;
                        tx.onabort = () => reject(tx.error || new Error('Gravação abortada'));
                        tx.onerror = () => {}; // onabort rejects once, after rollback
                    });
                } catch (error) {
                    // Do not silently switch authority from IndexedDB to a stale copy.
                    throw new Error('Avaliação não salva. Tente novamente ou exporte um backup. ' + error.message);
                }
            } else {
                await EF_Security.saveVaultArray(nova);
            }
            avaliacoes = nova;
            window.avaliacoes = avaliacoes;
            if (window.__EF63_STATE__) window.__EF63_STATE__.touch();
            atualizarContadorHistorico();
            preencherSeletoresComparacao();
            agendarRenderHistorico();
            return registro.id;
        }

        async function deletarAvaliacaoDoDB(id) {
            const target = encontrarAvaliacaoPorId(id);
            if (!target) return;
            const nova = avaliacoes.filter(a => a.id !== target.id).map(a => {
                const out = structuredClone(a);
                if (out.parecer_comparativo) delete out.parecer_comparativo[target.id];
                return out;
            });
            if (db) {
                const rows=[];
                for (const item of nova) rows.push(EF_Security.enabled ? {id:item.id,__efEncrypted:true,payload:await EF_Security.encryptObject(item)} : item);
                await EF_Security._idbSubstituirTudo(rows);
            } else await EF_Security.saveVaultArray(nova);
            avaliacoes = nova; window.avaliacoes = nova;
            if (window.__EF63_STATE__) window.__EF63_STATE__.touch();
            atualizarContadorHistorico(); preencherSeletoresComparacao(); renderizarHistorico();
        }

        async function migrarLocalStorageParaIndexedDB() {
            if(!db)return;
            const raw=localStorage.getItem(STORAGE_KEY);
            if(!raw)return;
            const list=JSON.parse(raw);if(!Array.isArray(list))throw new Error('Dados legados inválidos. Exporte o arquivo antes de continuar.');
            const present=await new Promise((resolve,reject)=>{const req=db.transaction([STORE_NAME],'readonly').objectStore(STORE_NAME).getAllKeys();req.onsuccess=()=>resolve(new Set(req.result.map(String)));req.onerror=()=>reject(req.error);});
            const rows=[];
            for(const item of list){if(present.has(String(item.id)))continue;const record=sanitizarRegistro(item);if(!record.id)record.id=gerarIdSeguro();EFIdentity.ensure(record,list);rows.push(EF_Security.enabled?{id:record.id,__efEncrypted:true,payload:await EF_Security.encryptObject(record)}:record);}
            await new Promise((resolve,reject)=>{const tx=db.transaction([STORE_NAME],'readwrite');const store=tx.objectStore(STORE_NAME);for(const row of rows)store.put(row);tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error||new Error('Migração abortada'));});
            localStorage.removeItem(STORAGE_KEY);
        }

        const _iniciarAppPrincipal = async () => {
            const cofreOk = await EF_Security.inicializar();
            if (!cofreOk) {
                document.body.innerHTML = '<div style="min-height:100vh;display:grid;place-items:center;font-family:system-ui;padding:2rem;text-align:center"><div><h2>🔒 EvoluFísico bloqueado</h2><p>Recarregue a página e informe a chave mestra para acessar os dados.</p></div></div>';
                return;
            }
            configurarWizardForm();
            try { await initDB(); }
            catch(e) { console.error(e);alert('Não foi possível abrir os dados: '+e.message+'. Nenhum registro foi descartado.');return; }
            definirDataPadrao();
            if (typeof inicializarBeforeAfterSlider === 'function') inicializarBeforeAfterSlider();
            verificarSuporteFileSystem();
            iniciarAutoSave();
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', _iniciarAppPrincipal);
        } else {
            _iniciarAppPrincipal();
        }

        
        // ===== PERSISTÊNCIA E RESTAURAÇÃO DA PASTA LOCAL NO INDEXEDDB =====
        const FS_DB_NAME = 'EvoluFisico_FS_DB';
        const FS_STORE_NAME = 'settings';

        function getFSDatabase() {
            return new Promise(function(resolve) {
                if (!window.indexedDB) return resolve(null);
                var req = indexedDB.open(FS_DB_NAME, 1);
                req.onupgradeneeded = function(e) {
                    var d = e.target.result;
                    if (!d.objectStoreNames.contains(FS_STORE_NAME)) {
                        d.createObjectStore(FS_STORE_NAME);
                    }
                };
                req.onsuccess = function() { resolve(req.result); };
                req.onerror = function() {
                    console.warn('[FS] Erro ao abrir IndexedDB para pasta local:', req.error);
                    resolve(null);
                };
            });
        }

        async function salvarPastaHandleNoIDB(handle) {
            try {
                var d = await getFSDatabase();
                if (!d) return false;
                var tx = d.transaction(FS_STORE_NAME, 'readwrite');
                tx.objectStore(FS_STORE_NAME).put(handle, 'pasta_banco');
                return new Promise(function(res) {
                    tx.oncomplete = function() { res(true); };
                    tx.onerror = function() { res(false); };
                });
            } catch(e) {
                console.warn('[FS] Erro ao salvar handle no IDB:', e);
                return false;
            }
        }

        async function obterPastaHandleDoIDB() {
            try {
                var d = await getFSDatabase();
                if (!d) return null;
                var tx = d.transaction(FS_STORE_NAME, 'readonly');
                var req = tx.objectStore(FS_STORE_NAME).get('pasta_banco');
                return new Promise(function(res) {
                    req.onsuccess = function() { res(req.result || null); };
                    req.onerror = function() { res(null); };
                });
            } catch(e) {
                console.warn('[FS] Erro ao ler handle do IDB:', e);
                return null;
            }
        }

        async function removerPastaHandleDoIDB() {
            try {
                var d = await getFSDatabase();
                if (!d) return false;
                var tx = d.transaction(FS_STORE_NAME, 'readwrite');
                tx.objectStore(FS_STORE_NAME).delete('pasta_banco');
                return new Promise(function(res) {
                    tx.oncomplete = function() { res(true); };
                    tx.onerror = function() { res(false); };
                });
            } catch(e) {
                return false;
            }
        }

        function atualizarUIPastaConectada(nomePasta) {
            var pill = document.getElementById('folder-status-pill');
            var dot = document.getElementById('folder-dot');
            var txt = document.getElementById('folder-status-text');
            if (pill) {
                pill.classList.remove('pending');
                pill.classList.add('connected');
                pill.title = 'Pasta vinculada: "' + nomePasta + '". Clique para sincronizar ou gerenciar.';
            }
            if (dot) {
                dot.className = 'folder-dot connected';
            }
            if (txt) {
                txt.textContent = '📁 ' + nomePasta;
            }
        }

        function atualizarUIPastaPendente(nomePasta) {
            var pill = document.getElementById('folder-status-pill');
            var dot = document.getElementById('folder-dot');
            var txt = document.getElementById('folder-status-text');
            if (pill) {
                pill.classList.remove('connected');
                pill.classList.add('pending');
                pill.title = 'Pasta vinculada: "' + nomePasta + '" (permissão pausada). Clique 1x para reativar.';
            }
            if (dot) {
                dot.className = 'folder-dot pending';
            }
            if (txt) {
                txt.textContent = '📁 Reconectar: ' + nomePasta;
            }
        }

        function atualizarUIPastaDesconectada() {
            var pill = document.getElementById('folder-status-pill');
            var dot = document.getElementById('folder-dot');
            var txt = document.getElementById('folder-status-text');
            if (pill) {
                pill.classList.remove('connected', 'pending');
                pill.title = 'Conectar pasta local para salvar em subpastas no disco';
            }
            if (dot) {
                dot.className = 'folder-dot';
            }
            if (txt) {
                txt.textContent = '📁 Conectar Pasta Local';
            }
        }

        async function sincronizarArquivosDaPasta(handle, exibirAlerta) {
            var importados = 0;
            try {
                for await (var entry of handle.values()) {
                    if (entry.kind === 'directory') {
                        try {
                            var subDir = await handle.getDirectoryHandle(entry.name);
                            for await (var subEntry of subDir.values()) {
                                if (subEntry.kind === 'file' && (subEntry.name.endsWith('.json') || subEntry.name.endsWith('.efx'))) {
                                    var file = await subEntry.getFile();
                                    var rawText = await file.text();
                                    if (subEntry.name.endsWith('.efx')) {
                                        try {
                                            var dec = await EF_Security.decryptImportedText(rawText);
                                            rawText = dec.text;
                                        } catch (e) { console.warn('Erro ao decodificar .efx na pasta:', e); continue; }
                                    }
                                    var rawObj = JSON.parse(rawText);
                                    var obj = sanitizarRegistro(rawObj);
                                    if (obj && obj.id && !avaliacoes.some(function(a) { return a.id === obj.id; })) {
                                        avaliacoes.push(obj);
                                        importados++;
                                    }
                                }
                            }
                        } catch (e) { console.warn('Erro lendo subpasta:', entry.name, e); }
                    } else if (entry.kind === 'file' && entry.name.endsWith('.json')) {
                        try {
                            var f = await entry.getFile();
                            var t = await f.text();
                            var r = JSON.parse(t);
                            var o = sanitizarRegistro(r);
                            if (o && o.id && !avaliacoes.some(function(a) { return a.id === o.id; })) {
                                avaliacoes.push(o);
                                importados++;
                            }
                        } catch (e) { console.warn('Erro lendo arquivo:', entry.name, e); }
                    }
                }

                if (importados > 0) {
                    avaliacoes.sort(function(a, b) { return new Date(a.data_avaliacao) - new Date(b.data_avaliacao); });
                    if (window.__EF63_STATE__) window.__EF63_STATE__.touch();
                    salvarNoLocalStorage();
                    renderizarHistorico();
                    preencherSeletoresComparacao();
                    if (exibirAlerta) {
                        if (typeof window.efToast === 'function') {
                            window.efToast('📁 Pasta sincronizada: +' + importados + ' avaliações lidas!', 'success');
                        } else {
                            alert('Pasta conectada com sucesso! ' + importados + ' avaliações lidas da pasta.');
                        }
                    }
                } else if (exibirAlerta) {
                    if (typeof window.efToast === 'function') {
                        window.efToast('📁 Pasta "' + handle.name + '" ativa e sincronizada!', 'info');
                    } else {
                        alert('Pasta "' + handle.name + '" vinculada! Para cada nova avaliação, o app criará uma subpasta própria no disco.');
                    }
                }
            } catch(err) {
                console.warn('[FS] Erro ao sincronizar arquivos:', err);
            }
        }

        async function restaurarPastaBancoAutomatico() {
            if (!('showDirectoryPicker' in window)) return;
            try {
                var savedHandle = await obterPastaHandleDoIDB();
                if (!savedHandle) return;

                var perm = await savedHandle.queryPermission({ mode: 'readwrite' });
                if (perm === 'granted') {
                    pastaHandle = savedHandle;
                    atualizarUIPastaConectada(pastaHandle.name);
                    console.log('[FS] Pasta local restaurada automaticamente:', pastaHandle.name);
                    await sincronizarArquivosDaPasta(pastaHandle, false);
                } else {
                    atualizarUIPastaPendente(savedHandle.name);
                    console.log('[FS] Pasta vinculada memorizada:', savedHandle.name, '(requer 1 clique para reativar)');
                }
            } catch(e) {
                console.warn('[FS] Falha ao restaurar pasta do IndexedDB:', e);
            }
        }

        async function verificarSuporteFileSystem() {
            var pill = document.getElementById('folder-status-pill');
            var txt = document.getElementById('folder-status-text');
            if ('showDirectoryPicker' in window) {
                txt.textContent = '📁 Conectar Pasta Local';
                await restaurarPastaBancoAutomatico();
            } else {
                txt.textContent = '💾 Banco Navegador';
                if (pill) pill.title = 'Este navegador não suporta File System Access API. Os dados são salvos no IndexedDB interno.';
            }
        }

        async function conectarPastaBanco() {
            if (!('showDirectoryPicker' in window)) {
                alert('Seu navegador não suporta a API de Acesso a Pastas diretamente. O aplicativo salvará os dados no navegador.');
                return;
            }

            try {
                var savedHandle = await obterPastaHandleDoIDB();

                // 1. Se a pasta já está conectada e ativa no momento
                if (pastaHandle) {
                    try {
                        var perm = await pastaHandle.queryPermission({ mode: 'readwrite' });
                        if (perm === 'granted') {
                            var msgAcao = '📁 Pasta vinculada atualmente:\\n"' + pastaHandle.name + '"\\n\\n' +
                                          '• Clique [OK] para SINCRONIZAR os arquivos da pasta agora.\\n' +
                                          '• Clique [CANCELAR] para TROCAR de pasta ou DESCONECTAR.';
                            var acao = confirm(msgAcao);
                            if (acao) {
                                await sincronizarArquivosDaPasta(pastaHandle, true);
                                return;
                            } else {
                                var msgTroca = 'O que você deseja fazer?\\n\\n' +
                                               '• Clique [OK] para ESCOLHER UMA NOVA PASTA.\\n' +
                                               '• Clique [CANCELAR] para DESCONECTAR a pasta atual e usar apenas o banco interno.';
                                var trocar = confirm(msgTroca);
                                if (trocar) {
                                    // Escolher nova pasta
                                } else {
                                    await removerPastaHandleDoIDB();
                                    pastaHandle = null;
                                    atualizarUIPastaDesconectada();
                                    if (typeof window.efToast === 'function') {
                                        window.efToast('📁 Pasta local desconectada.', 'info');
                                    }
                                    return;
                                }
                            }
                        }
                    } catch(e) {}
                }

                // 2. Se tínhamos uma pasta memorizada no IndexedDB aguardando reativação de permissão
                if (savedHandle) {
                    try {
                        var reqPerm = await savedHandle.requestPermission({ mode: 'readwrite' });
                        if (reqPerm === 'granted') {
                            pastaHandle = savedHandle;
                            atualizarUIPastaConectada(pastaHandle.name);
                            await sincronizarArquivosDaPasta(pastaHandle, true);
                            return;
                        }
                    } catch(e) {
                        console.warn('[FS] Erro ao re-solicitar permissão:', e);
                    }
                }

                // 3. Selecionar uma nova pasta local no computador
                pastaHandle = await window.showDirectoryPicker({
                    mode: 'readwrite',
                    startIn: 'documents'
                });

                await salvarPastaHandleNoIDB(pastaHandle);
                atualizarUIPastaConectada(pastaHandle.name);
                await sincronizarArquivosDaPasta(pastaHandle, true);

            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Erro ao conectar pasta:', err);
                    alert('Não foi possível conectar a pasta: ' + err.message);
                }
            }
        }

        // Exportação global explícita para evitar qualquer falha de escopo
        window.conectarPastaBanco = conectarPastaBanco;
        window.verificarSuporteFileSystem = verificarSuporteFileSystem;
        window.salvarPastaHandleNoIDB = salvarPastaHandleNoIDB;
        window.obterPastaHandleDoIDB = obterPastaHandleDoIDB;
        window.removerPastaHandleDoIDB = removerPastaHandleDoIDB;


        function base64ToBlob(dataUrl) {
            try {
                const parts = dataUrl.split(';base64,');
                const contentType = parts[0].split(':')[1];
                const raw = window.atob(parts[1]);
                const rawLength = raw.length;
                const uInt8Array = new Uint8Array(rawLength);
                for (let i = 0; i < rawLength; ++i) {
                    uInt8Array[i] = raw.charCodeAt(i);
                }
                return new Blob([uInt8Array], { type: contentType });
            } catch (e) {
                return null;
            }
        }

        async function gravarAvaliacaoEmSubpasta(registro) {
            if (!pastaHandle) {
                try {
                    var saved = await obterPastaHandleDoIDB();
                    if (saved && (await saved.queryPermission({ mode: 'readwrite' })) === 'granted') {
                        pastaHandle = saved;
                        atualizarUIPastaConectada(pastaHandle.name);
                    }
                } catch(e) {}
            }
            if (!pastaHandle) return false;
            try {
                const nomeSeguro = (registro.nome || 'aluno').toLowerCase().replace(/[^a-z0-9]/g, '_');
                const semanaSegura = (registro.checkin_semana || 'checkin').toLowerCase().replace(/[^a-z0-9]/g, '_');
                const pastaNome = `${nomeSeguro}_${registro.data_avaliacao}_${semanaSegura}`;

                const subDir = await pastaHandle.getDirectoryHandle(pastaNome, { create: true });
                const dadosNome = EF_Security.enabled && EF_Security.key ? 'dados_avaliacao.efx' : 'dados_avaliacao.json';
                const fileHandle = await subDir.getFileHandle(dadosNome, { create: true });
                const writable = await fileHandle.createWritable();
                if (EF_Security.enabled && EF_Security.key) {
                    await writable.write(JSON.stringify({app:'EvoluFísico',security:'AES-256-GCM',version:1,encrypted:true,originalName:'dados_avaliacao.json',mimeType:'application/json',createdAt:new Date().toISOString(),payload:await EF_Security.encryptText(JSON.stringify(registro,null,2))},null,2));
                } else {
                    await writable.write(JSON.stringify(registro, null, 2));
                }
                await writable.close();

                const posesParaSalvar = [
                    { chave: 'frente', nome: 'foto_frente' },
                    { chave: 'perfil_direito', alt: 'lado', nome: 'foto_perfil_direito' },
                    { chave: 'perfil_esquerdo', nome: 'foto_perfil_esquerdo' },
                    { chave: 'costas', nome: 'foto_costas' },
                    { chave: 'extra', nome: 'foto_extra' }
                ];
                for (const p of posesParaSalvar) {
                    const b64 = registro.fotos?.[p.chave] || (p.alt ? registro.fotos?.[p.alt] : null);
                    if (b64) {
                        const blob = base64ToBlob(b64);
                        if (blob) {
                            const encrypted = EF_Security.enabled && EF_Security.key;
                            const h = await subDir.getFileHandle(encrypted ? `${p.nome}.efx` : `${p.nome}.jpg`, { create: true });
                            const w = await h.createWritable();
                            if (encrypted) {
                                await w.write(JSON.stringify({
                                    app: 'EvoluFísico', security: 'AES-256-GCM', version: 1, encrypted: true,
                                    originalName: `${p.nome}.jpg`, mimeType: 'image/jpeg', createdAt: new Date().toISOString(),
                                    payload: await EF_Security.encryptBytes(await blob.arrayBuffer())
                                }, null, 2));
                            } else {
                                await w.write(blob);
                            }
                            await w.close();
                        }
                    }
                }

                const txtHandle = await subDir.getFileHandle(EF_Security.enabled && EF_Security.key ? 'resumo_laudo.efx' : 'resumo_laudo.txt', { create: true });
                const txtW = await txtHandle.createWritable();
                const resumo = `LAUDO DE AVALIAÇÃO FÍSICA - POLLOCK 1984
Aluno: ${registro.nome} | Data: ${registro.data_avaliacao} | Próxima: ${registro.data_proxima_avaliacao || '-'}
Peso: ${registro.peso} kg | Altura: ${registro.altura} cm | Idade: ${registro.idade} anos
Soma Perimetria: ${registro.perimetria_soma || '-'} cm | Soma Dobras: ${registro.dobras_resultado?.soma || '-'} mm
% Gordura Pollock: ${registro.dobras_resultado?.percGordura || '-'}% | Massa Magra: ${registro.dobras_resultado?.massaMagra || '-'} kg
IMC: ${registro.bioimpedancia?.imc || '-'} | RCQ: ${registro.bioimpedancia?.rcq || '-'}
Avaliador: ${registro.avaliador_nome} (${registro.avaliador_registro})
Parecer Técnico:
${registro.parecer_profissional || 'Sem observações.'}
Status do check-in: ${registro.parecer_v6?.status || '-'} | Score de aderência: ${registro.parecer_v6?.score ?? '-'}/100
Pontos fortes: ${registro.parecer_v6?.pontos_fortes || '-'}
Pontos de atenção: ${registro.parecer_v6?.pontos_atencao || '-'}
Próximos passos: ${registro.parecer_v6?.proximos_passos || '-'}`;
                if (EF_Security.enabled && EF_Security.key) await txtW.write(JSON.stringify({app:'EvoluFísico',security:'AES-256-GCM',version:1,encrypted:true,originalName:'resumo_laudo.txt',mimeType:'text/plain;charset=utf-8',createdAt:new Date().toISOString(),payload:await EF_Security.encryptText(resumo)},null,2));
                else await txtW.write(resumo);
                await txtW.close();

                return pastaNome;
            } catch (err) {
                console.error('Erro gravando na subpasta:', err);
                return false;
            }
        }

        let historicoRenderTimeout = null;
        function agendarRenderHistorico(delay = 80) {
            clearTimeout(historicoRenderTimeout);
            historicoRenderTimeout = setTimeout(() => {
                const executar = () => {
                    try { renderizarHistorico(); } catch (e) { console.warn('Falha ao renderizar histórico', e); }
                };
                if ('requestIdleCallback' in window) requestIdleCallback(executar, { timeout: 250 });
                else executar();
            }, delay);
        }

        async function salvarNoLocalStorage() {
            try {
                await EF_Security.saveVaultArray(avaliacoes);
            } catch (e) {
                console.warn('Falha ao proteger/salvar LocalStorage:', e);
                const msg = '⚠️ Atenção: Limite de armazenamento local atingido (LocalStorage cheio). Exporte um backup JSON agora para não perder dados das fotos!';
                if (window.efToast) efToast(msg, 'warn');
                else alert(msg);
                throw e;
            }
            atualizarContadorHistorico();
            preencherSeletoresComparacao();
            agendarRenderHistorico();
        }

        function definirDataPadrao() {
            const dataInput = document.getElementById('data_avaliacao');
            if (dataInput && !dataInput.value) {
                dataInput.value = hojeISO();
            }
            const proxInput = document.getElementById('data_proxima_avaliacao');
            if (proxInput && !proxInput.value) {
                proxInput.value = hojeISO(90);
            }
        }

        function atualizarContadorHistorico() {
            const el = document.getElementById('history-counter');
            const hCount = document.getElementById('history-header-count');
            const hCountList = document.getElementById('history-header-count-list');
            if (hCountList) hCountList.textContent = avaliacoes.length;
            if (el) el.textContent = avaliacoes.length;
            if (hCount) hCount.textContent = avaliacoes.length;
        }

        function sincronizarPesoBia(val) {
            const pesoInput = document.getElementById('peso');
            if (pesoInput && val && !pesoInput.value) {
                pesoInput.value = val;
            }
            recalcularCamposAutomaticos();
        }

        function switchTab(tabId) {
            document.querySelectorAll('.tab-panel').forEach(panel => {
                panel.classList.toggle('active', panel.id === tabId);
            });

            document.querySelectorAll('.nav-tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });

            if (tabId === 'tab-novo-checkin') {
                document.getElementById('tab-btn-form').classList.add('active');
            } else if (tabId === 'tab-historico') {
                document.getElementById('tab-btn-history').classList.add('active');
                renderizarHistorico();
            } else if (tabId === 'tab-comparison') {
                document.getElementById('tab-btn-compare').classList.add('active');
                preencherSeletoresComparacao();
                renderizarComparacao();
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function calcularPollock7(sexo, idade, peso, dobras) {
            if (sexo !== 'M' && sexo !== 'F') return null;
            dobras = Object.assign({}, dobras || {});
            ['triceps','subescapular','peitoral','axilar','suprailiaca','abdominal','coxa'].forEach(function(k){ dobras[k] = parseFloat(String(dobras[k]).replace(',', '.')) || 0; });
            idade = parseFloat(idade) || 0; peso = parseFloat(peso) || 0;
            const soma = (dobras.triceps || 0) + (dobras.subescapular || 0) + (dobras.peitoral || 0) +
                         (dobras.axilar || 0) + (dobras.suprailiaca || 0) + (dobras.abdominal || 0) + (dobras.coxa || 0);

            if (![dobras.triceps,dobras.subescapular,dobras.peitoral,dobras.axilar,dobras.suprailiaca,dobras.abdominal,dobras.coxa].every(v=>v>0) || !(idade>0) || !(peso>0)) return null;

            let densidade = 0;
            if (sexo === 'M') {
                densidade = 1.112 - (0.00043499 * soma) + (0.00000055 * Math.pow(soma, 2)) - (0.00028826 * idade);
            } else {
                densidade = 1.097 - (0.00046971 * soma) + (0.00000056 * Math.pow(soma, 2)) - (0.00012828 * idade);
            }

            let percGordura = ((4.95 / densidade) - 4.50) * 100;
            const limitado = (percGordura < 3 || percGordura > 60);
            percGordura = Math.max(3, Math.min(60, percGordura));

            const massaGorda = peso > 0 ? (peso * (percGordura / 100)) : 0;
            const massaMagra = peso > 0 ? (peso - massaGorda) : 0;

            let classificacao = 'Normal';
            if (sexo === 'M') {
                if (percGordura < 6) classificacao = 'Essencial / Muito Baixo';
                else if (percGordura <= 13) classificacao = 'Excelente (Atleta)';
                else if (percGordura <= 17) classificacao = 'Bom (Fitness)';
                else if (percGordura <= 24) classificacao = 'Médio / Aceitável';
                else classificacao = 'Elevado / Sobrepeso';
            } else {
                if (percGordura < 14) classificacao = 'Essencial / Muito Baixo';
                else if (percGordura <= 20) classificacao = 'Excelente (Atleta)';
                else if (percGordura <= 24) classificacao = 'Bom (Fitness)';
                else if (percGordura <= 31) classificacao = 'Médio / Aceitável';
                else classificacao = 'Elevado / Sobrepeso';
            }

            return {
                soma: soma.toFixed(1),
                densidade: densidade.toFixed(4),
                percGordura: percGordura.toFixed(1),
                massaGorda: massaGorda.toFixed(1),
                massaMagra: massaMagra.toFixed(1),
                classificacao: classificacao,
                limitado: limitado
            };
        }

        function recalcularCamposAutomaticos() {
            const sexo = document.getElementById('sexo').value;
            const idade = parseFloat(document.getElementById('idade').value) || 0;
            const alturaCm = parseFloat(document.getElementById('altura').value) || 0;
            const peso = parseFloat(document.getElementById('peso').value) || parseFloat(document.getElementById('bia_peso').value) || 0;

            const pescoco = parseFloat(document.getElementById('peri_pescoco').value) || 0;
            const ombros = parseFloat(document.getElementById('peri_ombros').value) || 0;
            const abdomen = parseFloat(document.getElementById('peri_abdomen').value) || 0;
            const cintura = parseFloat(document.getElementById('cintura').value) || 0;
            const quadril = parseFloat(document.getElementById('quadril').value) || 0;
            const bracoEsq = parseFloat(document.getElementById('braco_esq').value) || 0;
            const bracoDir = parseFloat(document.getElementById('braco_dir').value) || 0;
            const coxaEsq = parseFloat(document.getElementById('coxa_esq').value) || 0;
            const coxaDir = parseFloat(document.getElementById('coxa_dir').value) || 0;
            const panturrilha = parseFloat(document.getElementById('panturrilha').value) || 0;

            const somaPerimetria = pescoco + ombros + abdomen + cintura + quadril + bracoEsq + bracoDir + coxaEsq + coxaDir + panturrilha;
            document.getElementById('preview-soma-perimetria').textContent = `${somaPerimetria.toFixed(1)} cm`;

            if (alturaCm > 0) {
                const altM = alturaCm / 100;
                const pesoMinSaudavel = 20.0 * (altM * altM);
                const pesoMaxSaudavel = 24.9 * (altM * altM);
                const elFaixaPeso = document.getElementById('preview-faixa-peso-ideal');
                if (elFaixaPeso) {
                    elFaixaPeso.textContent = `${pesoMinSaudavel.toFixed(1)} a ${pesoMaxSaudavel.toFixed(1)} kg`;
                }
            }

            const imcInput = document.getElementById('bia_imc');
            if (peso > 0 && alturaCm > 0) {
                const alturaM = alturaCm / 100;
                const imcCalculado = peso / (alturaM * alturaM);
                if (imcInput.dataset.manual !== '1') {
                    imcInput.value = imcCalculado.toFixed(1);
                }
            }

            const rcqInput = document.getElementById('bia_rcq');
            const riscoSelect = document.getElementById('bia_risco');
            if (cintura > 0 && quadril > 0) {
                const rcq = cintura / quadril;
                rcqInput.value = rcq.toFixed(2);

                if (sexo === 'F') {
                    if (rcq <= 0.80) riscoSelect.value = 'Baixo Risco (Normal)';
                    else if (rcq <= 0.85) riscoSelect.value = 'Risco Moderado';
                    else riscoSelect.value = 'Risco Alto';
                } else {
                    if (rcq <= 0.90) riscoSelect.value = 'Baixo Risco (Normal)';
                    else if (rcq <= 0.95) riscoSelect.value = 'Risco Moderado';
                    else riscoSelect.value = 'Risco Alto';
                }
            }

            const dobras = {
                triceps: parseFloat(document.getElementById('dobra_triceps').value) || 0,
                subescapular: parseFloat(document.getElementById('dobra_subescapular').value) || 0,
                peitoral: parseFloat(document.getElementById('dobra_peitoral').value) || 0,
                axilar: parseFloat(document.getElementById('dobra_axilar').value) || 0,
                suprailiaca: parseFloat(document.getElementById('dobra_suprailiaca').value) || 0,
                abdominal: parseFloat(document.getElementById('dobra_abdominal').value) || 0,
                coxa: parseFloat(document.getElementById('dobra_coxa').value) || 0
            };

            const res = calcularPollock7(sexo, idade, peso, dobras);
            if (res) {
                document.getElementById('preview-soma-dobras').textContent = `${res.soma} mm`;
                document.getElementById('preview-gordura-dobras').textContent = `${res.percGordura}%` + (res.limitado ? ' ⚠' : '');
                document.getElementById('preview-gordura-dobras').title = res.limitado ? 'Valor fora da faixa 3–60% e limitado pela calculadora. Revise as dobras.' : '';
                document.getElementById('preview-mm-dobras').textContent = `${res.massaMagra} kg`;
                document.getElementById('preview-mg-dobras').textContent = `${res.massaGorda} kg`;

                const elLivePgordura = document.getElementById('live-kpi-pgordura');
                const elLiveClassificacao = document.getElementById('live-kpi-classificacao');
                const elLiveMassaMagra = document.getElementById('live-kpi-massa-magra');
                const elLiveMassaGorda = document.getElementById('live-kpi-massa-gorda');
                if (elLivePgordura) elLivePgordura.textContent = `${res.percGordura}%`;
                if (elLiveClassificacao) elLiveClassificacao.textContent = res.classificacao || 'Excelente';
                if (elLiveMassaMagra) elLiveMassaMagra.textContent = `${res.massaMagra} kg`;
                if (elLiveMassaGorda) elLiveMassaGorda.textContent = `Massa Gorda: ${res.massaGorda} kg`;
            } else {
                document.getElementById('preview-soma-dobras').textContent = '- mm';
                document.getElementById('preview-gordura-dobras').textContent = '-';
                document.getElementById('preview-mm-dobras').textContent = '- kg';
                document.getElementById('preview-mg-dobras').textContent = '- kg';
            }

            const elLiveSomatoTipo = document.getElementById('live-kpi-somato-tipo');
            const elLiveSomatoCoords = document.getElementById('live-kpi-somato-coords');
            const elLiveRcq = document.getElementById('live-kpi-rcq');
            const elLiveRcqRisco = document.getElementById('live-kpi-rcq-risco');

            if (elLiveSomatoTipo) elLiveSomatoTipo.textContent = '--';
            if (elLiveSomatoCoords) elLiveSomatoCoords.textContent = 'X: -- | Y: --';
            if (typeof CalculadoraSomatotipo !== 'undefined' && alturaCm > 0 && peso > 0 && dobras.triceps > 0 && dobras.subescapular > 0 && dobras.suprailiaca > 0 && bracoDir > 0 && panturrilha > 0) {
                const s = CalculadoraSomatotipo.calcular(
                    alturaCm, peso,
                    dobras.triceps || 8.5, dobras.subescapular || 23.0, dobras.suprailiaca || 24.0,
                    14.0, bracoDir || 40.0, panturrilha || 40.0
                );
                if (elLiveSomatoTipo) elLiveSomatoTipo.textContent = s.classificacao || '--';
                if (elLiveSomatoCoords) elLiveSomatoCoords.textContent = `X: ${s.x} | Y: ${s.y}`;
            }

            if (elLiveRcq) {
                const rcqVal = document.getElementById('bia_rcq')?.value;
                elLiveRcq.textContent = rcqVal || '--';
            }
            if (elLiveRcqRisco) {
                const riscoVal = document.getElementById('bia_risco')?.value;
                const imcVal = document.getElementById('bia_imc')?.value;
                elLiveRcqRisco.textContent = riscoVal ? `${riscoVal} (IMC: ${imcVal || '--'})` : (imcVal ? `IMC: ${imcVal}` : 'Risco: --');
            }
        }

        function recalcularKgGorduraAuto() {
            const peso = parseFloat(document.getElementById('bia_peso').value) || parseFloat(document.getElementById('peso').value) || 0;
            const pgord = parseFloat(document.getElementById('bia_pgordura').value) || 0;
            const kgGordInput = document.getElementById('bia_gordura_kg');
            if (peso > 0 && pgord > 0 && (!kgGordInput.value || parseFloat(kgGordInput.value) === 0)) {
                kgGordInput.value = ((peso * pgord) / 100).toFixed(1);
            }
        }

        function recalcularKgMusculoAuto() {
            const peso = parseFloat(document.getElementById('bia_peso').value) || parseFloat(document.getElementById('peso').value) || 0;
            const pmusc = parseFloat(document.getElementById('bia_pmusculo').value) || 0;
            const kgMuscInput = document.getElementById('bia_mme');
            if (peso > 0 && pmusc > 0 && (!kgMuscInput.value || parseFloat(kgMuscInput.value) === 0)) {
                kgMuscInput.value = ((peso * pmusc) / 100).toFixed(1);
            }
        }

        function previewAndCompressImage(fileInput, pose) {
            const file = fileInput.files[0];
            if (!file) return;

            const thumbImg = document.getElementById(`thumb-${pose}-img`);
            const thumbEmpty = document.getElementById(`thumb-${pose}-empty`);
            if (thumbEmpty) thumbEmpty.textContent = "Processando...";

            if ('createImageBitmap' in window) {
                createImageBitmap(file).then(imageBitmap => {
                    processarBitmap(imageBitmap, pose, thumbImg, thumbEmpty);
                }).catch(() => {
                    fallbackFileReader(file, pose, thumbImg, thumbEmpty);
                });
            } else {
                fallbackFileReader(file, pose, thumbImg, thumbEmpty);
            }
        }

        function processarBitmap(imageBitmap, pose, thumbImg, thumbEmpty) {
            const canvas = document.createElement('canvas');
            const maxDim = 950;
            let { width, height } = imageBitmap;

            if (width > height && width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
            } else if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', { alpha: false });
            ctx.drawImage(imageBitmap, 0, 0, width, height);
            if (imageBitmap && typeof imageBitmap.close === 'function') {
                try { imageBitmap.close(); } catch(e) {}
            }

            canvas.toBlob((blob) => {
                if (!blob) return;

                if (urlsPreviewTemporarias[pose]) {
                    URL.revokeObjectURL(urlsPreviewTemporarias[pose]);
                }

                fotosTemporariasBlob[pose] = blob;
                const objectURL = URL.createObjectURL(blob);
                urlsPreviewTemporarias[pose] = objectURL;

                if (thumbImg && thumbEmpty) {
                    thumbImg.src = objectURL;
                    thumbImg.classList.remove('hidden');
                    thumbEmpty.classList.add('hidden');
                }
            }, 'image/jpeg', 0.82);
        }

        function fallbackFileReader(file, pose, thumbImg, thumbEmpty) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    processarBitmap(img, pose, thumbImg, thumbEmpty);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }

        function blobToBase64(blob) {
            return new Promise((resolve) => {
                if (!blob) { resolve(null); return; }
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            });
        }

        function configurarWizardForm() {
            const form = document.getElementById('checkin-form');
            const steps = Array.from(document.querySelectorAll('.step'));
            const btnNext = document.getElementById('btn-next');
            const btnPrev = document.getElementById('btn-prev');
            const btnSubmit = document.getElementById('btn-submit');
            const progressFill = document.getElementById('progress-fill');
            const currentStepNum = document.getElementById('current-step-num');
            const stepNameLabel = document.getElementById('step-name');
            const formActions = document.getElementById('form-actions');
            const progressWrapper = document.getElementById('progress-wrapper');
            const formHeader = document.getElementById('form-header');
            const successScreen = document.getElementById('success-screen');

            let currentStepIndex = 0;

            function updateUI() {
                steps.forEach((step, index) => {
                    step.classList.toggle('active', index === currentStepIndex);
                });

                const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;
                if (progressFill) progressFill.style.width = `${progressPercentage}%`;
                if (currentStepNum) currentStepNum.textContent = currentStepIndex + 1;
                if (stepNameLabel && steps[currentStepIndex]) stepNameLabel.textContent = steps[currentStepIndex].getAttribute('data-name');

                const stepperFill = document.getElementById('stepper-progress-fill');
                if (stepperFill) stepperFill.style.width = `${progressPercentage}%`;

                const progressBadge = document.getElementById('wizard-progress-badge');
                if (progressBadge) progressBadge.textContent = `Etapa ${currentStepIndex + 1} de ${steps.length} • ${Math.round(progressPercentage)}%`;

                document.querySelectorAll('.step-indicator').forEach((ind, i) => {
                    ind.classList.toggle('active', i === currentStepIndex);
                    ind.classList.toggle('completed', i < currentStepIndex);
                    const dot = ind.querySelector('.step-dot');
                    if (dot) {
                        if (i < currentStepIndex) {
                            dot.innerHTML = '✓';
                        } else {
                            dot.innerHTML = String(i + 1);
                        }
                    }
                });

                btnPrev.classList.toggle('hidden', currentStepIndex === 0);

                if (currentStepIndex === steps.length - 1) {
                    btnNext.classList.add('hidden');
                    btnSubmit.classList.remove('hidden');
                } else {
                    btnNext.classList.remove('hidden');
                    btnSubmit.classList.add('hidden');
                }

                if (window.__efWizardReady) window.scrollTo({ top: document.querySelector('.form-container').offsetTop - 20, behavior: 'smooth' });
            }

            function validarEtapa(idx) {
                const inputs = steps[idx].querySelectorAll('input, select, textarea');
                for (const input of inputs) {
                    if (!input.checkValidity()) return input;
                }
                return null;
            }

            function validateCurrentStep() {
                const bad = validarEtapa(currentStepIndex);
                if (bad) { bad.reportValidity(); return false; }
                return true;
            }

            function primeiraEtapaInvalida(ate) {
                for (let i = 0; i < ate; i++) { if (validarEtapa(i)) return i; }
                return -1;
            }

            function bloquearEmEtapaInvalida(idx) {
                currentStepIndex = idx;
                updateUI();
                validateCurrentStep();
                if (window.efToast) efToast('Preencha os campos obrigatórios da etapa ' + (idx + 1) + ' para continuar.', 'warn');
            }

            window.irParaEtapa = function(targetIdx) {
                if (!(targetIdx >= 0 && targetIdx < steps.length)) return;
                if (targetIdx > currentStepIndex) {
                    const bloqueada = primeiraEtapaInvalida(targetIdx);
                    if (bloqueada !== -1) { bloquearEmEtapaInvalida(bloqueada); return; }
                }
                currentStepIndex = targetIdx;
                updateUI();
            };

            btnNext.addEventListener('click', () => {
                if (validateCurrentStep()) {
                    currentStepIndex++;
                    updateUI();
                }
            });

            btnPrev.addEventListener('click', () => {
                currentStepIndex--;
                updateUI();
            });

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const etapaInvalida = primeiraEtapaInvalida(steps.length);
                if (etapaInvalida !== -1) { bloquearEmEtapaInvalida(etapaInvalida); return; }

                const btnSubmit = document.getElementById('btn-submit');
                btnSubmit.disabled = true;
                btnSubmit.textContent = "Processando...";

                try {
                    const formData = new FormData(form);
                    const idExistente = document.getElementById('avaliacao_id').value;

                    const getNum = (key) => {
                        const v = formData.get(key);
                        if (v === null || v === undefined || v === '') return null;
                        const parsed = parseFloat(String(v).replace(',', '.'));
                        return isNaN(parsed) ? null : parsed;
                    };
                    const getInt = (key) => {
                        const v = formData.get(key);
                        if (v === null || v === undefined || v === '') return null;
                        const parsed = parseInt(String(v), 10);
                        return isNaN(parsed) ? null : parsed;
                    };

                    const pesoGeral = getNum('peso') || getNum('bia_peso') || null;
                    const sexo = formData.get('sexo') || 'M';
                    const idade = getNum('idade');
                    const altura = getNum('altura');
                    if (!(idade > 0)) { (window.efToast || window.alert)('Informe a idade do aluno: ela é necessária para calcular o % de gordura (Pollock).', 'warn'); return; }
                    if (idade < 18 || idade > 80) { (window.efToast || window.alert)('Atenção: a equação de Pollock é validada para adultos (18–80 anos). Interprete o %G com cautela.', 'warn'); }

                    const perimetria = {
                        pescoco: getNum('peri_pescoco'),
                        ombros: getNum('peri_ombros'),
                        abdomen: getNum('peri_abdomen'),
                        cintura: getNum('cintura'),
                        quadril: getNum('quadril'),
                        braco_esq: getNum('braco_esq'),
                        braco_dir: getNum('braco_dir'),
                        coxa_esq: getNum('coxa_esq'),
                        coxa_dir: getNum('coxa_dir'),
                        panturrilha: getNum('panturrilha')
                    };
                    const valsPeri = Object.values(perimetria).filter(v => typeof v === 'number' && v > 0);
                    const somaPeri = valsPeri.length > 0 ? valsPeri.reduce((a, b) => a + b, 0).toFixed(1) : null;

                    const dobras = {
                        triceps: getNum('dobra_triceps'),
                        subescapular: getNum('dobra_subescapular'),
                        peitoral: getNum('dobra_peitoral'),
                        axilar: getNum('dobra_axilar'),
                        suprailiaca: getNum('dobra_suprailiaca'),
                        abdominal: getNum('dobra_abdominal'),
                        coxa: getNum('dobra_coxa')
                    };
                    const resultadoDobras = calcularPollock7(sexo, idade, pesoGeral, dobras);
                    if (resultadoDobras) {
                        if (resultadoDobras.limitado) {
                            (window.efToast || window.alert)('Atenção: o %G calculado ficou fora de 3–60% e foi limitado. Revise as dobras medidas.', 'warn');
                        }
                        if (parseFloat(resultadoDobras.soma) > 280) {
                            (window.efToast || window.alert)('Aviso clínico: A soma das 7 dobras cutâneas ultrapassa 280 mm. Em adiposidades elevadas, o modelo quadrático de Pollock perde acurácia devido à compressibilidade tecidual; recomenda-se correlacionar com a Bioimpedância.', 'warn');
                        }
                    }

                    const bioimpedancia = {
                        peso: getNum('bia_peso') || pesoGeral,
                        pgordura: getNum('bia_pgordura'),
                        pmusculo: getNum('bia_pmusculo'),
                        imc: getNum('bia_imc'),
                        gordura_kg: getNum('bia_gordura_kg'),
                        mme: getNum('bia_mme'),
                        risco: formData.get('bia_risco') || 'Baixo Risco (Normal)',
                        rcq: getNum('bia_rcq'),
                        tmb: getInt('bia_tmb'),
                        visceral: getInt('bia_visceral'),
                        idade_corporal: getInt('bia_idade_corporal'),
                        analise_texto: formData.get('bia_analise_texto') || ''
                    };

                    const registro = {
                        __fromForm: true,
                        id: idExistente || gerarIdSeguro(),
                        timestamp: new Date().toISOString(),
                        nome: formData.get('nome').trim(),
                        email: formData.get('email').trim().toLowerCase(),
                        whatsapp: formData.get('whatsapp').trim(),
                        sexo: sexo,
                        idade: idade,
                        altura: altura,
                        data_avaliacao: formData.get('data_avaliacao') || hojeISO(),
                        data_proxima_avaliacao: formData.get('data_proxima_avaliacao') || '',
                        checkin_semana: formData.get('checkin_semana'),
                        fase: formData.get('fase'),
                        avaliador_clinica: (formData.get('avaliador_clinica') || '').trim(),
                        avaliador_nome: (formData.get('avaliador_nome') || '').trim(),
                        avaliador_registro: (formData.get('avaliador_registro') || '').trim(),
                        
                        peso: pesoGeral,
                        perimetria: perimetria,
                        perimetria_soma: somaPeri.toFixed(1),
                        
                        dobras: dobras,
                        dobras_resultado: resultadoDobras,
                        bioimpedancia: bioimpedancia,

                        cintura: perimetria.cintura,
                        quadril: perimetria.quadril,
                        braco_dir: perimetria.braco_dir,
                        braco_esq: perimetria.braco_esq,
                        coxa_dir: perimetria.coxa_dir,
                        coxa_esq: perimetria.coxa_esq,
                        panturrilha: perimetria.panturrilha,

                        energia: parseInt(formData.get('energia')) || 3,
                        aderencia_treino: formData.get('aderencia_treino'),
                        aderencia_dieta: formData.get('aderencia_dieta'),
                        desafio: formData.get('desafio') || 'Sim',
                        observacoes: formData.get('observacoes') || '',
                        parecer_profissional: formData.get('parecer_profissional') || '',
                        parecer_v6: window.EF6 ? EF6.coletar(formData) : undefined,

                        fotos: {
                            frente: (await blobToBase64(fotosTemporariasBlob.frente)) || fotosTemporarias.frente || '',
                            perfil_direito: (await blobToBase64(fotosTemporariasBlob.perfil_direito)) || fotosTemporarias.perfil_direito || fotosTemporarias.lado || '',
                            perfil_esquerdo: (await blobToBase64(fotosTemporariasBlob.perfil_esquerdo)) || fotosTemporarias.perfil_esquerdo || '',
                            costas: (await blobToBase64(fotosTemporariasBlob.costas)) || fotosTemporarias.costas || '',
                            extra: (await blobToBase64(fotosTemporariasBlob.extra)) || fotosTemporarias.extra || '',
                            lado: (await blobToBase64(fotosTemporariasBlob.perfil_direito)) || fotosTemporarias.perfil_direito || fotosTemporarias.lado || ''
                        }
                    };

                    const modoEdicao = Boolean(idExistente);

                    if (idExistente) {
                        const idx = avaliacoes.findIndex(a => a.id === idExistente);
                        if (idx !== -1) {
                            if (!registro.fotos.frente) registro.fotos.frente = avaliacoes[idx].fotos?.frente || '';
                            if (!registro.fotos.lado) registro.fotos.lado = avaliacoes[idx].fotos?.lado || '';
                            if (!registro.fotos.costas) registro.fotos.costas = avaliacoes[idx].fotos?.costas || '';
                        }
                    }

                    await salvarAvaliacaoNoDB(registro);

                    let pastaCriada = await gravarAvaliacaoEmSubpasta(registro);
                    const infoDb = document.getElementById('success-db-info');
                    const titleSuccess = document.getElementById('success-title');
                    
                    titleSuccess.textContent = modoEdicao ? 'Avaliação Atualizada com Sucesso!' : 'Avaliação Salva com Sucesso!';

                    if (pastaCriada) {
                        infoDb.textContent = `Salvo no banco de dados IndexedDB e subpasta física criada: banco_dados/${pastaCriada}/`;
                    } else {
                        infoDb.textContent = 'Salvo com sucesso no banco de dados de alta capacidade (IndexedDB). Conecte uma pasta física no topo caso deseje arquivos no disco.';
                    }

                    Object.keys(urlsPreviewTemporarias).forEach(k => {
                        if (urlsPreviewTemporarias[k]) URL.revokeObjectURL(urlsPreviewTemporarias[k]);
                        urlsPreviewTemporarias[k] = null;
                    });
                    
                    fotosTemporarias = { frente: '', perfil_direito: '', perfil_esquerdo: '', costas: '', extra: '', lado: '' };
                    fotosTemporariasBlob = { frente: null, perfil_direito: null, perfil_esquerdo: null, costas: null, extra: null };
                    descartarRascunho();

                    steps.forEach(step => step.classList.add('hidden'));
                    formActions.classList.add('hidden');
                    progressWrapper.classList.add('hidden');
                    formHeader.classList.add('hidden');
                    successScreen.classList.remove('hidden');

                } catch (err) {
                    console.error("Erro crítico ao salvar:", err);
                    alert("Erro ao gravar avaliação: " + err.message);
                } finally {
                    btnSubmit.disabled = false;
                    btnSubmit.textContent = "Salvar Avaliação";
                }
            });

            const resetFormulario = window.resetFormulario = function() {
                form.reset();
                ['bia_imc','bia_gordura_kg','bia_mme'].forEach(i => { const e = document.getElementById(i); if (e) delete e.dataset.manual; });
                document.getElementById('avaliacao_id').value = '';
                document.getElementById('edit-mode-alert').classList.add('hidden');
                document.getElementById('tab-form-icon').textContent = '📝';
                document.getElementById('tab-form-label').textContent = 'Novo Check-in';
                document.getElementById('form-title-text').textContent = 'Avaliação Física & Bioimpedância';
                document.getElementById('form-subtitle-text').textContent = '7 Dobras Cutâneas, Perimetria Completa, Gráficos de Composição e Fotos.';
                document.getElementById('btn-submit').textContent = 'Salvar Avaliação';

                definirDataPadrao();
                if (typeof inicializarBeforeAfterSlider === 'function') inicializarBeforeAfterSlider();
                fotosTemporarias = { frente: '', perfil_direito: '', perfil_esquerdo: '', costas: '', extra: '', lado: '' };
                fotosTemporariasBlob = { frente: null, perfil_direito: null, perfil_esquerdo: null, costas: null, extra: null };
                ['frente', 'perfil_direito', 'perfil_esquerdo', 'costas', 'extra'].forEach(pose => {
                    if (urlsPreviewTemporarias[pose]) { URL.revokeObjectURL(urlsPreviewTemporarias[pose]); urlsPreviewTemporarias[pose] = null; }
                    const img = document.getElementById(`thumb-${pose}-img`);
                    const empty = document.getElementById(`thumb-${pose}-empty`);
                    if (img) { img.src = ''; img.classList.add('hidden'); }
                    if (empty) empty.classList.remove('hidden');
                });

                currentStepIndex = 0;
                steps.forEach(step => step.classList.remove('hidden'));
                formActions.classList.remove('hidden');
                progressWrapper.classList.remove('hidden');
                formHeader.classList.remove('hidden');
                successScreen.classList.add('hidden');
                recalcularCamposAutomaticos();
                if (window.EF6) EF6.limpar();
                updateUI();
                switchTab('tab-novo-checkin');
            };

            const cancelarEdicao = window.cancelarEdicao = function() {
                window.resetFormulario();
                switchTab('tab-historico');
            };

            const editarAvaliacao = window.editarAvaliacao = function(id) {
                const aval = (typeof encontrarAvaliacaoPorId === 'function' ? encontrarAvaliacaoPorId(id) : null) || avaliacoes.find(a => a.id === id || String(a.id) === String(id));
                if (!aval) return;

                switchTab('tab-novo-checkin');

                document.getElementById('avaliacao_id').value = aval.id;
                document.getElementById('edit-mode-alert').classList.remove('hidden');
                document.getElementById('tab-form-icon').textContent = '✏️';
                const primeiroNome = (aval.nome ? String(aval.nome).trim().split(/\s+/)[0] : 'Aluno');
                document.getElementById('tab-form-label').textContent = `Editar: ${primeiroNome}`;
                document.getElementById('form-title-text').textContent = `Editar Avaliação - ${aval.nome}`;
                document.getElementById('form-subtitle-text').textContent = `Modificando dados do check-in: ${aval.checkin_semana || 'Avaliação'} (${formatarData(aval.data_avaliacao)})`;
                document.getElementById('btn-submit').textContent = 'Salvar Alterações';

                document.getElementById('nome').value = aval.nome || '';
                document.getElementById('email').value = aval.email || '';
                document.getElementById('whatsapp').value = aval.whatsapp || '';
                document.getElementById('sexo').value = aval.sexo || 'M';
                document.getElementById('idade').value = aval.idade || '';
                document.getElementById('altura').value = aval.altura || '';
                document.getElementById('data_avaliacao').value = aval.data_avaliacao || '';
                document.getElementById('data_proxima_avaliacao').value = aval.data_proxima_avaliacao || '';
                document.getElementById('checkin_semana').value = aval.checkin_semana || 'Semana 1';
                document.getElementById('fase').value = aval.fase || 'Cutting';
                if (document.getElementById('avaliador_clinica')) document.getElementById('avaliador_clinica').value = aval.avaliador_clinica || '';
                document.getElementById('avaliador_nome').value = aval.avaliador_nome || '';
                document.getElementById('avaliador_registro').value = aval.avaliador_registro || '';

                const p = aval.perimetria || {};
                document.getElementById('peso').value = aval.peso || '';
                document.getElementById('peri_pescoco').value = p.pescoco || '';
                document.getElementById('peri_ombros').value = p.ombros || '';
                document.getElementById('peri_abdomen').value = p.abdomen || '';
                document.getElementById('cintura').value = p.cintura || aval.cintura || '';
                document.getElementById('quadril').value = p.quadril || aval.quadril || '';
                document.getElementById('braco_esq').value = p.braco_esq || aval.braco_esq || '';
                document.getElementById('braco_dir').value = p.braco_dir || aval.braco_dir || '';
                document.getElementById('coxa_esq').value = p.coxa_esq || aval.coxa_esq || '';
                document.getElementById('coxa_dir').value = p.coxa_dir || aval.coxa_dir || '';
                document.getElementById('panturrilha').value = p.panturrilha || aval.panturrilha || '';

                const d = aval.dobras || {};
                document.getElementById('dobra_triceps').value = d.triceps || '';
                document.getElementById('dobra_subescapular').value = d.subescapular || '';
                document.getElementById('dobra_peitoral').value = d.peitoral || '';
                document.getElementById('dobra_axilar').value = d.axilar || '';
                document.getElementById('dobra_suprailiaca').value = d.suprailiaca || '';
                document.getElementById('dobra_abdominal').value = d.abdominal || '';
                document.getElementById('dobra_coxa').value = d.coxa || '';

                const b = aval.bioimpedancia || {};
                document.getElementById('bia_peso').value = b.peso || aval.peso || '';
                document.getElementById('bia_pgordura').value = b.pgordura || '';
                document.getElementById('bia_pmusculo').value = b.pmusculo || '';
                document.getElementById('bia_imc').value = b.imc || '';
                document.getElementById('bia_gordura_kg').value = b.gordura_kg || '';
                document.getElementById('bia_mme').value = b.mme || '';
                document.getElementById('bia_tmb').value = b.tmb || '';
                document.getElementById('bia_visceral').value = b.visceral || '';
                document.getElementById('bia_idade_corporal').value = b.idade_corporal || aval.idade || '';
                document.getElementById('bia_rcq').value = b.rcq || '';
                document.getElementById('bia_risco').value = b.risco || 'Baixo Risco (Normal)';
                document.getElementById('bia_analise_texto').value = b.analise_texto || '';

                fotosTemporarias = {
                    frente: aval.fotos?.frente || '',
                    perfil_direito: aval.fotos?.perfil_direito || aval.fotos?.lado || '',
                    perfil_esquerdo: aval.fotos?.perfil_esquerdo || '',
                    costas: aval.fotos?.costas || '',
                    extra: aval.fotos?.extra || ''
                };
                ['frente', 'perfil_direito', 'perfil_esquerdo', 'costas', 'extra'].forEach(pose => {
                    const img = document.getElementById(`thumb-${pose}-img`);
                    const empty = document.getElementById(`thumb-${pose}-empty`);
                    if (fotosTemporarias[pose]) {
                        img.src = fotosTemporarias[pose];
                        img.classList.remove('hidden');
                        empty.classList.add('hidden');
                    } else {
                        img.src = '';
                        img.classList.add('hidden');
                        empty.classList.remove('hidden');
                    }
                });

                document.getElementById('energia').value = aval.energia || 3;
                document.getElementById('aderencia_treino').value = aval.aderencia_treino || '100% no plano';
                document.getElementById('aderencia_dieta').value = aval.aderencia_dieta || '100% no plano';
                (document.querySelector(`input[name="desafio"][value="${aval.desafio || 'Sim'}"]`) || document.querySelector('input[name="desafio"][value="Sim"]')).checked = true;
                document.getElementById('observacoes').value = aval.observacoes || '';
                document.getElementById('parecer_profissional').value = aval.parecer_profissional || '';
                if (window.EF6) EF6.carregar(aval);

                currentStepIndex = 0;
                steps.forEach(step => step.classList.remove('hidden'));
                formActions.classList.remove('hidden');
                progressWrapper.classList.remove('hidden');
                formHeader.classList.remove('hidden');
                successScreen.classList.add('hidden');
                recalcularCamposAutomaticos();
                updateUI();
            };

            updateUI();
            window.__efWizardReady = true;
        }

        function renderDonutChartSvg(percGordura, percMassaMagra) {
            const g = (percGordura !== undefined && percGordura !== null && !isNaN(parseFloat(percGordura))) ? parseFloat(percGordura) : null;
            if (g === null || g <= 0) {
                return '<div style="text-align:center;font-size:0.75rem;color:#64748b;padding:2.5rem 0;">Sem dados de % gordura</div>';
            }
            const m = (percMassaMagra !== undefined && percMassaMagra !== null && !isNaN(parseFloat(percMassaMagra))) ? parseFloat(percMassaMagra) : (100 - g);
            const circ = 376.99;
            const strokeGordura = (Math.max(0, Math.min(100, g)) / 100) * circ;
            const strokeMagra = circ - strokeGordura;
            return `
            <svg width="220" height="220" viewBox="0 0 220 220" style="margin: 0 auto; display:block;">
                <circle cx="110" cy="110" r="60" fill="transparent" stroke="#e5e5ea" stroke-width="32" />
                <circle cx="110" cy="110" r="60" fill="transparent" stroke="#0071e3" stroke-width="32"
                    stroke-dasharray="${strokeGordura.toFixed(2)} ${strokeMagra.toFixed(2)}"
                    stroke-dashoffset="0"
                    transform="rotate(-90 110 110)" />
                <text x="110" y="104" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="11" font-weight="600" fill="#86868b" letter-spacing="0.05em">GORDURA</text>
                <text x="110" y="126" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="18" font-weight="700" fill="#1d1d1f">${g.toFixed(1)}%</text>
            </svg>`;
        }

        function renderBarChartSvg(massaMagraKg, massaGordaKg) {
            const mm = (massaMagraKg !== undefined && massaMagraKg !== null && !isNaN(parseFloat(massaMagraKg))) ? parseFloat(massaMagraKg) : null;
            const mg = (massaGordaKg !== undefined && massaGordaKg !== null && !isNaN(parseFloat(massaGordaKg))) ? parseFloat(massaGordaKg) : null;
            if (mm === null && mg === null) {
                return '<div style="text-align:center;font-size:0.75rem;color:#64748b;padding:2.5rem 0;">Sem dados de massa corporal</div>';
            }
            const valMM = mm || 0;
            const valMG = mg || 0;
            const maxVal = Math.max(valMM, valMG, 100);
            const heightMM = valMM > 0 ? Math.max(12, (valMM / maxVal) * 115) : 0;
            const heightMG = valMG > 0 ? Math.max(12, (valMG / maxVal) * 115) : 0;
            const yMM = 145 - heightMM;
            const yMG = 145 - heightMG;
            return `
            <svg width="240" height="180" viewBox="0 0 240 180" style="margin: 0 auto; display:block;">
                <line x1="30" y1="30" x2="220" y2="30" stroke="#f2f2f7" stroke-dasharray="3,3" />
                <line x1="30" y1="88" x2="220" y2="88" stroke="#f2f2f7" stroke-dasharray="3,3" />
                <line x1="30" y1="145" x2="220" y2="145" stroke="#d1d1d6" stroke-width="1.5" />
                
                <rect x="58" y="${yMM}" width="46" height="${heightMM}" rx="7" fill="#0071e3" />
                <text x="81" y="${yMM - 6}" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="11" font-weight="700" fill="#1d1d1f">${valMM > 0 ? valMM.toFixed(1) + 'kg' : '—'}</text>
                <text x="81" y="165" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="11" font-weight="600" fill="#6e6e73">M. Magra</text>

                <rect x="138" y="${yMG}" width="46" height="${heightMG}" rx="7" fill="#ff9500" />
                <text x="161" y="${yMG - 6}" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="11" font-weight="700" fill="#1d1d1f">${valMG > 0 ? valMG.toFixed(1) + 'kg' : '—'}</text>
                <text x="161" y="165" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="11" font-weight="600" fill="#6e6e73">M. Gorda</text>
            </svg>`;
        }

        function renderizarHistorico(filtroTexto = '') {
            const elTotalAv = document.getElementById('kpi-total-avaliacoes');
            const elMediaGordura = document.getElementById('kpi-media-gordura');
            const elMediaMassa = document.getElementById('kpi-media-massa');
            const elComFotos = document.getElementById('kpi-com-fotos');

            if (elTotalAv) elTotalAv.textContent = String(avaliacoes.length);
            if (elMediaGordura) {
                const validG = avaliacoes.map(a => parseFloat(a.dobras_resultado?.percGordura || a.bioimpedancia?.pgordura)).filter(v => !isNaN(v) && v > 0);
                elMediaGordura.textContent = validG.length > 0 ? (validG.reduce((acc, v) => acc + v, 0) / validG.length).toFixed(1) + '%' : '--%';
            }
            if (elMediaMassa) {
                const validM = avaliacoes.map(a => parseFloat(a.dobras_resultado?.massaMagra)).filter(v => !isNaN(v) && v > 0);
                elMediaMassa.textContent = validM.length > 0 ? (validM.reduce((acc, v) => acc + v, 0) / validM.length).toFixed(1) + ' kg' : '-- kg';
            }
            if (elComFotos) {
                const countF = avaliacoes.filter(a => a.fotos && (a.fotos.frente || a.fotos.perfil_direito || a.fotos.perfil_esquerdo || a.fotos.costas || a.fotos.extra)).length;
                elComFotos.textContent = String(countF);
            }

            const grid = document.getElementById('history-list-grid');
            const empty = document.getElementById('history-empty-state');
            if (!grid || !empty) return;

            grid.innerHTML = '';
            
            let lista = [...avaliacoes].reverse();
            if (filtroTexto.trim() !== '') {
                const termo = filtroTexto.toLowerCase();
                lista = lista.filter(a => 
                    (a.nome && a.nome.toLowerCase().includes(termo)) ||
                    (a.email && a.email.toLowerCase().includes(termo)) ||
                    (a.whatsapp && String(a.whatsapp).replace(/\D/g, '').includes(termo.replace(/\D/g, '') || '\u0000')) ||
                    (a.checkin_semana && a.checkin_semana.toLowerCase().includes(termo)) ||
                    (a.data_avaliacao && (a.data_avaliacao.includes(termo) || formatarData(a.data_avaliacao).includes(termo)))
                );
            }

            if (lista.length === 0) {
                empty.classList.remove('hidden');
                grid.classList.add('hidden');
                return;
            }

            empty.classList.add('hidden');
            grid.classList.remove('hidden');

            lista.forEach(a => {
                const b = a.bioimpedancia || {};
                const d = a.dobras_resultado || {};

                const card = document.createElement('div');
                card.className = 'history-card';
                card.innerHTML = `
                    <div>
                        <div class="history-card-header">
                            <div>
                                <div class="history-client-name">${esc(a.nome)}</div>
                                <div style="font-size:0.75rem; color:var(--text-muted);">${esc(a.email || '')}</div>
                            </div>
                            <span class="history-badge">${esc(a.checkin_semana || 'Check-in')}</span>${retornoAtrasado(a) ? ' <span class="history-badge" style="background:#fee2e2;color:#b91c1c;">⏰ Retorno atrasado</span>' : ''}
                        </div>
                        <div class="history-meta">
                            <span>📅 <strong>Data:</strong> ${formatarData(a.data_avaliacao)} &bull; <strong>Retorno:</strong> ${formatarData(a.data_proxima_avaliacao) || 'Não definido'}</span>
                            <span>🧬 <strong>%G Pollock:</strong> ${d.percGordura ? d.percGordura + '%' : '-'} &bull; <strong>%G BIA:</strong> ${b.pgordura ? b.pgordura + '%' : '-'}</span>
                            <span>📏 <strong>Soma Perimetria:</strong> ${a.perimetria_soma ? a.perimetria_soma + ' cm' : '-'} &bull; <strong>IMC:</strong> ${b.imc || '-'}</span>
                        </div>
                        <div class="history-stats-preview">
                            <div class="history-stat-mini">
                                <span class="h-val">${a.peso > 0 ? a.peso.toFixed(1) : '-'}</span>
                                <span class="h-lbl">Peso (kg)</span>
                            </div>
                            <div class="history-stat-mini">
                                <span class="h-val">${b.mme != null ? Number(b.mme).toFixed(1) : '-'}</span>
                                <span class="h-lbl">Massa Musc.</span>
                            </div>
                            <div class="history-stat-mini">
                                <span class="h-val">${a.fotos?.frente ? 'Sim' : 'Não'}</span>
                                <span class="h-lbl">Fotos</span>
                            </div>
                        </div>
                    </div>

                    <div class="history-actions" style="display:flex; flex-wrap:wrap; gap:6px;">
                        <button class="btn btn-primary btn-sm" onclick="abrirVisualizacaoPacienteWeb('${esc(idSeguro(a.id))}')" title="Abrir Visão do Aluno (Tela Cheia Interativa)">👁️ Visão do Aluno</button>
                        <button class="btn btn-success btn-sm" onclick="imprimirAvaliacaoIndividualPDF('${esc(idSeguro(a.id))}')" title="Gerar laudo em PDF com fotos e bioimpedância">🖨️ PDF</button>
                        <button class="btn btn-secondary btn-sm" onclick="abrirModalDetalhes('${esc(idSeguro(a.id))}')" title="Ver avaliação completa">🔍 Detalhes</button>
                        <button class="btn btn-warning btn-sm" onclick="editarAvaliacao('${esc(idSeguro(a.id))}')" title="Editar dados">✏️</button>
                        <button class="btn btn-danger btn-sm" onclick="excluirAvaliacao('${esc(idSeguro(a.id))}')" title="Excluir">🗑️</button>
                    </div>
                `;
                grid.appendChild(card);
            });
        }

        function filtrarAvaliacoes() {
            const input = document.getElementById('filtro-busca');
            renderizarHistorico(input.value);
        }

        function imprimirAvaliacaoIndividualPDF(id) {
            const aval = (typeof encontrarAvaliacaoPorId === 'function' ? encontrarAvaliacaoPorId(id) : null) || avaliacoes.find(a => a.id === id || String(a.id) === String(id));
            if (!aval) return;

            const wrapper = document.getElementById('single-print-wrapper');
            const dRes = aval.dobras_resultado || {};
            const b = aval.bioimpedancia || {};
            const p = aval.perimetria || {};
            const d = aval.dobras || {};
            const fotos = aval.fotos || {};
            const pd = fotos.perfil_direito || fotos.lado || '';

            const somato = CalculadoraSomatotipo.doRegistro(aval);

            let parqAlertas = 0;
            if (aval.parq) {
                for (let i = 1; i <= 7; i++) if (aval.parq[`q${i}`]) parqAlertas++;
            }
            const parqStatus = parqAlertas === 0 ? 'Apto sem restrições' : `${parqAlertas} alerta(s) - Requer Liberação`;
            
            const proNome = (aval.avaliador_nome || localStorage.getItem('evolufisico_pro_nome') || 'Profissional Responsável').trim();
            let proCref = (aval.avaliador_registro || localStorage.getItem('evolufisico_pro_cref') || '').trim();
            if (!proCref) {
                proCref = 'Registro não informado';
            } else if (!/cref/i.test(proCref)) {
                proCref = `CREF: ${proCref}`;
            }
            const proClinica = (aval.avaliador_clinica || localStorage.getItem('evolufisico_pro_clinica') || '').trim();

            wrapper.innerHTML = `
                <!-- PÁGINA 1: LAUDO CLÍNICO, BIOIMPEDÂNCIA, DOBRAS & COMPOSIÇÃO -->
                <div class="print-page print-page-1">
                    <div class="print-header" style="border-bottom: 2.5px solid #0071e3; padding-bottom: 8px; margin-bottom: 12px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                ${proClinica ? `<div style="font-size:1.3rem; font-weight:800; color:#0f172a; text-transform:uppercase; letter-spacing:0.5px;">${esc(proClinica)}</div>` : `<div style="font-size:1.25rem; font-weight:800; color:#0071e3; text-transform:uppercase; letter-spacing:0.5px;">EVOLUFÍSICO</div>`}
                                <div style="font-size:0.85rem; color:#475569; font-weight:600;">LAUDO OFICIAL DE AVALIAÇÃO FÍSICA & COMPOSIÇÃO CORPORAL</div>
                            </div>
                            <div style="text-align:right; font-size:0.9rem; line-height:1.4;">
                                <div style="font-size:1.02rem; font-weight:800; color:#0f172a;">Profissional: ${esc(proNome)}</div>
                                <div style="font-size:0.88rem; font-weight:700; color:#0071e3;">${esc(proCref)}</div>
                            </div>
                        </div>
                    </div>

                    <div class="print-meta-grid">
                        <div>Aluno: <strong>${esc(aval.nome)}</strong></div>
                        <div>Data: <strong>${formatarData(aval.data_avaliacao)}</strong></div>
                        <div>Idade: <strong>${aval.idade ? aval.idade + ' anos' : '—'}</strong></div>
                        <div>Sexo: <strong>${aval.sexo === 'M' ? 'Masculino' : 'Feminino'}</strong></div>
                        <div>Estatura: <strong>${aval.altura ? aval.altura + ' cm' : '—'}</strong></div>
                        <div>Peso: <strong>${aval.peso ? aval.peso.toFixed(1) : '-'} kg</strong></div>
                        <div>Check-in: <strong>${esc(aval.checkin_semana || 'Semana')}</strong></div>
                        ${aval.parq ? `<div>PAR-Q: <strong>${esc(parqStatus)}</strong></div>` : ''}
                    </div>

                    <div class="print-stats-row">
                        <div class="print-stat-box">
                            <span class="p-lbl">% GORDURA POLLOCK</span>
                            <span class="p-val">${dRes.percGordura || b.pgordura || '-'}%</span>
                            <span class="p-sub">${dRes.classificacao || 'Normal'}</span>
                        </div>
                        <div class="print-stat-box">
                            <span class="p-lbl">MASSA MUSCULAR</span>
                            <span class="p-val">${dRes.massaMagra || '-'} kg</span>
                            <span class="p-sub">${b.pmusculo ? b.pmusculo + '% músculo' : ''}</span>
                        </div>
                        <div class="print-stat-box">
                            <span class="p-lbl">SOMATOTIPO</span>
                            <span class="p-val" style="font-size:10pt;">${somato.classificacao}</span>
                            <span class="p-sub">E:${somato.endomorfia} M:${somato.mesomorfia} Ec:${somato.ectomorfia}</span>
                        </div>
                        <div class="print-stat-box">
                            <span class="p-lbl">SOMA PERIMETRIA</span>
                            <span class="p-val">${aval.perimetria_soma || '-'} cm</span>
                            <span class="p-sub">IMC: ${b.imc || '-'}</span>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:10px; page-break-inside:avoid;">
                        <div style="border:1px solid #cbd5e1; border-radius:6px; padding:8px; text-align:center; background:#ffffff;">
                            <div style="font-size:0.75rem; font-weight:700; margin-bottom:4px; color:#1e293b;">% Gordura x Magra</div>
                            ${renderDonutChartSvg(dRes.percGordura || b.pgordura || null, dRes.percGordura || b.pgordura ? (100 - parseFloat(dRes.percGordura || b.pgordura)).toFixed(1) : null)}
                        </div>
                        <div style="border:1px solid #cbd5e1; border-radius:6px; padding:8px; text-align:center; background:#ffffff;">
                            <div style="font-size:0.75rem; font-weight:700; margin-bottom:4px; color:#1e293b;">Massa Magra x Gorda (kg)</div>
                            ${renderBarChartSvg(dRes.massaMagra || null, dRes.massaGorda || b.gordura_kg || null)}
                        </div>
                        <div style="border:1px solid #cbd5e1; border-radius:6px; padding:8px; text-align:center; background:#ffffff;">
                            <div style="font-size:0.75rem; font-weight:700; margin-bottom:4px; color:#1e293b;">Somatocarta Heath-Carter</div>
                            ${CalculadoraSomatotipo.renderizarSomatocartaSvg(somato.x, somato.y)}
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; page-break-inside:avoid; margin-bottom:8px;">
                        <div style="border:1px solid #cbd5e1; border-radius:6px; padding:6px 8px; background:#ffffff;">
                            <div style="font-size:0.75rem; font-weight:800; border-bottom:1.5px solid #0f172a; padding-bottom:3px; margin-bottom:4px; display:flex; justify-content:space-between; color:#0f172a;">
                                <span>🧬 BIOIMPEDÂNCIA (BIA)</span>
                                <span>${b.peso || aval.peso || '-'} kg</span>
                            </div>
                            <table style="width:100%; border-collapse:collapse; font-size:0.72rem; line-height:1.35;">
                                <tr><td style="padding:1.5px 0;">Peso na BIA:</td><td style="font-weight:700; text-align:right;">${b.peso ? b.peso.toFixed(1) : (aval.peso ? aval.peso.toFixed(1) : '-')} kg</td></tr>
                                <tr><td style="padding:1.5px 0;">% Gordura BIA:</td><td style="font-weight:700; text-align:right; color:#dc2626;">${b.pgordura ? b.pgordura + '%' : '-'}</td></tr>
                                <tr><td style="padding:1.5px 0;">Massa Muscular (MME):</td><td style="font-weight:700; text-align:right; color:#16a34a;">${b.mme ? b.mme.toFixed(1) + ' kg' : '-'}</td></tr>
                                <tr><td style="padding:1.5px 0;">% Músculo Esquelético:</td><td style="font-weight:700; text-align:right;">${b.pmusculo ? b.pmusculo + '%' : '-'}</td></tr>
                                <tr><td style="padding:1.5px 0;">Massa Gorda (kg):</td><td style="font-weight:700; text-align:right;">${b.gordura_kg ? b.gordura_kg + ' kg' : '-'}</td></tr>
                                <tr><td style="padding:1.5px 0;">Taxa Metabólica Basal:</td><td style="font-weight:700; text-align:right;">${b.tmb ? b.tmb + ' kcal' : '-'}</td></tr>
                                <tr><td style="padding:1.5px 0;">Gordura Visceral:</td><td style="font-weight:700; text-align:right;">${(b.visceral !== undefined && b.visceral !== null) ? 'Nível ' + b.visceral : ((b.gordura_visceral !== undefined) ? 'Nível ' + b.gordura_visceral : '-')}</td></tr>
                                <tr><td style="padding:1.5px 0;">Idade Corporal:</td><td style="font-weight:700; text-align:right;">${b.idade_corporal ? b.idade_corporal + ' anos' : '-'}</td></tr>
                                <tr><td style="padding:1.5px 0;">IMC:</td><td style="font-weight:700; text-align:right;">${b.imc || '-'} kg/m²</td></tr>
                                <tr><td style="padding:1.5px 0;">Classificação de Risco:</td><td style="font-weight:700; text-align:right;">${b.risco || 'Normal'}</td></tr>
                            </table>
                        </div>

                        <div style="border:1px solid #cbd5e1; border-radius:6px; padding:6px 8px; background:#ffffff;">
                            <div style="font-size:0.75rem; font-weight:800; border-bottom:1.5px solid #0f172a; padding-bottom:3px; margin-bottom:4px; display:flex; justify-content:space-between; color:#0f172a;">
                                <span>📏 PERIMETRIAS (cm)</span>
                                <span>Total: ${aval.perimetria_soma || '-'} cm</span>
                            </div>
                            <table style="width:100%; border-collapse:collapse; font-size:0.72rem; line-height:1.35;">
                                <tr><td style="padding:1.5px 0;">Pescoço:</td><td style="font-weight:700; text-align:right;">${p.pescoco || '-'} cm</td></tr>
                                <tr><td style="padding:1.5px 0;">Ombros / Tórax:</td><td style="font-weight:700; text-align:right;">${p.ombros || p.torax || '-'} cm</td></tr>
                                <tr><td style="padding:1.5px 0;">Cintura:</td><td style="font-weight:700; text-align:right;">${p.cintura || '-'} cm</td></tr>
                                <tr><td style="padding:1.5px 0;">Abdômen:</td><td style="font-weight:700; text-align:right;">${p.abdomen || '-'} cm</td></tr>
                                <tr><td style="padding:1.5px 0;">Quadril:</td><td style="font-weight:700; text-align:right;">${p.quadril || '-'} cm</td></tr>
                                <tr><td style="padding:1.5px 0;">Braço Direito:</td><td style="font-weight:700; text-align:right;">${p.braco_dir || '-'} cm</td></tr>
                                <tr><td style="padding:1.5px 0;">Braço Esquerdo:</td><td style="font-weight:700; text-align:right;">${p.braco_esq || '-'} cm</td></tr>
                                <tr><td style="padding:1.5px 0;">Coxa Direita:</td><td style="font-weight:700; text-align:right;">${p.coxa_dir || '-'} cm</td></tr>
                                <tr><td style="padding:1.5px 0;">Panturrilha:</td><td style="font-weight:700; text-align:right;">${p.panturrilha || '-'} cm</td></tr>
                                <tr><td style="padding:1.5px 0;">RCQ:</td><td style="font-weight:700; text-align:right;">${b.rcq || ((parseFloat(p.cintura) > 0 && parseFloat(p.quadril) > 0) ? (parseFloat(p.cintura)/parseFloat(p.quadril)).toFixed(2) : '-')}</td></tr>
                            </table>
                        </div>

                        <div style="border:1px solid #cbd5e1; border-radius:6px; padding:6px 8px; background:#ffffff;">
                            <div style="font-size:0.75rem; font-weight:800; border-bottom:1.5px solid #0f172a; padding-bottom:3px; margin-bottom:4px; display:flex; justify-content:space-between; color:#0f172a;">
                                <span>📐 DOBRAS POLLOCK (mm)</span>
                                <span>Soma: ${dRes.soma || '-'} mm</span>
                            </div>
                            <table style="width:100%; border-collapse:collapse; font-size:0.72rem; line-height:1.35;">
                                <tr><td style="padding:1.5px 0;">Tríceps:</td><td style="font-weight:700; text-align:right;">${d.triceps || '-'} mm</td></tr>
                                <tr><td style="padding:1.5px 0;">Subescapular:</td><td style="font-weight:700; text-align:right;">${d.subescapular || '-'} mm</td></tr>
                                <tr><td style="padding:1.5px 0;">Peitoral:</td><td style="font-weight:700; text-align:right;">${d.peitoral || '-'} mm</td></tr>
                                <tr><td style="padding:1.5px 0;">Axilar Média:</td><td style="font-weight:700; text-align:right;">${d.axilar || '-'} mm</td></tr>
                                <tr><td style="padding:1.5px 0;">Supra-ilíaca:</td><td style="font-weight:700; text-align:right;">${d.suprailiaca || '-'} mm</td></tr>
                                <tr><td style="padding:1.5px 0;">Abdominal:</td><td style="font-weight:700; text-align:right;">${d.abdominal || '-'} mm</td></tr>
                                <tr><td style="padding:1.5px 0;">Coxa:</td><td style="font-weight:700; text-align:right;">${d.coxa || '-'} mm</td></tr>
                                <tr><td style="padding:1.5px 0;">Densidade Corporal:</td><td style="font-weight:700; text-align:right;">${dRes.densidade || '-'} g/ml</td></tr>
                                <tr><td style="padding:1.5px 0;">% Gordura Pollock:</td><td style="font-weight:700; text-align:right; color:#2563eb;">${dRes.percGordura || '-'}%</td></tr>
                                <tr><td style="padding:1.5px 0;">Classificação:</td><td style="font-weight:700; text-align:right;">${dRes.classificacao || 'Normal'}</td></tr>
                            </table>
                        </div>
                    </div>

                    <div style="margin-top:10px; font-size:0.72rem; color:#64748b; text-align:right;">
                        Página 1 de 2 &bull; Emitido em ${new Date().toLocaleDateString('pt-BR')} &bull; EvoluFísico v9.0-beta
                    </div>
                </div>

                <div class="print-page-break"></div>

                <!-- PÁGINA 2: PRONTUÁRIO FOTOGRÁFICO DE 5 FOTOS + PARECER + ASSINATURAS -->
                <div class="print-page print-page-2">
                    <div class="print-header" style="border-bottom: 2.5px solid #0071e3; padding-bottom: 8px; margin-bottom: 12px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <div style="font-size:1.15rem; font-weight:800; color:#0f172a;">PRONTUÁRIO FOTOGRÁFICO & PARECER TÉCNICO</div>
                                <div style="font-size:0.82rem; color:#475569;">Aluno: <strong>${esc(aval.nome)}</strong> | Check-in: <strong>${esc(aval.checkin_semana || 'Semana')}</strong></div>
                            </div>
                            <div style="text-align:right; font-size:0.9rem; line-height:1.4;">
                                <div style="font-size:0.98rem; font-weight:800; color:#0f172a;">Profissional: ${esc(proNome)}</div>
                                <div style="font-size:0.85rem; font-weight:700; color:#0071e3;">${esc(proCref)}</div>
                            </div>
                        </div>
                    </div>

                    <div class="print-photo-panel" style="page-break-inside:avoid; break-inside:avoid; margin-bottom:12px;">
                        <div style="font-size:0.82rem; font-weight:700; margin-bottom:6px; color:#1e293b;">
                            📷 Registro Fotográfico Padronizado (5 Vistas)
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:8px;">
                            <div class="print-photo-card">
                                <span class="print-photo-lbl">1. Frente (Anterior)</span>
                                <div class="print-photo-frame">
                                    ${fotos.frente ? `<img src="${esc(fotos.frente)}">` : '<div class="print-no-photo">Sem foto frontal</div>'}
                                </div>
                            </div>
                            <div class="print-photo-card">
                                <span class="print-photo-lbl">2. Perfil Direito</span>
                                <div class="print-photo-frame">
                                    ${pd ? `<img src="${esc(pd)}">` : '<div class="print-no-photo">Sem foto perfil direito</div>'}
                                </div>
                            </div>
                            <div class="print-photo-card">
                                <span class="print-photo-lbl">3. Perfil Esquerdo</span>
                                <div class="print-photo-frame">
                                    ${fotos.perfil_esquerdo ? `<img src="${esc(fotos.perfil_esquerdo)}">` : '<div class="print-no-photo">Sem foto perfil esquerdo</div>'}
                                </div>
                            </div>
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                            <div class="print-photo-card">
                                <span class="print-photo-lbl">4. Costas (Posterior)</span>
                                <div class="print-photo-frame">
                                    ${fotos.costas ? `<img src="${esc(fotos.costas)}">` : '<div class="print-no-photo">Sem foto dorsal</div>'}
                                </div>
                            </div>
                            <div class="print-photo-card">
                                <span class="print-photo-lbl">5. Livre / Detalhe / Postural</span>
                                <div class="print-photo-frame">
                                    ${fotos.extra ? `<img src="${esc(fotos.extra)}">` : '<div class="print-no-photo">Sem foto adicional</div>'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style="border:1px solid #cbd5e1; border-radius:6px; padding:10px; background:#ffffff; page-break-inside:avoid; margin-bottom:16px;">
                        <div style="font-size:0.8rem; font-weight:800; color:#0f172a; margin-bottom:4px;">✍️ Parecer Técnico do Profissional</div>
                        <div style="font-size:0.78rem; line-height:1.5; color:#334155;">
                            ${esc(aval.parecer_profissional || 'Avaliação física concluída dentro dos padrões científicos. Seguir plano de treinamento e reavaliação na data estipulada.')}
                        </div>
                        ${window.EF6 ? EF6.html(aval, 'print') : ''}
                        ${b.analise_texto ? `<div style="margin-top:6px; font-size:0.75rem; color:#475569; border-top:1px dashed #cbd5e1; padding-top:4px;"><strong>Análise da Bioimpedância:</strong> ${esc(b.analise_texto)}</div>` : ''}
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:16px; page-break-inside:avoid;">
                        <div style="text-align:center; border-top:1px solid #475569; padding-top:6px; font-size:0.78rem;">
                            ${aval.avaliador_nome ? `<strong>${esc(aval.avaliador_nome)}</strong><br>` : '<div style="height:14px;"></div>'}
                            ${aval.avaliador_registro ? `<span>${esc(aval.avaliador_registro)}</span><br>` : ''}
                            <span style="font-size:0.68rem; color:#64748b;">Assinatura do Avaliador Responsável</span>
                        </div>
                        <div style="text-align:center; border-top:1px solid #475569; padding-top:6px; font-size:0.78rem;">
                            <strong>${esc(aval.nome)}</strong><br>
                            <span>Assinatura do Paciente / Aluno</span><br>
                            <span style="font-size:0.68rem; color:#64748b;">Ciência dos Resultados</span>
                        </div>
                    </div>

                    <div style="margin-top:12px; font-size:0.72rem; color:#64748b; text-align:right;">
                        Página 2 de 2 &bull; EvoluFísico v9.0-beta &bull; Documento Oficial
                    </div>
                </div>
            `;

            const oldDocTitle = document.title;
            document.title = ' ';
            const cleanupIndPrint = () => {
                document.body.classList.remove('print-mode-single');
                document.title = oldDocTitle;
                if (typeof window.removeEventListener === 'function') window.removeEventListener('afterprint', cleanupIndPrint);
            };
            window.addEventListener('afterprint', cleanupIndPrint, { once: true });
            document.body.classList.add('print-mode-single');
            // Mantém a abertura original da versão 8.9.3. O marcador serve
            // somente ao CSS de impressão, mesmo se o Android antecipar afterprint.
            document.body.dataset.efPrintTarget = 'report';
            clearTimeout(window.__efPrintGuardTimer);
            window.__efPrintGuardTimer = setTimeout(() => { delete document.body.dataset.efPrintTarget; }, 120000);
            window.print();
            setTimeout(cleanupIndPrint, 1500);
        }

        function imprimirComparativoPDF() {
            const parseComparativo = value => {
                if (value == null || value === '') return NaN;
                const parsed = Number(String(value).trim().replace(',', '.'));
                return Number.isFinite(parsed) ? parsed : NaN;
            };
            const fmtComparativo = (value, digits = 1) => Number.isFinite(value) ? value.toFixed(digits) : '—';
            const baseId = document.getElementById('compare-baseline-select')?.value;
            const currId = document.getElementById('compare-current-select')?.value;
            if (!baseId || !currId || baseId === currId) {
                alert('Selecione duas avaliações diferentes para gerar o relatório comparativo.');
                return;
            }

            const a1 = avaliacoes.find(a => String(a.id) === String(baseId));
            const a2 = avaliacoes.find(a => String(a.id) === String(currId));
            if (!a1 || !a2) {
                alert('Avaliações não encontradas.');
                return;
            }

            const wrapper = document.getElementById('single-print-wrapper');
            if (!wrapper) return;

            // Dados dos Profissionais e Clínica
            const proNome = (a2.avaliador_nome || a1.avaliador_nome || localStorage.getItem('evolufisico_pro_nome') || 'Profissional Responsável').trim();
            let proCref = (a2.avaliador_registro || a1.avaliador_registro || localStorage.getItem('evolufisico_pro_cref') || 'CREF Regular').trim();
            if (!/cref/i.test(proCref)) proCref = `CREF: ${proCref}`;
            const proClinica = (a2.avaliador_clinica || a1.avaliador_clinica || localStorage.getItem('evolufisico_pro_clinica') || '').trim();

            // Cálculos e Deltas Gerais
            const d1 = new Date(a1.data_avaliacao);
            const d2 = new Date(a2.data_avaliacao);
            const diffDias = Number.isFinite(d1.getTime()) && Number.isFinite(d2.getTime())
                ? Math.round(Math.abs((d2 - d1) / (1000 * 60 * 60 * 24))) : null;

            const peso1 = parseComparativo(a1.peso), peso2 = parseComparativo(a2.peso), deltaPeso = Number.isFinite(peso1) && Number.isFinite(peso2) ? peso2 - peso1 : NaN;
            const g1 = parseComparativo(a1.dobras_resultado?.percGordura || a1.bioimpedancia?.pgordura);
            const g2 = parseComparativo(a2.dobras_resultado?.percGordura || a2.bioimpedancia?.pgordura);
            const deltaG = g2 - g1;
            const m1 = parseComparativo(a1.dobras_resultado?.massaMagra);
            const m2 = parseComparativo(a2.dobras_resultado?.massaMagra);
            const deltaM = m2 - m1;
            const c1 = parseComparativo(a1.perimetria?.cintura || a1.cintura);
            const c2 = parseComparativo(a2.perimetria?.cintura || a2.cintura);
            const deltaC = c2 - c1;

            // ===== Design v2 — Relatório Comparativo =====
            const ufmt = (n, d = 1) => Number.isFinite(n) ? n.toFixed(d).replace('.', ',') : '—';
            const unLabel = un => un === '%' ? ' p.p.' : un;
            const decOf = (un, dec) => dec != null ? dec : (/kcal|anos|niv/.test(un) ? 0 : 1);

            function deltaBadge(delta, un, inv, dec) {
                if (!Number.isFinite(delta)) return '<span class="cm-muted">—</span>';
                if (Math.abs(delta) < 0.05) return '<span class="cm-badge cm-neutral">Estável</span>';
                const good = inv ? delta < 0 : delta > 0;
                const arrow = delta > 0 ? '▲' : '▼';
                return `<span class="cm-badge ${good ? 'cm-good' : 'cm-bad'}">${arrow} ${ufmt(Math.abs(delta), decOf(un, dec))}${unLabel(un)}</span>`;
            }

            function pctSpan(delta, v1, inv) {
                if (!v1 || Math.abs(delta) < 0.05) return '<span class="cm-muted">—</span>';
                const p = (delta / v1) * 100;
                const good = inv ? delta < 0 : delta > 0;
                return `<span class="cm-pct ${good ? 'cm-good-t' : 'cm-bad-t'}">${p > 0 ? '+' : '−'}${ufmt(Math.abs(p))}%</span>`;
            }

            function buildRows(items) {
                const rows = items.map(it => {
                    const n1 = parseComparativo(it.v1) || 0, n2 = parseComparativo(it.v2) || 0;
                    if (!n1 && !n2) return '';
                    const both = n1 > 0 && n2 > 0;
                    const d = both ? n2 - n1 : 0;
                    return `<tr class="${it.bold ? 'cm-strong' : ''}"><td>${esc(it.l)}</td>` +
                        `<td class="r">${n1 > 0 ? ufmt(n1, decOf(it.un, it.dec)) + it.un : '—'}</td>` +
                        `<td class="r b">${n2 > 0 ? ufmt(n2, decOf(it.un, it.dec)) + it.un : '—'}</td>` +
                        `<td class="c">${both ? deltaBadge(d, it.un, it.inv, it.dec) : '—'}</td>` +
                        `<td class="r">${both ? pctSpan(d, n1, it.inv) : '—'}</td></tr>`;
                }).join('');
                return rows || '<tr><td colspan="5" class="cm-empty">Sem dados registrados nas duas avaliações.</td></tr>';
            }

            function cmpTable(title, firstCol, rows, accent) {
                return `<section class="cm-card" style="--acc:${accent}">
                    <h3 class="cm-h"><span class="cm-dot"></span>${title}</h3>
                    <table class="cm-table">
                        <colgroup><col style="width:27%"><col style="width:19%"><col style="width:19%"><col style="width:22%"><col style="width:13%"></colgroup>
                        <thead><tr><th>${firstCol}</th><th class="r">Base</th><th class="r">Atual</th><th class="c">Variação</th><th class="r">%</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table></section>`;
            }

            // Perimetria
            const p1 = a1.perimetria || {}, p2 = a2.perimetria || {};
            const perimItems = [
                { l: 'Pescoço', v1: p1.pescoco, v2: p2.pescoco, un: ' cm', inv: false },
                { l: 'Ombros', v1: p1.ombros, v2: p2.ombros, un: ' cm', inv: false },
                { l: 'Abdômen', v1: p1.abdomen, v2: p2.abdomen, un: ' cm', inv: true },
                { l: 'Cintura', v1: p1.cintura || a1.cintura, v2: p2.cintura || a2.cintura, un: ' cm', inv: true },
                { l: 'Quadril', v1: p1.quadril || a1.quadril, v2: p2.quadril || a2.quadril, un: ' cm', inv: false },
                { l: 'Braço Dir.', v1: p1.braco_dir || a1.braco_dir, v2: p2.braco_dir || a2.braco_dir, un: ' cm', inv: false },
                { l: 'Braço Esq.', v1: p1.braco_esq || a1.braco_esq, v2: p2.braco_esq || a2.braco_esq, un: ' cm', inv: false },
                { l: 'Coxa Dir.', v1: p1.coxa_dir || a1.coxa_dir, v2: p2.coxa_dir || a2.coxa_dir, un: ' cm', inv: false },
                { l: 'Coxa Esq.', v1: p1.coxa_esq || a1.coxa_esq, v2: p2.coxa_esq || a2.coxa_esq, un: ' cm', inv: false },
                { l: 'Panturrilha', v1: p1.panturrilha || a1.panturrilha, v2: p2.panturrilha || a2.panturrilha, un: ' cm', inv: false },
                { l: 'Σ Perimetria', v1: parseComparativo(a1.perimetria_soma), v2: parseComparativo(a2.perimetria_soma), un: ' cm', inv: false, bold: true }
            ];

            // Dobras cutâneas
            const dbr1 = a1.dobras || {}, dbr2 = a2.dobras || {};
            const resD1 = a1.dobras_resultado || {}, resD2 = a2.dobras_resultado || {};
            const dobrasItems = [
                { l: 'Tríceps', v1: dbr1.triceps, v2: dbr2.triceps, un: ' mm', inv: true },
                { l: 'Subescapular', v1: dbr1.subescapular, v2: dbr2.subescapular, un: ' mm', inv: true },
                { l: 'Supra-ilíaca', v1: dbr1.suprailiaca, v2: dbr2.suprailiaca, un: ' mm', inv: true },
                { l: 'Peitoral', v1: dbr1.peitoral, v2: dbr2.peitoral, un: ' mm', inv: true },
                { l: 'Axilar média', v1: dbr1.axilar, v2: dbr2.axilar, un: ' mm', inv: true },
                { l: 'Abdominal', v1: dbr1.abdominal, v2: dbr2.abdominal, un: ' mm', inv: true },
                { l: 'Coxa', v1: dbr1.coxa, v2: dbr2.coxa, un: ' mm', inv: true },
                { l: 'Σ 7 Dobras', v1: parseComparativo(resD1.soma), v2: parseComparativo(resD2.soma), un: ' mm', inv: true, bold: true },
                { l: '% Gordura', v1: parseComparativo(resD1.percGordura), v2: parseComparativo(resD2.percGordura), un: '%', inv: true, bold: true },
                { l: 'Massa Gorda', v1: parseComparativo(resD1.massaGorda), v2: parseComparativo(resD2.massaGorda), un: ' kg', inv: true },
                { l: 'Massa Magra', v1: parseComparativo(resD1.massaMagra), v2: parseComparativo(resD2.massaMagra), un: ' kg', inv: false, bold: true }
            ];

            // Bioimpedância
            const b1 = a1.bioimpedancia || {}, b2 = a2.bioimpedancia || {};
            const biaItems = [
                { l: 'Peso (BIA)', v1: b1.peso, v2: b2.peso, un: ' kg', inv: true },
                { l: '% Gordura', v1: b1.pgordura, v2: b2.pgordura, un: '%', inv: true, bold: true },
                { l: 'Massa muscular', v1: b1.mme, v2: b2.mme, un: ' kg', inv: false, bold: true },
                { l: '% Músculo esq.', v1: b1.pmusculo, v2: b2.pmusculo, un: '%', inv: false },
                { l: 'Gordura (kg)', v1: b1.gordura_kg, v2: b2.gordura_kg, un: ' kg', inv: true },
                { l: 'IMC', v1: b1.imc, v2: b2.imc, un: '', inv: true },
                { l: 'RCQ', v1: b1.rcq, v2: b2.rcq, un: '', inv: true, dec: 2 },
                { l: 'Metab. basal', v1: b1.tmb, v2: b2.tmb, un: ' kcal', inv: false },
                { l: 'Gord. visceral', v1: b1.visceral, v2: b2.visceral, un: ' niv', inv: true },
                { l: 'Idade corporal', v1: b1.idade_corporal, v2: b2.idade_corporal, un: ' anos', inv: true }
            ];

            // Barras de composição corporal (% gordura x % massa magra)
            function compBar(label, gv) {
                if (!(gv > 0)) return `<div class="cm-brow"><div class="cm-blabel">${label}</div><div class="cm-btrack cm-bempty">Sem dados</div></div>`;
                const f = Math.max(0, Math.min(100, gv));
                return `<div class="cm-brow"><div class="cm-blabel">${label}</div><div class="cm-btrack">` +
                    `<span class="cm-bfat" style="width:${f}%">${ufmt(f)}%</span><span class="cm-blean" style="width:${100 - f}%">${ufmt(100 - f)}%</span></div></div>`;
            }
            const compCard = `<section class="cm-card" style="--acc:#0ea5e9">
                <h3 class="cm-h"><span class="cm-dot"></span>Composição corporal</h3>
                ${compBar('Base', g1)}${compBar('Atual', g2)}
                <div class="cm-legend"><span><i class="cm-lg-fat"></i>Gordura</span><span><i class="cm-lg-lean"></i>Massa magra e demais</span></div>
                <div class="cm-minikpi">
                    <div><small>Massa gorda (kg)</small><b>${ufmt(parseComparativo(resD1.massaGorda))} ➔ ${ufmt(parseComparativo(resD2.massaGorda))}</b></div>
                    <div><small>Massa magra (kg)</small><b>${ufmt(parseComparativo(resD1.massaMagra))} ➔ ${ufmt(parseComparativo(resD2.massaMagra))}</b></div>
                </div></section>`;

            // Parecer
            let parecerTexto = '';
            if (window.EF781) {
                const customNotes = a2.parecer_comparativo && a2.parecer_comparativo[a1.id];
                parecerTexto = customNotes || a2.parecer_profissional || a1.parecer_profissional || 'Avaliação comparativa indica evolução consistente entre os períodos monitorados.';
            } else {
                parecerTexto = a2.parecer_profissional || a1.parecer_profissional || 'Avaliação comparativa concluída com sucesso.';
            }

            // Fotos
            const f1 = a1.fotos || {}, f2 = a2.fotos || {};
            const pd1 = f1.perfil_direito || f1.lado || '', pd2 = f2.perfil_direito || f2.lado || '';
            const hasPhotos = [f1.frente, f1.costas, pd1, f2.frente, f2.costas, pd2].some(Boolean);
            function photoSlot(img, tag, cls) {
                return `<div class="cm-slot"><span class="cm-tag ${cls}">${tag}</span><div class="cm-img">${img ? `<img src="${esc(img)}" alt="">` : '<em>Sem foto</em>'}</div></div>`;
            }
            function photoCell(label, img1, img2) {
                return `<div class="cm-photo"><div class="cm-photo-t">${label}</div><div class="cm-pair">` +
                    photoSlot(img1, `Antes · ${formatarData(a1.data_avaliacao)}`, 'cm-tag-a') +
                    photoSlot(img2, `Depois · ${formatarData(a2.data_avaliacao)}`, 'cm-tag-b') + `</div></div>`;
            }
            const photosBlock = `<section class="cm-card cm-photos" style="--acc:#8b5cf6">
                <h3 class="cm-h"><span class="cm-dot"></span>Registro fotográfico comparativo</h3>
                <div class="cm-photo-grid">${photoCell('Frente', f1.frente, f2.frente)}${photoCell('Perfil', pd1, pd2)}${photoCell('Costas', f1.costas, f2.costas)}</div></section>`;

            const nomeAluno = esc(a2.nome || a1.nome || '—');
            const periodoTxt = `${formatarData(a1.data_avaliacao)} ➔ ${formatarData(a2.data_avaliacao)}`;
            const emissao = new Date().toLocaleDateString('pt-BR');
            const totalPaginas = hasPhotos ? 3 : 2;

            const parecerBlock = `<section class="cm-card cm-parecer" style="--acc:#2563eb">
                <h3 class="cm-h"><span class="cm-dot"></span>Parecer técnico e recomendações</h3>
                <div class="cm-text">${esc(parecerTexto)}</div></section>`;
            const assinaturasBlock = `<div class="cm-sign">
                <div><div class="cm-line"></div><b>${esc(proNome)}</b><span>${esc(proCref)}</span><small>Avaliador responsável</small></div>
                <div><div class="cm-line"></div><b>${nomeAluno}</b><span>Assinatura do aluno</span><small>Ciência da comparação evolutiva</small></div></div>`;

            const headFull = `<div class="cm-head">
                <div class="cm-brand">
                    <div class="cm-kicker">${proClinica ? 'EvoluFísico' : 'Relatório'}</div>
                    <div class="cm-brand-name">${proClinica ? esc(proClinica) : 'EvoluFísico'}</div>
                    <div class="cm-brand-sub">Relatório comparativo de evolução física e composição corporal</div>
                </div>
                <div class="cm-pro"><b>${esc(proNome)}</b><span>${esc(proCref)}</span></div></div>`;
            const headMini = `<div class="cm-head cm-head-mini">
                <div class="cm-brand"><div class="cm-brand-name">Relatório comparativo · ${nomeAluno}</div><div class="cm-brand-sub">Período: ${periodoTxt}${diffDias == null ? '' : ` (${diffDias} dias)`}</div></div>
                <div class="cm-pro"><b>${esc(proNome)}</b><span>${esc(proCref)}</span></div></div>`;

            const shell = (n, inner, full) => `<section class="cm-page${n === totalPaginas ? ' cm-last' : ''}">${full ? headFull : headMini}${inner}
                <div class="cm-foot"><span>EvoluFísico v9.0-beta · Relatório comparativo · Emitido em ${emissao}</span><span>Página ${n} de ${totalPaginas}</span></div></section>`;

            const kpi = (label, valor, badge, de, acc) => `<div class="cm-kpi" style="--acc:${acc}"><small>${label}</small><b>${valor}</b><div>${badge}</div><em>${de}</em></div>`;

            const pagina1 = `
                <div class="cm-student">
                    <div><small>Aluno</small><h2>${nomeAluno}</h2></div>
                    <div class="cm-chips">
                        <span><small>Idade</small>${esc(String(a2.idade || a1.idade || '—'))}${(a2.idade || a1.idade) ? ' anos' : ''}</span>
                        <span><small>Estatura</small>${esc(String(a2.altura || a1.altura || '—'))}${(a2.altura || a1.altura) ? ' cm' : ''}</span>
                        <span><small>Protocolo</small>Pollock 7 + BIA</span>
                    </div>
                </div>
                <div class="cm-period">
                    <div class="cm-pt"><small>Avaliação base</small><b>${formatarData(a1.data_avaliacao) || '—'}</b><em>${esc(a1.checkin_semana || 'Sem 1')} · ${esc(a1.fase || '—')}</em></div>
                    <div class="cm-pline"><span>${diffDias == null ? '—' : diffDias + ' dias'}</span></div>
                    <div class="cm-pt cm-pt-now"><small>Avaliação atual</small><b>${formatarData(a2.data_avaliacao) || '—'}</b><em>${esc(a2.checkin_semana || 'Sem 4')} · ${esc(a2.fase || '—')}</em></div>
                </div>
                <div class="cm-kpis">
                    ${kpi('Peso corporal', `${ufmt(peso2)} kg`, deltaBadge(deltaPeso, ' kg', true), `${ufmt(peso1)} ➔ ${ufmt(peso2)}`, '#2563eb')}
                    ${kpi('% Gordura', g2 > 0 ? ufmt(g2) + '%' : '—', g1 > 0 && g2 > 0 ? deltaBadge(deltaG, '%', true) : '—', `${ufmt(g1)}% ➔ ${ufmt(g2)}%`, '#f59e0b')}
                    ${kpi('Massa muscular', m2 > 0 ? `${ufmt(m2)} kg` : '—', m1 > 0 && m2 > 0 ? deltaBadge(deltaM, ' kg', false) : '—', `${ufmt(m1)} ➔ ${ufmt(m2)}`, '#10b981')}
                    ${kpi('Cintura', c2 > 0 ? `${ufmt(c2)} cm` : '—', c1 > 0 && c2 > 0 ? deltaBadge(deltaC, ' cm', true) : '—', `${ufmt(c1)} ➔ ${ufmt(c2)}`, '#8b5cf6')}
                </div>
                <div class="cm-cols">
                    ${cmpTable('Perimetria', 'Região', buildRows(perimItems), '#2563eb')}
                    ${cmpTable('Dobras cutâneas · Pollock 7', 'Dobra', buildRows(dobrasItems), '#f59e0b')}
                </div>
                <div class="cm-note">Variações em verde indicam evolução favorável; em vermelho, desfavorável, considerando o sentido esperado de cada medida.</div>`;

            const biaCard = cmpTable('Bioimpedância', 'Parâmetro', buildRows(biaItems), '#10b981');
            const paginas = [shell(1, pagina1, true)];
            if (hasPhotos) {
                paginas.push(shell(2, `<div class="cm-cols">${biaCard}${compCard}</div>${photosBlock}`, false));
                paginas.push(shell(3, `${parecerBlock}${assinaturasBlock}`, false));
            } else {
                paginas.push(shell(2, `<div class="cm-cols">${biaCard}${compCard}</div>${parecerBlock}${assinaturasBlock}`, false));
            }

            wrapper.innerHTML = paginas.join('');

            const oldCmpTitle = document.title;
            document.title = ' ';
            const cleanupCmpPrint = () => {
                document.body.classList.remove('print-mode-single');
                document.title = oldCmpTitle;
                if (typeof window.removeEventListener === 'function') window.removeEventListener('afterprint', cleanupCmpPrint);
            };
            window.addEventListener('afterprint', cleanupCmpPrint, { once: true });
            document.body.classList.add('print-mode-single');
            // Mantém a abertura original da versão 8.9.3. O marcador serve
            // somente ao CSS de impressão, mesmo se o Android antecipar afterprint.
            document.body.dataset.efPrintTarget = 'report';
            clearTimeout(window.__efPrintGuardTimer);
            window.__efPrintGuardTimer = setTimeout(() => { delete document.body.dataset.efPrintTarget; }, 120000);
            window.print();
            setTimeout(cleanupCmpPrint, 1500);
        }

        function imprimirAvaliacaoDaModal() {
            const id = avaliacaoEmVisualizacaoId || window.avaliacaoEmVisualizacaoId;
            if (id) {
                fecharModalDetalhes();
                imprimirAvaliacaoIndividualPDF(id);
            }
        }

        function abrirModalDetalhes(id) {
            const aval = (typeof encontrarAvaliacaoPorId === 'function' ? encontrarAvaliacaoPorId(id) : null) || (Array.isArray(avaliacoes) ? avaliacoes.find(a => a && (a.id === id || String(a.id) === String(id))) : null);
            if (!aval) {
                console.warn('Avaliação não encontrada para o ID:', id);
                if (typeof efToast === 'function') {
                    efToast('Avaliação não encontrada no banco local.', 'warn');
                }
                return;
            }

            avaliacaoEmVisualizacaoId = aval.id;
            window.avaliacaoEmVisualizacaoId = aval.id;

            const elClientName = document.getElementById('modal-client-name');
            if (elClientName) elClientName.textContent = aval.nome || 'Aluno';

            const elDate = document.getElementById('modal-assessment-date');
            if (elDate) {
                const dataAval = typeof formatarData === 'function' ? formatarData(aval.data_avaliacao) : (aval.data_avaliacao || '—');
                const proxAval = typeof formatarData === 'function' ? formatarData(aval.data_proxima_avaliacao) : (aval.data_proxima_avaliacao || '');
                elDate.textContent = `${aval.checkin_semana || 'Check-in'} - ${dataAval} (Próxima: ${proxAval || 'A definir'})`;
            }

            const toNum = v => {
                if (v === null || v === undefined || v === '') return null;
                const n = parseFloat(String(v).replace(',', '.'));
                return Number.isFinite(n) ? n : null;
            };

            const pesoNum = toNum(aval.peso);
            const b = aval.bioimpedancia || {};
            const d = aval.dobras || {};
            const dRes = aval.dobras_resultado || {};
            const p = aval.perimetria || {};
            const fotos = aval.fotos || {};
            const pd = fotos.perfil_direito || fotos.lado || '';

            let somato = { classificacao: 'Dados insuficientes', x: null, y: null };
            try {
                if (typeof CalculadoraSomatotipo !== 'undefined' && typeof CalculadoraSomatotipo.doRegistro === 'function') {
                    somato = CalculadoraSomatotipo.doRegistro(aval) || somato;
                }
            } catch (errSomato) {
                console.warn('Falha no cálculo do somatotipo:', errSomato);
            }

            const rawPercG = dRes.percGordura != null ? dRes.percGordura : b.pgordura;
            const percGNum = toNum(rawPercG);
            const percG = percGNum !== null ? percGNum.toFixed(1) : null;
            const percM = percGNum !== null ? (100 - percGNum).toFixed(1) : null;

            const rawMmKg = dRes.massaMagra;
            const mmKgNum = toNum(rawMmKg);
            const mmKg = mmKgNum !== null ? mmKgNum.toFixed(1) : null;

            const rawMgKg = dRes.massaGorda != null ? dRes.massaGorda : b.gordura_kg;
            const mgKgNum = toNum(rawMgKg);
            const mgKg = mgKgNum !== null ? mgKgNum.toFixed(1) : null;

            let donutSvg = '';
            try {
                donutSvg = typeof renderDonutChartSvg === 'function' ? renderDonutChartSvg(percGNum, percM != null ? toNum(percM) : null) : '';
            } catch (eChart) {
                console.warn('Erro ao renderizar gráfico donut:', eChart);
                donutSvg = '<div style="text-align:center;font-size:0.75rem;color:#64748b;padding:2.5rem 0;">Gráfico indisponível</div>';
            }

            let barSvg = '';
            try {
                barSvg = typeof renderBarChartSvg === 'function' ? renderBarChartSvg(mmKgNum, mgKgNum) : '';
            } catch (eChart) {
                console.warn('Erro ao renderizar gráfico de barras:', eChart);
                barSvg = '<div style="text-align:center;font-size:0.75rem;color:#64748b;padding:2.5rem 0;">Gráfico indisponível</div>';
            }

            let somatoSvg = '';
            try {
                if (typeof CalculadoraSomatotipo !== 'undefined' && typeof CalculadoraSomatotipo.renderizarSomatocartaSvg === 'function') {
                    somatoSvg = CalculadoraSomatotipo.renderizarSomatocartaSvg(somato ? somato.x : null, somato ? somato.y : null);
                }
            } catch (eChart) {
                console.warn('Erro ao renderizar somatocarta:', eChart);
                somatoSvg = '<div style="text-align:center;font-size:0.75rem;color:#64748b;padding:1.5rem 0;">Somatocarta indisponível</div>';
            }

            let ef6Html = '';
            try {
                if (window.EF6 && typeof window.EF6.html === 'function') {
                    ef6Html = window.EF6.html(aval, 'app') || '';
                }
            } catch (eEf6) {
                console.warn('Erro ao renderizar síntese EF6:', eEf6);
            }

            const container = document.getElementById('modal-body-content');
            if (container) {
                container.innerHTML = `
                    <div class="stats-grid" style="margin-bottom:1.25rem;">
                        <div class="stat-card weight">
                            <span class="stat-label">Peso Corporal</span>
                            <span class="stat-value">${pesoNum !== null ? pesoNum.toFixed(1) + ' kg' : '-'}</span>
                        </div>
                        <div class="stat-card muscle">
                            <span class="stat-label">Massa Muscular</span>
                            <span class="stat-value">${mmKg !== null ? mmKg + ' kg' : (rawMmKg ? esc(rawMmKg) + ' kg' : '-')}</span>
                            <span style="font-size:0.75rem; color:var(--text-muted);">${b.pmusculo ? esc(b.pmusculo) + '% músculo' : ''}</span>
                        </div>
                        <div class="stat-card fat">
                            <span class="stat-label">% Gordura Pollock</span>
                            <span class="stat-value">${percG !== null ? percG + '%' : (rawPercG ? esc(rawPercG) + '%' : '-')}</span>
                            <span style="font-size:0.75rem; color:var(--text-muted);">${mgKg !== null ? mgKg + ' kg gordura' : (rawMgKg ? esc(rawMgKg) + ' kg gordura' : '')}</span>
                        </div>
                        <div class="stat-card age">
                            <span class="stat-label">Somatotipo</span>
                            <span class="stat-value" style="font-size:1.15rem;">${somato && somato.classificacao ? esc(somato.classificacao) : 'Dados insuficientes'}</span>
                            <span style="font-size:0.75rem; color:var(--text-muted);">Soma: ${aval.perimetria_soma ? esc(aval.perimetria_soma) + ' cm' : '-'}</span>
                        </div>
                    </div>

                    <div class="modal-detail-charts-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:15px;">
                        <div class="modal-detail-chart-card" style="border:1px solid var(--border-color, #e2e8f0); border-radius:8px; padding:10px; text-align:center; background:var(--surface-secondary, #ffffff);">
                            <div style="font-size:0.8rem; font-weight:700; margin-bottom:4px; color:var(--text-main);">% Gordura x Magra</div>
                            ${donutSvg}
                        </div>
                        <div class="modal-detail-chart-card" style="border:1px solid var(--border-color, #e2e8f0); border-radius:8px; padding:10px; text-align:center; background:var(--surface-secondary, #ffffff);">
                            <div style="font-size:0.8rem; font-weight:700; margin-bottom:4px; color:var(--text-main);">Massa Magra x Gorda</div>
                            ${barSvg}
                        </div>
                        <div class="modal-detail-chart-card" style="border:1px solid var(--border-color, #e2e8f0); border-radius:8px; padding:10px; text-align:center; background:var(--surface-secondary, #ffffff);">
                            <div style="font-size:0.8rem; font-weight:700; margin-bottom:4px; color:var(--text-main);">Somatocarta</div>
                            ${somatoSvg}
                        </div>
                    </div>

                    <div style="margin-bottom:15px;">
                        <h3 style="font-size:0.95rem; font-weight:800; border-bottom:1px solid var(--border-color, #cbd5e1); padding-bottom:4px; margin-bottom:10px; color:var(--text-main);">
                            📷 Registro Fotográfico Padronizado (5 Vistas)
                        </h3>
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:10px;">
                            <div style="text-align:center;">
                                <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted, #64748b);">1. Frente</span>
                                <div class="photo-frame" style="height:190px; background:#1c1c1e; border-radius:8px; overflow:hidden;">
                                    ${fotos.frente ? `<img src="${esc(fotos.frente)}" alt="Foto Frente" style="width:100%; height:100%; object-fit:contain;">` : '<div style="color:#8e8e93; font-size:0.75rem; padding-top:80px;">Sem foto</div>'}
                                </div>
                            </div>
                            <div style="text-align:center;">
                                <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted, #64748b);">2. Perfil Dir</span>
                                <div class="photo-frame" style="height:190px; background:#1c1c1e; border-radius:8px; overflow:hidden;">
                                    ${pd ? `<img src="${esc(pd)}" alt="Foto Perfil Direito" style="width:100%; height:100%; object-fit:contain;">` : '<div style="color:#8e8e93; font-size:0.75rem; padding-top:80px;">Sem foto</div>'}
                                </div>
                            </div>
                            <div style="text-align:center;">
                                <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted, #64748b);">3. Perfil Esq</span>
                                <div class="photo-frame" style="height:190px; background:#1c1c1e; border-radius:8px; overflow:hidden;">
                                    ${fotos.perfil_esquerdo ? `<img src="${esc(fotos.perfil_esquerdo)}" alt="Foto Perfil Esquerdo" style="width:100%; height:100%; object-fit:contain;">` : '<div style="color:#8e8e93; font-size:0.75rem; padding-top:80px;">Sem foto</div>'}
                                </div>
                            </div>
                            <div style="text-align:center;">
                                <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted, #64748b);">4. Costas</span>
                                <div class="photo-frame" style="height:190px; background:#1c1c1e; border-radius:8px; overflow:hidden;">
                                    ${fotos.costas ? `<img src="${esc(fotos.costas)}" alt="Foto Costas" style="width:100%; height:100%; object-fit:contain;">` : '<div style="color:#8e8e93; font-size:0.75rem; padding-top:80px;">Sem foto</div>'}
                                </div>
                            </div>
                            <div style="text-align:center;">
                                <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted, #64748b);">5. Livre / Postural</span>
                                <div class="photo-frame" style="height:190px; background:#1c1c1e; border-radius:8px; overflow:hidden;">
                                    ${fotos.extra ? `<img src="${esc(fotos.extra)}" alt="Foto Livre" style="width:100%; height:100%; object-fit:contain;">` : '<div style="color:#8e8e93; font-size:0.75rem; padding-top:80px;">Sem foto</div>'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-detail-parecer" style="background:var(--surface-secondary, #f8fafc); padding:1rem; border-radius:8px; border-left:4px solid var(--apple-blue, #0071e3); font-size:0.85rem; line-height:1.5; color:var(--text-main, #0f172a); border-top:1px solid var(--border-color, #e2e8f0); border-right:1px solid var(--border-color, #e2e8f0); border-bottom:1px solid var(--border-color, #e2e8f0);">
                        <strong style="color:var(--apple-blue, #0071e3); display:block; margin-bottom:4px;">✍️ Parecer Técnico & Recomendações:</strong>
                        ${esc(aval.parecer_profissional || 'Avaliação física concluída dentro dos padrões científicos.')}
                    </div>
                    ${ef6Html}
                `;
            }

            const modal = document.getElementById('view-modal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.setAttribute('aria-hidden', 'false');
            }
        }

        function fecharModalDetalhes() {
            const modal = document.getElementById('view-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.setAttribute('aria-hidden', 'true');
            }
            avaliacaoEmVisualizacaoId = null;
            window.avaliacaoEmVisualizacaoId = null;
        }

        function editarDaModal() {
            const id = avaliacaoEmVisualizacaoId || window.avaliacaoEmVisualizacaoId;
            if (id) {
                fecharModalDetalhes();
                if (typeof window.editarAvaliacao === 'function') {
                    window.editarAvaliacao(id);
                } else if (typeof editarAvaliacao === 'function') {
                    editarAvaliacao(id);
                }
            }
        }

        let sliderPoseAtiva = 'frente';
        let sliderModoAtivo = 'slider';
        let isDraggingSlider = false;

        function inicializarBeforeAfterSlider() {
            const stage = document.getElementById('ba-stage');
            const handle = document.getElementById('ba-handle');
            const layerAfter = document.getElementById('ba-layer-after');
            if (!stage || !handle || !layerAfter) return;

            function moverSlider(clientX) {
                const rect = stage.getBoundingClientRect();
                let x = clientX - rect.left;
                x = Math.max(0, Math.min(x, rect.width));
                const pct = (x / rect.width) * 100;

                layerAfter.style.width = `${pct}%`;
                handle.style.left = `${pct}%`;
            }

            handle.addEventListener('mousedown', (e) => {
                isDraggingSlider = true;
                e.preventDefault();
            });
            window.addEventListener('mouseup', () => { isDraggingSlider = false; });
            window.addEventListener('mousemove', (e) => {
                if (!isDraggingSlider) return;
                moverSlider(e.clientX);
            });

            handle.addEventListener('touchstart', () => {
                isDraggingSlider = true;
            }, { passive: true });
            window.addEventListener('touchend', () => { isDraggingSlider = false; });
            window.addEventListener('touchmove', (e) => {
                if (!isDraggingSlider || !e.touches || !e.touches[0]) return;
                moverSlider(e.touches[0].clientX);
            }, { passive: true });

            stage.addEventListener('click', (e) => {
                moverSlider(e.clientX);
            });
        }

        function mudarPoseSlider(pose) {
            sliderPoseAtiva = pose;
            ['frente', 'lado', 'costas'].forEach(p => {
                const btn = document.getElementById(`pose-btn-${p}`);
                if (btn) btn.classList.toggle('active', p === pose);
            });
            atualizarFotosDoSlider();
        }

        function alternarModoVisualizacaoFotos(modo) {
            sliderModoAtivo = modo;
            const btnSlider = document.getElementById('btn-mode-slider');
            const btnSide = document.getElementById('btn-mode-side');
            const stageWrapper = document.getElementById('ba-stage-wrapper');
            const sideWrapper = document.getElementById('ba-side-wrapper');

            if (modo === 'slider') {
                btnSlider?.classList.add('active');
                btnSide?.classList.remove('active');
                stageWrapper?.classList.remove('hidden');
                sideWrapper?.classList.add('hidden');
                atualizarFotosDoSlider();
            } else {
                btnSlider?.classList.remove('active');
                btnSide?.classList.add('active');
                stageWrapper?.classList.add('hidden');
                sideWrapper?.classList.remove('hidden');
            }
        }

        function atualizarFotosDoSlider() {
            const baseId = document.getElementById('compare-baseline-select')?.value;
            const currId = document.getElementById('compare-current-select')?.value;
            if (!baseId || !currId) return;

            const a1 = avaliacoes.find(a => String(a.id) === String(baseId));
            const a2 = avaliacoes.find(a => String(a.id) === String(currId));
            if (!a1 || !a2) return;

            const imgBefore = document.getElementById('ba-img-before');
            const imgAfter = document.getElementById('ba-img-after');
            const tagBefore = document.getElementById('ba-tag-before');
            const tagAfter = document.getElementById('ba-tag-after');

            if (tagBefore) tagBefore.textContent = `Antes (${a1.checkin_semana || 'Base'})`;
            if (tagAfter) tagAfter.textContent = `Depois (${a2.checkin_semana || 'Atual'})`;

            const f1 = a1.fotos?.[sliderPoseAtiva];
            const f2 = a2.fotos?.[sliderPoseAtiva];

            const fallbackSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'><rect width='100%' height='100%' fill='%232c2c2e'/><text x='50%' y='50%' fill='%238e8e93' font-size='16' text-anchor='middle'>Sem foto registrada</text></svg>";

            if (imgBefore) imgBefore.src = f1 || fallbackSvg;
            if (imgAfter) imgAfter.src = f2 || fallbackSvg;
        }

        let avaliacaoLaudoWebAtiva = null;

        function gerarLaudoWeb(id) {
            const aval = (typeof encontrarAvaliacaoPorId === 'function' ? encontrarAvaliacaoPorId(id) : null) || avaliacoes.find(a => a.id === id || String(a.id) === String(id));
            if (!aval) return;

            avaliacaoLaudoWebAtiva = aval;
            const sub = document.getElementById('web-report-subtitle');
            if (sub) sub.textContent = `${aval.nome} - ${formatarData(aval.data_avaliacao)} (${aval.checkin_semana || 'Check-in'})`;

            const linkInput = document.getElementById('web-link-input');
            const baseUrl = window.location.origin + window.location.pathname;
            const webLink = `${baseUrl}#laudo=${aval.id}`;
            if (linkInput) linkInput.value = webLink;

            document.getElementById('web-report-modal').classList.remove('hidden');
        }

        function fecharModalLaudoWeb() {
            document.getElementById('web-report-modal').classList.add('hidden');
        }

        function copiarLinkLaudoWeb() {
            const linkInput = document.getElementById('web-link-input');
            if (!linkInput) return;
            linkInput.select();
            navigator.clipboard.writeText(linkInput.value).then(() => {
                alert('Link do Laudo Web copiado para a área de transferência!');
            }).catch(() => {
                alert('Link selecionado. Pressione Ctrl+C para copiar.');
            });
        }

        function compartilharViaWhatsApp() {
            if (!avaliacaoLaudoWebAtiva) return;
            const aval = avaliacaoLaudoWebAtiva;
            const dRes = aval.dobras_resultado || {};
            const link = document.getElementById('web-link-input')?.value || '';

            const textoMsg = `Olá, *${aval.nome}*! 👋\n\n` +
                `Seu *Laudo de Avaliação Física & Composição Corporal* (${aval.checkin_semana || 'Check-in'}) está pronto!\n\n` +
                `📊 *Resultados Principais:*\n` +
                `• Peso: *${aval.peso ? aval.peso.toFixed(1) : '-'} kg*\n` +
                `• % Gordura Pollock: *${dRes.percGordura || aval.bioimpedancia?.pgordura || '-'}%*\n` +
                `• Massa Magra: *${dRes.massaMagra || '-'} kg*\n` +
                `• Retorno: *${formatarData(aval.data_proxima_avaliacao) || 'A combinar'}*\n\n` +
                `📱 *Acesse seu Laudo Interativo no Celular com Gráficos e Fotos:*\n${link}\n\n` +
                (aval.avaliador_nome ? `_Profissional: ${aval.avaliador_nome}${aval.avaliador_registro ? ' (' + aval.avaliador_registro + ')' : ''}_` : '');

            const foneLimpo = (aval.whatsapp || '').replace(/[^0-9]/g, '');
            const urlWhats = foneLimpo.length >= 10
                ? `https://api.whatsapp.com/send?phone=${foneLimpo.length>=12&&foneLimpo.startsWith('55')?foneLimpo:'55'+foneLimpo}&text=${encodeURIComponent(textoMsg)}`
                : `https://api.whatsapp.com/send?text=${encodeURIComponent(textoMsg)}`;

            if (!confirm('Atenção: o link do laudo só abre no navegador/dispositivo do profissional. O aluno verá o resumo com os resultados, mas não conseguirá abrir o laudo pelo link. Enviar mesmo assim?')) return;
            window.open(urlWhats, '_blank', 'noopener,noreferrer');
        }

        function abrirLaudoWebPaciente() {
            if (!avaliacaoLaudoWebAtiva) return;
            fecharModalLaudoWeb();
            abrirVisualizacaoPacienteWeb(avaliacaoLaudoWebAtiva.id);
        }

        function abrirVisualizacaoPacienteWeb(id) {
            const aval = (typeof encontrarAvaliacaoPorId === 'function' ? encontrarAvaliacaoPorId(id) : null) || avaliacoes.find(a => a.id === id || String(a.id) === String(id));
            if (!aval) {
                alert('Avaliação não encontrada neste dispositivo. Os laudos ficam salvos apenas no navegador do profissional; peça a ele o laudo em PDF.');
                return;
            }

            avaliacaoLaudoWebAtiva = aval;
            avaliacaoEmVisualizacaoId = id;

            document.getElementById('pv-aluno-nome').textContent = aval.nome;
            document.getElementById('pv-data-badge').textContent = `Avaliação: ${formatarData(aval.data_avaliacao)} | Retorno: ${formatarData(aval.data_proxima_avaliacao) || 'A definir'}`;

            const dRes = aval.dobras_resultado || {};
            const b = aval.bioimpedancia || {};
            const p = aval.perimetria || {};
            const d = aval.dobras || {};
            const fotos = aval.fotos || {};
            const pd = fotos.perfil_direito || fotos.lado || '';

            const somato = CalculadoraSomatotipo.doRegistro(aval);

            const mm = parseFloat(dRes.massaMagra) || null;
            const mg = parseFloat(dRes.massaGorda || b.gordura_kg) || null;
            const pg = parseFloat(dRes.percGordura || b.pgordura) || null;

            const container = document.getElementById('patient-view-content');
            container.innerHTML = `
                <div class="stats-grid" style="margin: 1.5rem 0;">
                    <div class="stat-card weight">
                        <span class="stat-label">Peso Corporal</span>
                        <span class="stat-value">${aval.peso ? aval.peso.toFixed(1) + ' kg' : '-'}</span>
                        <span style="font-size:0.75rem; color:var(--text-muted);">Estatura: ${aval.altura || '-'} cm</span>
                    </div>
                    <div class="stat-card muscle">
                        <span class="stat-label">Massa Muscular</span>
                        <span class="stat-value">${mm ? mm.toFixed(1) + ' kg' : '-'}</span>
                        <span style="font-size:0.75rem; color:var(--text-muted);">${b.pmusculo ? b.pmusculo + '% músculo' : ''}</span>
                    </div>
                    <div class="stat-card fat">
                        <span class="stat-label">% Gordura Pollock</span>
                        <span class="stat-value">${pg ? pg.toFixed(1) + '%' : '-'}</span>
                        <span style="font-size:0.75rem; color:var(--text-muted);">${mg ? mg.toFixed(1) + ' kg adiposo' : ''}</span>
                    </div>
                    <div class="stat-card age">
                        <span class="stat-label">Somatotipo</span>
                        <span class="stat-value" style="font-size:1.15rem;">${somato.classificacao}</span>
                        <span style="font-size:0.75rem; color:var(--text-muted);">IMC: ${b.imc || '-'}</span>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px; margin-bottom:1.5rem;">
                    <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:12px; padding:1rem; text-align:center;">
                        <h4 style="font-size:0.85rem; font-weight:700; margin-bottom:0.5rem;">% de Gordura x % Massa Magra</h4>
                        ${renderDonutChartSvg(pg, (100 - pg).toFixed(1))}
                    </div>
                    <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:12px; padding:1rem; text-align:center;">
                        <h4 style="font-size:0.85rem; font-weight:700; margin-bottom:0.5rem;">Massa Magra x Gorda (kg)</h4>
                        ${renderBarChartSvg(mm, mg)}
                    </div>
                    <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:12px; padding:1rem; text-align:center;">
                        <h4 style="font-size:0.85rem; font-weight:700; margin-bottom:0.5rem;">Somatocarta Heath-Carter</h4>
                        ${CalculadoraSomatotipo.renderizarSomatocartaSvg(somato.x, somato.y)}
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:15px; margin-bottom:1.5rem;">
                    <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:12px; padding:1rem;">
                        <div style="font-size:0.88rem; font-weight:800; border-bottom:1.5px solid var(--apple-blue); padding-bottom:5px; margin-bottom:8px; color:var(--text-main); display:flex; justify-content:space-between;">
                            <span>🧬 Bioimpedância Elétrica (BIA)</span>
                            <span>${b.peso || aval.peso || '-'} kg</span>
                        </div>
                        <table style="width:100%; border-collapse:collapse; font-size:0.82rem; line-height:1.45;">
                            <tr><td style="padding:2px 0;">Peso na BIA:</td><td style="font-weight:700; text-align:right;">${b.peso ? b.peso.toFixed(1) : (aval.peso ? aval.peso.toFixed(1) : '-')} kg</td></tr>
                            <tr><td style="padding:2px 0;">% Gordura BIA:</td><td style="font-weight:700; text-align:right; color:#dc2626;">${b.pgordura ? b.pgordura + '%' : '-'}</td></tr>
                            <tr><td style="padding:2px 0;">Massa Muscular (MME):</td><td style="font-weight:700; text-align:right; color:#16a34a;">${b.mme ? b.mme.toFixed(1) + ' kg' : '-'}</td></tr>
                            <tr><td style="padding:2px 0;">% Músculo Esquelético:</td><td style="font-weight:700; text-align:right;">${b.pmusculo ? b.pmusculo + '%' : '-'}</td></tr>
                            <tr><td style="padding:2px 0;">Massa Gorda:</td><td style="font-weight:700; text-align:right;">${b.gordura_kg ? b.gordura_kg + ' kg' : '-'}</td></tr>
                            <tr><td style="padding:2px 0;">Taxa Metabólica Basal:</td><td style="font-weight:700; text-align:right;">${b.tmb ? b.tmb + ' kcal' : '-'}</td></tr>
                            <tr><td style="padding:2px 0;">Gordura Visceral:</td><td style="font-weight:700; text-align:right;">${(b.visceral !== undefined && b.visceral !== null) ? 'Nível ' + b.visceral : ((b.gordura_visceral !== undefined) ? 'Nível ' + b.gordura_visceral : '-')}</td></tr>
                            <tr><td style="padding:2px 0;">Idade Corporal:</td><td style="font-weight:700; text-align:right;">${b.idade_corporal ? b.idade_corporal + ' anos' : '-'}</td></tr>
                            <tr><td style="padding:2px 0;">IMC:</td><td style="font-weight:700; text-align:right;">${b.imc || '-'} kg/m²</td></tr>
                            <tr><td style="padding:2px 0;">Classificação de Risco:</td><td style="font-weight:700; text-align:right;">${b.risco || 'Normal'}</td></tr>
                        </table>
                    </div>

                    <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:12px; padding:1rem;">
                        <div style="font-size:0.88rem; font-weight:800; border-bottom:1.5px solid var(--apple-blue); padding-bottom:5px; margin-bottom:8px; color:var(--text-main); display:flex; justify-content:space-between;">
                            <span>📏 Perimetrias / Circunferências</span>
                            <span>Total: ${aval.perimetria_soma || '-'} cm</span>
                        </div>
                        <table style="width:100%; border-collapse:collapse; font-size:0.82rem; line-height:1.45;">
                            <tr><td style="padding:2px 0;">Pescoço:</td><td style="font-weight:700; text-align:right;">${p.pescoco || '-'} cm</td></tr>
                            <tr><td style="padding:2px 0;">Ombros / Tórax:</td><td style="font-weight:700; text-align:right;">${p.ombros || p.torax || '-'} cm</td></tr>
                            <tr><td style="padding:2px 0;">Cintura:</td><td style="font-weight:700; text-align:right;">${p.cintura || '-'} cm</td></tr>
                            <tr><td style="padding:2px 0;">Abdômen:</td><td style="font-weight:700; text-align:right;">${p.abdomen || '-'} cm</td></tr>
                            <tr><td style="padding:2px 0;">Quadril:</td><td style="font-weight:700; text-align:right;">${p.quadril || '-'} cm</td></tr>
                            <tr><td style="padding:2px 0;">Braço Direito:</td><td style="font-weight:700; text-align:right;">${p.braco_dir || '-'} cm</td></tr>
                            <tr><td style="padding:2px 0;">Braço Esquerdo:</td><td style="font-weight:700; text-align:right;">${p.braco_esq || '-'} cm</td></tr>
                            <tr><td style="padding:2px 0;">Coxa Direita:</td><td style="font-weight:700; text-align:right;">${p.coxa_dir || '-'} cm</td></tr>
                            <tr><td style="padding:2px 0;">Panturrilha:</td><td style="font-weight:700; text-align:right;">${p.panturrilha || '-'} cm</td></tr>
                            <tr><td style="padding:2px 0;">RCQ:</td><td style="font-weight:700; text-align:right;">${b.rcq || ((parseFloat(p.cintura) > 0 && parseFloat(p.quadril) > 0) ? (parseFloat(p.cintura)/parseFloat(p.quadril)).toFixed(2) : '-')}</td></tr>
                        </table>
                    </div>

                    <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:12px; padding:1rem;">
                        <div style="font-size:0.88rem; font-weight:800; border-bottom:1.5px solid var(--apple-blue); padding-bottom:5px; margin-bottom:8px; color:var(--text-main); display:flex; justify-content:space-between;">
                            <span>📐 DOBRAS POLLOCK (mm)</span>
                            <span>Soma: ${dRes.soma || '-'} mm</span>
                        </div>
                        <table style="width:100%; border-collapse:collapse; font-size:0.82rem; line-height:1.45;">
                            <tr><td style="padding:2px 0;">Tríceps:</td><td style="font-weight:700; text-align:right;">${d.triceps || '-'} mm</td></tr>
                            <tr><td style="padding:2px 0;">Subescapular:</td><td style="font-weight:700; text-align:right;">${d.subescapular || '-'} mm</td></tr>
                            <tr><td style="padding:2px 0;">Peitoral:</td><td style="font-weight:700; text-align:right;">${d.peitoral || '-'} mm</td></tr>
                            <tr><td style="padding:2px 0;">Axilar Média:</td><td style="font-weight:700; text-align:right;">${d.axilar || '-'} mm</td></tr>
                            <tr><td style="padding:2px 0;">Supra-ilíaca:</td><td style="font-weight:700; text-align:right;">${d.suprailiaca || '-'} mm</td></tr>
                            <tr><td style="padding:2px 0;">Abdominal:</td><td style="font-weight:700; text-align:right;">${d.abdominal || '-'} mm</td></tr>
                            <tr><td style="padding:2px 0;">Coxa:</td><td style="font-weight:700; text-align:right;">${d.coxa || '-'} mm</td></tr>
                            <tr><td style="padding:2px 0;">Densidade Corporal:</td><td style="font-weight:700; text-align:right;">${dRes.densidade || '-'} g/ml</td></tr>
                            <tr><td style="padding:2px 0;">% Gordura Pollock:</td><td style="font-weight:700; text-align:right; color:#2563eb;">${dRes.percGordura || '-'}%</td></tr>
                            <tr><td style="padding:2px 0;">Classificação:</td><td style="font-weight:700; text-align:right;">${dRes.classificacao || 'Normal'}</td></tr>
                        </table>
                    </div>
                </div>

                <div style="margin-bottom:1.5rem;">
                    <h3 style="font-size:1.05rem; font-weight:700; color:var(--text-main); margin-bottom:0.75rem;">
                        📷 Registro Fotográfico Padronizado (5 Vistas)
                    </h3>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:10px;">
                        <div style="text-align:center;">
                            <span style="font-size:0.75rem; font-weight:700; color:#64748b;">1. Frente</span>
                            <div class="photo-frame" style="height:210px; background:#1c1c1e; border-radius:10px; overflow:hidden;">
                                ${fotos.frente ? `<img src="${esc(fotos.frente)}" style="width:100%; height:100%; object-fit:contain;">` : '<div style="color:#8e8e93; font-size:0.8rem; padding-top:90px;">Sem foto</div>'}
                            </div>
                        </div>
                        <div style="text-align:center;">
                            <span style="font-size:0.75rem; font-weight:700; color:#64748b;">2. Perfil Dir</span>
                            <div class="photo-frame" style="height:210px; background:#1c1c1e; border-radius:10px; overflow:hidden;">
                                ${pd ? `<img src="${esc(pd)}" style="width:100%; height:100%; object-fit:contain;">` : '<div style="color:#8e8e93; font-size:0.8rem; padding-top:90px;">Sem foto</div>'}
                            </div>
                        </div>
                        <div style="text-align:center;">
                            <span style="font-size:0.75rem; font-weight:700; color:#64748b;">3. Perfil Esq</span>
                            <div class="photo-frame" style="height:210px; background:#1c1c1e; border-radius:10px; overflow:hidden;">
                                ${fotos.perfil_esquerdo ? `<img src="${esc(fotos.perfil_esquerdo)}" style="width:100%; height:100%; object-fit:contain;">` : '<div style="color:#8e8e93; font-size:0.8rem; padding-top:90px;">Sem foto</div>'}
                            </div>
                        </div>
                        <div style="text-align:center;">
                            <span style="font-size:0.75rem; font-weight:700; color:#64748b;">4. Costas</span>
                            <div class="photo-frame" style="height:210px; background:#1c1c1e; border-radius:10px; overflow:hidden;">
                                ${fotos.costas ? `<img src="${esc(fotos.costas)}" style="width:100%; height:100%; object-fit:contain;">` : '<div style="color:#8e8e93; font-size:0.8rem; padding-top:90px;">Sem foto</div>'}
                            </div>
                        </div>
                        <div style="text-align:center;">
                            <span style="font-size:0.75rem; font-weight:700; color:#64748b;">5. Livre / Postural</span>
                            <div class="photo-frame" style="height:210px; background:#1c1c1e; border-radius:10px; overflow:hidden;">
                                ${fotos.extra ? `<img src="${esc(fotos.extra)}" style="width:100%; height:100%; object-fit:contain;">` : '<div style="color:#8e8e93; font-size:0.8rem; padding-top:90px;">Sem foto</div>'}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="professional-notes-box" style="background:var(--surface-secondary); padding:1.25rem; border-radius:var(--radius-md); border-left:4px solid var(--apple-blue); margin-bottom:1.5rem;">
                    <div style="font-weight:700; color:var(--apple-blue); margin-bottom:0.4rem;">✍️ Parecer Técnico do Profissional</div>
                    <div style="font-size:0.9rem; line-height:1.6;">${esc(aval.parecer_profissional || 'Avaliação física realizada com sucesso dentro dos padrões recomendados.')}</div>
                    ${b.analise_texto ? `<div style="margin-top:8px; font-size:0.82rem; color:#475569; border-top:1px dashed #cbd5e1; padding-top:6px;"><strong>Análise da Bioimpedância:</strong> ${esc(b.analise_texto)}</div>` : ''}
                </div>
                ${window.EF6 ? EF6.html(aval, 'app') : ''}
            `;

            const overlay = document.getElementById('patient-view-overlay');
            if (overlay) {
                overlay.classList.remove('hidden');
                overlay.scrollTop = 0;
            }
        }

        function fecharVisualizacaoPacienteWeb() {
            const overlay = document.getElementById('patient-view-overlay');
            if (overlay) overlay.classList.add('hidden');
        }

        function imprimirDoPacienteWeb() {
            if (avaliacaoLaudoWebAtiva || avaliacaoEmVisualizacaoId) {
                const id = (avaliacaoLaudoWebAtiva && avaliacaoLaudoWebAtiva.id) || avaliacaoEmVisualizacaoId;
                imprimirAvaliacaoIndividualPDF(id);
            }
        }

        function preencherSeletoresComparacao() {
            window.dispatchEvent(new Event('ef-records-changed'));
            const clientSelect = document.getElementById('compare-client-select');
            const baseSelect = document.getElementById('compare-baseline-select');
            const currSelect = document.getElementById('compare-current-select');
            if (!clientSelect || !baseSelect || !currSelect) return;

            const clientesMap = new Map();
            avaliacoes.forEach(a => {
                const chave = EFIdentity.key(a);
                if (!clientesMap.has(chave)) clientesMap.set(chave, a.nome);
            });

            const sel = clientSelect.value;
            clientSelect.innerHTML = '';

            if (clientesMap.size === 0) {
                clientSelect.innerHTML = '<option value="">Nenhum aluno no banco</option>';
                baseSelect.innerHTML = '<option value="">Sem avaliações</option>';
                currSelect.innerHTML = '<option value="">Sem avaliações</option>';
                return;
            }

            clientesMap.forEach((nome, chave) => {
                const opt = document.createElement('option');
                opt.value = chave;
                opt.textContent = `${nome} (${chave})`;
                if (chave === sel) opt.selected = true;
                clientSelect.appendChild(opt);
            });

            aoMudarClienteComparacao();
        }

        function aoMudarClienteComparacao() {
            const clientSelect = document.getElementById('compare-client-select');
            const baseSelect = document.getElementById('compare-baseline-select');
            const currSelect = document.getElementById('compare-current-select');
            const chave = clientSelect.value;

            const lista = avaliacoes.filter(a => (EFIdentity.key(a) === chave));

            const parBaseAnterior = baseSelect.value, parAtualAnterior = currSelect.value;
            baseSelect.innerHTML = '';
            currSelect.innerHTML = '';

            if (lista.length < 2) {
                const msg = lista.length === 1 
                    ? '1 avaliação (cadastre outra para comparar)' 
                    : 'Nenhuma avaliação encontrada';
                baseSelect.innerHTML = `<option value="">${msg}</option>`;
                currSelect.innerHTML = `<option value="">${msg}</option>`;
                renderizarComparacaoVazia();
                return;
            }

            lista.forEach((a, i) => {
                const label = `${a.checkin_semana || 'Check-in'} - ${formatarData(a.data_avaliacao)} (${a.peso}kg)`;
                const optA = document.createElement('option');
                optA.value = a.id;
                optA.textContent = label;
                baseSelect.appendChild(optA);

                const optB = document.createElement('option');
                optB.value = a.id;
                optB.textContent = label;
                currSelect.appendChild(optB);
            });

            baseSelect.selectedIndex = 0;
            currSelect.selectedIndex = lista.length - 1;
            if (parBaseAnterior && parAtualAnterior && parBaseAnterior !== parAtualAnterior && lista.some(a => a.id === parBaseAnterior) && lista.some(a => a.id === parAtualAnterior)) {
                baseSelect.value = parBaseAnterior;
                currSelect.value = parAtualAnterior;
            }

            renderizarComparacao();
        }

        function renderizarComparacaoVazia() {
            document.getElementById('comp-client-name').textContent = 'Selecione um aluno com ao menos 2 avaliações';
            document.getElementById('comp-period-badge').textContent = 'Aguardando seleção';
            document.getElementById('comparison-dobras-tbody').innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:var(--text-muted);">Cadastre duas avaliações para visualizar o comparativo de dobras cutâneas.</td></tr>';
            document.getElementById('comparison-bia-tbody').innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:var(--text-muted);">Cadastre duas avaliações para visualizar o comparativo de bioimpedância.</td></tr>';
            document.getElementById('comparison-circ-tbody').innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:var(--text-muted);">-</td></tr>';
            if (window.EF781) { EF781.vazio(); } else { document.getElementById('comp-pro-notes-display').textContent = 'Nenhuma observação técnica disponível.'; }
        }

        function renderizarComparacao() {
            const baseId = document.getElementById('compare-baseline-select').value;
            const currId = document.getElementById('compare-current-select').value;
            if (!baseId || !currId) { renderizarComparacaoVazia(); return; }

            const a1 = avaliacoes.find(a => String(a.id) === String(baseId));
            const a2 = avaliacoes.find(a => String(a.id) === String(currId));
            if (!a1 || !a2) return;

            document.getElementById('print-data-emissao').textContent = new Date().toLocaleDateString('pt-BR');

            document.getElementById('comp-client-name').textContent = a2.nome || a1.nome;
            document.getElementById('comp-email').textContent = a2.email || '-';
            document.getElementById('comp-whatsapp').textContent = a2.whatsapp || '-';
            document.getElementById('comp-fases').textContent = `${a1.fase} ➔ ${a2.fase}`;
            const compProNome = (a2.avaliador_nome || a1.avaliador_nome || localStorage.getItem('evolufisico_pro_nome') || 'Profissional Responsável').trim();
            let compProCref = (a2.avaliador_registro || a1.avaliador_registro || localStorage.getItem('evolufisico_pro_cref') || '').trim();
            if (!compProCref) compProCref = 'CREF Regular';
            else if (!/cref/i.test(compProCref)) compProCref = `CREF: ${compProCref}`;

            document.getElementById('comp-avaliador').textContent = `${compProNome} (${compProCref})`;

            const elCompProNome = document.getElementById('print-comp-pro-nome');
            if (elCompProNome) elCompProNome.textContent = `Profissional: ${compProNome}`;

            const elCompProCref = document.getElementById('print-comp-pro-cref');
            if (elCompProCref) elCompProCref.textContent = compProCref;

            const d1 = new Date(a1.data_avaliacao);
            const d2 = new Date(a2.data_avaliacao);
            const diffDias = Math.round(Math.abs((d2 - d1) / (1000 * 60 * 60 * 24)));
            document.getElementById('comp-period-badge').textContent = `${formatarData(a1.data_avaliacao)} (${a1.checkin_semana}) ➔ ${formatarData(a2.data_avaliacao)} (${a2.checkin_semana}) | ${diffDias} dias`;

            atualizarCardDestaque('comp-stat-peso', 'comp-diff-peso', a1.peso, a2.peso, 'kg', true);
            atualizarCardDestaque('comp-stat-mme', 'comp-diff-mme', a1.bioimpedancia?.mme || 0, a2.bioimpedancia?.mme || 0, 'kg', false);
            atualizarCardDestaque('comp-stat-gordura-bia', 'comp-diff-gordura-bia', a1.bioimpedancia?.pgordura || 0, a2.bioimpedancia?.pgordura || 0, '%', true);
            atualizarCardDestaque('comp-stat-idade-corp', 'comp-diff-idade-corp', a1.bioimpedancia?.idade_corporal || a1.idade || 0, a2.bioimpedancia?.idade_corporal || a2.idade || 0, 'anos', true);

            document.getElementById('th-circ-base-title').textContent = `${a1.checkin_semana}`;
            document.getElementById('th-circ-curr-title').textContent = `${a2.checkin_semana}`;

            const p1 = a1.perimetria || {};
            const p2 = a2.perimetria || {};

            const linhasCirc = [
                { id: 'pescoco', nome: 'Pescoço (cm)', un: 'cm', v1: p1.pescoco, v2: p2.pescoco, inv: false },
                { id: 'ombros', nome: 'Ombros (cm)', un: 'cm', v1: p1.ombros, v2: p2.ombros, inv: false },
                { id: 'abdomen', nome: 'Abdômen', un: 'cm', v1: p1.abdomen, v2: p2.abdomen, inv: true },
                { id: 'cintura', nome: 'Cintura (Menor Curvatura)', un: 'cm', v1: p1.cintura || a1.cintura, v2: p2.cintura || a2.cintura, inv: true },
                { id: 'quadril', nome: 'Quadril (Glúteo)', un: 'cm', v1: p1.quadril || a1.quadril, v2: p2.quadril || a2.quadril, inv: false },
                { id: 'braco_esq', nome: 'Braço Esquerdo', un: 'cm', v1: p1.braco_esq || a1.braco_esq, v2: p2.braco_esq || a2.braco_esq, inv: false },
                { id: 'braco_dir', nome: 'Braço Direito', un: 'cm', v1: p1.braco_dir || a1.braco_dir, v2: p2.braco_dir || a2.braco_dir, inv: false },
                { id: 'coxa_esq', nome: 'Coxa Esquerda', un: 'cm', v1: p1.coxa_esq || a1.coxa_esq, v2: p2.coxa_esq || a2.coxa_esq, inv: false },
                { id: 'coxa_dir', nome: 'Coxa Direita', un: 'cm', v1: p1.coxa_dir || a1.coxa_dir, v2: p2.coxa_dir || a2.coxa_dir, inv: false },
                { id: 'panturrilha', nome: 'Panturrilha', un: 'cm', v1: p1.panturrilha || a1.panturrilha, v2: p2.panturrilha || a2.panturrilha, inv: false },
                { id: 'soma_peri', nome: '⚡ Soma da Perimetria', un: 'cm', v1: a1.perimetria_soma, v2: a2.perimetria_soma, inv: false }
            ];

            const tbodyCirc = document.getElementById('comparison-circ-tbody');
            tbodyCirc.innerHTML = '';
            linhasCirc.forEach(item => tbodyCirc.appendChild(criarLinhaTabela(item)));

            document.getElementById('th-dobras-base-title').textContent = `${a1.checkin_semana} (${formatarData(a1.data_avaliacao)})`;
            document.getElementById('th-dobras-curr-title').textContent = `${a2.checkin_semana} (${formatarData(a2.data_avaliacao)})`;

            const linhasDobras = [
                { id: 'triceps', nome: 'Tricipital', un: 'mm', v1: a1.dobras?.triceps, v2: a2.dobras?.triceps, inv: true },
                { id: 'subescapular', nome: 'Subescapular', un: 'mm', v1: a1.dobras?.subescapular, v2: a2.dobras?.subescapular, inv: true },
                { id: 'suprailiaca', nome: 'Supra-ilíaca', un: 'mm', v1: a1.dobras?.suprailiaca, v2: a2.dobras?.suprailiaca, inv: true },
                { id: 'peitoral', nome: 'Peitoral', un: 'mm', v1: a1.dobras?.peitoral, v2: a2.dobras?.peitoral, inv: true },
                { id: 'axilar', nome: 'Axilar Média', un: 'mm', v1: a1.dobras?.axilar, v2: a2.dobras?.axilar, inv: true },
                { id: 'abdominal', nome: 'Abdominal', un: 'mm', v1: a1.dobras?.abdominal, v2: a2.dobras?.abdominal, inv: true },
                { id: 'coxa', nome: 'Coxa', un: 'mm', v1: a1.dobras?.coxa, v2: a2.dobras?.coxa, inv: true },
                { id: 'soma', nome: '⚡ Soma Antropometria (Σ7)', un: 'mm', v1: parseFloat(a1.dobras_resultado?.soma), v2: parseFloat(a2.dobras_resultado?.soma), inv: true },
                { id: 'pgordura', nome: 'Percentual de Gordura (%G Pollock)', un: '%', v1: parseFloat(a1.dobras_resultado?.percGordura), v2: parseFloat(a2.dobras_resultado?.percGordura), inv: true },
                { id: 'massagorda', nome: 'Massa Gorda Estimada', un: 'kg', v1: parseFloat(a1.dobras_resultado?.massaGorda), v2: parseFloat(a2.dobras_resultado?.massaGorda), inv: true },
                { id: 'massamagra', nome: 'Massa Magra Estimada', un: 'kg', v1: parseFloat(a1.dobras_resultado?.massaMagra), v2: parseFloat(a2.dobras_resultado?.massaMagra), inv: false }
            ];

            const tbodyDobras = document.getElementById('comparison-dobras-tbody');
            tbodyDobras.innerHTML = '';
            linhasDobras.forEach(item => tbodyDobras.appendChild(criarLinhaTabela(item)));

            document.getElementById('dobras-analise-texto').textContent = a2.dobras_resultado ? 
                `Na avaliação de ${formatarData(a2.data_avaliacao)}, a soma das 7 dobras totalizou ${a2.dobras_resultado.soma} mm com ${a2.dobras_resultado.percGordura}% de gordura (${a2.dobras_resultado.classificacao}). Variação de ${(parseFloat(a2.dobras_resultado.soma) - parseFloat(a1.dobras_resultado?.soma || 0)).toFixed(1)} mm em relação à avaliação anterior.` :
                '-';

            document.getElementById('th-bia-base-title').textContent = `${a1.checkin_semana}`;
            document.getElementById('th-bia-curr-title').textContent = `${a2.checkin_semana}`;

            const b1 = a1.bioimpedancia || {};
            const b2 = a2.bioimpedancia || {};

            const linhasBia = [
                { id: 'pgordura_bia', nome: '1. Percentual de gordura', un: '%', v1: b1.pgordura, v2: b2.pgordura, inv: true },
                { id: 'pmusculo_bia', nome: '2. Percentual de músculo esquelético', un: '%', v1: b1.pmusculo, v2: b2.pmusculo, inv: false },
                { id: 'imc_bia', nome: '3. IMC', un: 'kg/m²', v1: b1.imc, v2: b2.imc, inv: true },
                { id: 'gordura_kg', nome: '4. Kg de gordura', un: 'kg', v1: b1.gordura_kg, v2: b2.gordura_kg, inv: true },
                { id: 'mme', nome: '5. Kg Massa muscular', un: 'kg', v1: b1.mme, v2: b2.mme, inv: false },
                { id: 'rcq', nome: '6. Relação cintura/quadril (RCQ)', un: '', v1: b1.rcq, v2: b2.rcq, inv: true },
                { id: 'tmb', nome: '7. Metabolismo basal (TMB)', un: 'kcal', v1: b1.tmb, v2: b2.tmb, inv: false },
                { id: 'visceral', nome: '8. Gordura visceral', un: 'nível', v1: b1.visceral, v2: b2.visceral, inv: true },
                { id: 'idade_corp', nome: '9. Idade corporal', un: 'anos', v1: b1.idade_corporal, v2: b2.idade_corporal, inv: true },
                { id: 'risco', nome: '10. Risco à Saúde', un: '', v1: b1.risco, v2: b2.risco, isText: true }
            ];

            const tbodyBia = document.getElementById('comparison-bia-tbody');
            tbodyBia.innerHTML = '';
            linhasBia.forEach(item => {
                if (item.isText) {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="metric-name">${esc(item.nome)}</td>
                        <td><strong>${item.v1 || '-'}</strong></td>
                        <td><strong>${item.v2 || '-'}</strong></td>
                        <td><span class="delta-badge delta-neutral">${item.v1 === item.v2 ? 'Estável' : 'Alterado'}</span></td>
                        <td><span style="color:var(--text-muted);">-</span></td>
                    `;
                    tbodyBia.appendChild(tr);
                } else {
                    tbodyBia.appendChild(criarLinhaTabela(item));
                }
            });

            const percG = a2.dobras_resultado?.percGordura || b2.pgordura || null;
            const percM = percG ? (100 - parseFloat(percG)).toFixed(1) : null;
            const mmKg = a2.dobras_resultado?.massaMagra || null;
            const mgKg = a2.dobras_resultado?.massaGorda || b2.gordura_kg || null;

            document.getElementById('donut-chart-container').innerHTML = renderDonutChartSvg(percG, percM);
            document.getElementById('bar-chart-container').innerHTML = renderBarChartSvg(mmKg, mgKg);

            atualizarFotoComparacao('frente', a1.fotos?.frente, a2.fotos?.frente, a1.checkin_semana, a2.checkin_semana);
            atualizarFotoComparacao('lado', a1.fotos?.lado, a2.fotos?.lado, a1.checkin_semana, a2.checkin_semana);
            atualizarFotoComparacao('costas', a1.fotos?.costas, a2.fotos?.costas, a1.checkin_semana, a2.checkin_semana);

            if (window.EF781) { EF781.render(a1, a2); } else { document.getElementById('comp-pro-notes-display').textContent = a2.parecer_profissional || a1.parecer_profissional || 'Sem observações.'; }

            atualizarDiagnosticoPrisma2(a1, a2, diffDias);

            document.getElementById('print-assinatura-avaliador').textContent = a2.avaliador_nome || 'Profissional Responsável';
            document.getElementById('print-assinatura-registro').textContent = a2.avaliador_registro || 'Registro Profissional';
            document.getElementById('print-assinatura-aluno').textContent = a2.nome || 'Aluno / Paciente';
        }

        function criarLinhaTabela(item) {
            const tr = document.createElement('tr');
            const v1 = parseFloat(item.v1) || 0;
            const v2 = parseFloat(item.v2) || 0;

            let deltaHtml = '<span class="delta-badge delta-neutral">-</span>';
            let pctHtml = '<span style="color: var(--text-muted);">-</span>';

            if (v1 > 0 && v2 > 0) {
                const delta = v2 - v1;
                const pct = (delta / v1) * 100;
                const sinal = delta > 0 ? '+' : '';
                
                let badgeClass = 'delta-neutral';
                let pctColor = '#6b7280';

                if (Math.abs(delta) >= 0.05) {
                    if (item.inv) {
                        badgeClass = delta < 0 ? 'delta-negative' : 'delta-positive';
                        pctColor = delta < 0 ? '#059669' : '#b91c1c';
                    } else {
                        badgeClass = delta > 0 ? 'delta-negative' : 'delta-positive';
                        pctColor = delta > 0 ? '#059669' : '#b91c1c';
                    }
                }

                deltaHtml = `<span class="delta-badge ${badgeClass}">${sinal}${delta.toFixed(item.un === '' ? 2 : 1)} ${item.un}</span>`;
                pctHtml = `<strong style="color: ${pctColor};">${sinal}${pct.toFixed(1)}%</strong>`;
            }

            tr.innerHTML = `
                <td class="metric-name">${esc(item.nome)}</td>
                <td><strong>${v1 > 0 ? v1.toFixed(item.un === '' ? 2 : 1) + (item.un ? ' ' + item.un : '') : '-'}</strong></td>
                <td><strong>${v2 > 0 ? v2.toFixed(item.un === '' ? 2 : 1) + (item.un ? ' ' + item.un : '') : '-'}</strong></td>
                <td>${deltaHtml}</td>
                <td>${pctHtml}</td>
            `;
            return tr;
        }

        function atualizarCardDestaque(idVal, idDiff, valA, valB, unidade, inverterCores) {
            const elVal = document.getElementById(idVal);
            const elDiff = document.getElementById(idDiff);
            if (!elVal || !elDiff) return;

            if (valB > 0) elVal.textContent = `${valB.toFixed(1)} ${unidade}`;
            else elVal.textContent = '-';

            if (valA > 0 && valB > 0) {
                const delta = valB - valA;
                const sinal = delta > 0 ? '+' : '';
                let cor = '#6b7280';
                if (Math.abs(delta) >= 0.05) {
                    if (inverterCores) {
                        cor = delta < 0 ? '#059669' : '#b91c1c';
                    } else {
                        cor = delta > 0 ? '#059669' : '#b91c1c';
                    }
                }
                elDiff.innerHTML = `<span style="color: ${cor}; font-weight:700;">${sinal}${delta.toFixed(1)} ${unidade}</span> (${valA.toFixed(1)} ➔ ${valB.toFixed(1)})`;
            } else {
                elDiff.textContent = '-';
            }
        }

        
        function atualizarDiagnosticoPrisma2(a1, a2, diffDias) {
            const elBadge = document.getElementById('comp-prisma2-badge');
            const elMm = document.getElementById('comp-prisma2-delta-mm');
            const elMg = document.getElementById('comp-prisma2-delta-mg');
            const elPg = document.getElementById('comp-prisma2-delta-pg');
            const elTaxa = document.getElementById('comp-prisma2-taxa-semanal');
            const elSintese = document.getElementById('comp-prisma2-sintese');
            if (!elBadge || !elMm || !elMg || !elPg || !elTaxa || !elSintese) return;

            const peso1 = parseFloat(a1.peso) || 0;
            const peso2 = parseFloat(a2.peso) || 0;
            const deltaPeso = peso2 - peso1;

            const g1 = parseFloat(a1.bioimpedancia?.pgordura || a1.dobras_resultado?.percGordura || a1.percGordura) || 0;
            const g2 = parseFloat(a2.bioimpedancia?.pgordura || a2.dobras_resultado?.percGordura || a2.percGordura) || 0;
            const deltaG = g2 - g1;

            const m1 = parseFloat(a1.dobras_resultado?.massaMagra || (peso1 > 0 && g1 > 0 ? peso1 * (1 - g1/100) : 0)) || 0;
            const m2 = parseFloat(a2.dobras_resultado?.massaMagra || (peso2 > 0 && g2 > 0 ? peso2 * (1 - g2/100) : 0)) || 0;
            const deltaM = m2 - m1;

            const mg1 = parseFloat(a1.dobras_resultado?.massaGorda || (peso1 > 0 && g1 > 0 ? peso1 * (g1/100) : 0)) || 0;
            const mg2 = parseFloat(a2.dobras_resultado?.massaGorda || (peso2 > 0 && g2 > 0 ? peso2 * (g2/100) : 0)) || 0;
            const deltaMG = mg2 - mg1;

            const semanas = Math.max(1, (diffDias || 30) / 7);
            const taxaSemanal = deltaPeso / semanas;

            elMm.textContent = `${deltaM >= 0 ? '+' : ''}${deltaM.toFixed(1)} kg`;
            elMm.style.color = deltaM >= 0 ? '#059669' : '#dc2626';

            elMg.textContent = `${deltaMG >= 0 ? '+' : ''}${deltaMG.toFixed(1)} kg`;
            elMg.style.color = deltaMG <= 0 ? '#059669' : '#dc2626';

            elPg.textContent = `${deltaG >= 0 ? '+' : ''}${deltaG.toFixed(1)}%`;
            elPg.style.color = deltaG <= 0 ? '#059669' : '#dc2626';

            elTaxa.textContent = `${taxaSemanal >= 0 ? '+' : ''}${taxaSemanal.toFixed(2)} kg/sem`;

            let badgeText = '';
            let badgeBg = '';
            let badgeColor = '';
            let sinteseText = '';

            if (deltaM >= 0.3 && deltaMG <= -0.3) {
                badgeText = '🏆 Recomposição Corporal Efetiva';
                badgeBg = '#ecfdf5';
                badgeColor = '#059669';
                sinteseText = `Excelente adaptação fisiológica no período de ${diffDias} dias: o aluno ganhou <b>+${deltaM.toFixed(1)} kg de massa muscular</b> e eliminou <b>${Math.abs(deltaMG).toFixed(1)} kg de gordura</b>, comprovando efetividade máxima do treinamento físico.`;
            } else if (deltaMG <= -0.4 && deltaM >= -0.3) {
                badgeText = '🔥 Emagrecimento com Preservação Muscular';
                badgeBg = '#f0f9ff';
                badgeColor = '#0284c7';
                sinteseText = `Perda consistente de gordura corporal (<b>${Math.abs(deltaMG).toFixed(1)} kg eliminados</b>) com ótima preservação da massa magra (variação de ${deltaM >= 0 ? '+' : ''}${deltaM.toFixed(1)} kg).`;
            } else if (deltaM >= 0.5 && deltaMG <= 0.5) {
                badgeText = '💪 Hipertrofia com Controle Adiposo';
                badgeBg = '#f5f3ff';
                badgeColor = '#7c3aed';
                sinteseText = `Evolução hipertrófica expressiva: aumento de <b>+${deltaM.toFixed(1)} kg de massa muscular</b> com ganho de gordura controlado (+${Math.max(0, deltaMG).toFixed(1)} kg).`;
            } else if (deltaM < -0.4 && deltaMG >= 0) {
                badgeText = '⚠️ Alerta de Catabolismo Muscular';
                badgeBg = '#fef2f2';
                badgeColor = '#dc2626';
                sinteseText = `Atenção: observou-se redução de massa muscular (<b>${deltaM.toFixed(1)} kg</b>) associada a aumento de gordura (+${deltaMG.toFixed(1)} kg). Recomenda-se reavaliar intensidade/recuperação do treino e aporte energético.`;
            } else if (deltaMG > 0.5 && deltaM < 0.3) {
                badgeText = '⚠️ Ganho de Gordura Predominante';
                badgeBg = '#fffbeb';
                badgeColor = '#d97706';
                sinteseText = `Aumento ponderal concentrado na gordura corporal (+${deltaMG.toFixed(1)} kg) sem ganho muscular significativo (+${deltaM.toFixed(1)} kg). Recomenda-se ajustar a demanda de treino e gasto energético.`;
            } else {
                badgeText = '⚖️ Estabilidade de Composição Corporal';
                badgeBg = '#f8fafc';
                badgeColor = '#475569';
                sinteseText = `Composição corporal em fase de estabilidade ou manutenção (variação de Peso: ${deltaPeso >= 0 ? '+' : ''}${deltaPeso.toFixed(1)} kg, Massa Magra: ${deltaM >= 0 ? '+' : ''}${deltaM.toFixed(1)} kg, Gordura: ${deltaMG >= 0 ? '+' : ''}${deltaMG.toFixed(1)} kg).`;
            }

            elBadge.textContent = badgeText;
            elBadge.style.background = badgeBg;
            elBadge.style.color = badgeColor;
            elBadge.style.border = `1px solid ${badgeColor}`;
            elSintese.innerHTML = sinteseText;
        }

        function inserirSintesePrismaNoParecer() {
            const elSintese = document.getElementById('comp-prisma2-sintese');
            const elBadge = document.getElementById('comp-prisma2-badge');
            const ta = document.getElementById('ef781-parecer');
            if (!elSintese || !ta) return;

            const textoSintese = (elSintese.innerText || elSintese.textContent || elSintese.innerHTML || '').trim();
            if (!textoSintese || textoSintese.includes('Selecione duas avaliações')) {
                if (typeof window.efToast === 'function') window.efToast('Selecione duas avaliações válidas antes de inserir a síntese.', 'warning'); else if (typeof alert !== 'undefined') alert('Selecione duas avaliações válidas antes de inserir a síntese.');
                return;
            }

            const badgeTexto = elBadge ? elBadge.innerText.trim() : 'Diagnóstico Morfológico';
            const bloco = `\n\n[Diagnóstico de Recomposição Corporal — Prisma 2]\nClassificação: ${badgeTexto}\n${textoSintese}`;

            if (ta.value.trim() === '' || ta.value.trim() === 'Sem observações.') {
                ta.value = bloco.trim();
            } else {
                ta.value = ta.value.trim() + bloco;
            }

            ta.dispatchEvent(new Event('input', { bubbles: true }));
            if (typeof window.efToast === 'function') {
                window.efToast('⚡ Síntese do Prisma 2 inserida no parecer com sucesso!', 'success');
            }
        }

        function atualizarFotoComparacao(pose, fotoA, fotoB, semA, semB) {
            const lA = document.getElementById(`label-foto-${pose}-base`);
            const lB = document.getElementById(`label-foto-${pose}-curr`);
            const bA = document.getElementById(`box-foto-${pose}-base`);
            const bB = document.getElementById(`box-foto-${pose}-curr`);

            if (lA) lA.textContent = semA || 'Avaliação 1';
            if (lB) lB.textContent = semB || 'Avaliação 2';

            if (bA) bA.innerHTML = fotoA ? `<img src="${esc(fotoA)}" alt="Foto ${esc(pose)}">` : '<div class="empty-photo">Sem foto</div>';
            if (bB) bB.innerHTML = fotoB ? `<img src="${esc(fotoB)}" alt="Foto ${esc(pose)}">` : '<div class="empty-photo">Sem foto</div>';
        }

        function irParaComparacaoComRecente() {
            switchTab('tab-comparison');
        }

        function selecionarParaComparacao(id) {
            const aval = avaliacoes.find(a => a.id === id);
            if (!aval) return;
            switchTab('tab-comparison');
            const clientSelect = document.getElementById('compare-client-select');
            clientSelect.value = aval.email || aval.nome;
            aoMudarClienteComparacao();

            const currSelect = document.getElementById('compare-current-select');
            currSelect.value = id;
            renderizarComparacao();
        }

        async function baixarArquivoIndividual(id) {
            const aval = avaliacoes.find(a => a.id === id);
            if (!aval) return;
            const nomeSeguro = (aval.nome || 'aluno').toLowerCase().replace(/[^a-z0-9]/g, '_');
            const filename = `${nomeSeguro}_${aval.data_avaliacao}_${aval.id}.json`;
            if (EF_Security.enabled && EF_Security.key) {
                await EF_Security.exportEncryptedText(JSON.stringify(aval, null, 2), filename, 'application/json');
                if(window.efToast) efToast('🔐 Arquivo individual criptografado gerado.');
                return;
            }
            baixarJSON(aval, filename);
        }

        async function excluirAvaliacao(id) {
            if (confirm('Tem certeza que deseja excluir esta avaliação do banco de dados?')) {
                await deletarAvaliacaoDoDB(id);
                renderizarComparacao();
            }
        }

        
        // =========================================================================
        // MÓDULO AVANÇADO DE BACKUP, RESTAURAÇÃO & INTEGRIDADE DE DADOS (v7.4)
        // Padrão Clínico: Envelopamento com Metadados, Checksum SHA-256,
        // Opções Completo/Leve/Aluno, Pré-visualização com Análise de Conflitos,
        // Estratégias de Mesclagem Inteligente e Ponto de Restauração (Safety Rollback)
        // =========================================================================
        var _arquivoBackupEmMemoria = null; window._arquivoBackupEmMemoria = null;

        function sha256_pure(str) {
            let ascii;
            try {
                ascii = unescape(encodeURIComponent(str));
            } catch(e) {
                ascii = String(str);
            }
            function rightRotate(value, amount) {
                return (value >>> amount) | (value << (32 - amount));
            }
            const mathPow = Math.pow;
            const maxWord = mathPow(2, 32);
            const lengthProperty = 'length';
            let i, j;
            let result = '';
            const words = [];
            const asciiBitLength = ascii[lengthProperty] * 8;
            let hash = [];
            const k = [];
            let primeCounter = 0;

            const isComposite = {};
            for (let candidate = 2; primeCounter < 64; candidate++) {
                if (!isComposite[candidate]) {
                    for (i = 0; i < 313; i += candidate) {
                        isComposite[i] = candidate;
                    }
                    hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
                    k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
                }
            }

            ascii += '\x80';
            while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
            for (i = 0; i < ascii[lengthProperty]; i++) {
                j = ascii.charCodeAt(i);
                words[i >> 2] |= j << ((3 - i) % 4) * 8;
            }
            words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
            words[words[lengthProperty]] = asciiBitLength;

            for (j = 0; j < words[lengthProperty]; ) {
                const w = words.slice(j, (j += 16));
                const oldHash = hash;
                hash = hash.slice(0, 8);

                for (i = 0; i < 64; i++) {
                    const w15 = w[i - 15], w2 = w[i - 2];
                    const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
                    const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
                    const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
                    const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
                    const temp1 =
                        hash[7] +
                        (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) +
                        ch +
                        k[i] +
                        (w[i] =
                            i < 16
                                ? w[i]
                                : (w[i - 16] + s0 + w[i - 7] + s1) | 0);
                    const temp2 =
                        (rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) +
                        maj;

                    hash = [(temp1 + temp2) | 0].concat(hash);
                    hash[4] = (hash[4] + temp1) | 0;
                }

                for (i = 0; i < 8; i++) {
                    hash[i] = (hash[i] + oldHash[i]) | 0;
                }
            }

            for (i = 0; i < 8; i++) {
                for (j = 3; j + 1; j--) {
                    const b = (hash[i] >> (j * 8)) & 255;
                    result += (b < 16 ? '0' : '') + b.toString(16);
                }
            }
            return result;
        }

        const EF_BackupEngine = {
            calcularChecksumSync: function(str) {
                return sha256_pure(str);
            },

            calcularChecksum: async function(str) {
                if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle && window.crypto.subtle.digest) {
                    try {
                        const buffer = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
                        const hashArray = Array.from(new Uint8Array(buffer));
                        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                    } catch(e) {}
                }
                return sha256_pure(str);
            },

            obterDadosProfissional: function() {
                return {
                    proNome: (localStorage.getItem('evolufisico_pro_nome') || document.getElementById('avaliador_nome')?.value || '').trim(),
                    proCref: (localStorage.getItem('evolufisico_pro_cref') || document.getElementById('avaliador_registro')?.value || '').trim(),
                    proClinica: (localStorage.getItem('evolufisico_pro_clinica') || document.getElementById('avaliador_clinica')?.value || '').trim()
                };
            },

            salvarSnapshotSeguranca: async function(listaAvaliacoes) {
                try {
                    const snapshot = {
                        timestamp: new Date().toISOString(),
                        financeiro: window.EFCobranca ? await EFCobranca.exportData() : null,
                        totalAvaliacoes: listaAvaliacoes.length,
                        config: this.obterDadosProfissional(),
                        avaliacoes: JSON.parse(JSON.stringify(listaAvaliacoes))
                    };
                    if (EF_Security.enabled && EF_Security.key) {
                        try {
                            localStorage.setItem(EF_SECURITY_SNAPSHOT_KEY, JSON.stringify(await EF_Security.encryptObject(snapshot)));
                            localStorage.removeItem('evolufisico_backup_safety_snapshot');
                        } catch (quotaErr) {
                            // Fallback se estourar a cota por fotos pesadas: grava snapshot leve sem fotos
                            const snapLeve = structuredClone(snapshot);
                            snapLeve.avaliacoes.forEach(a => { if (a.fotos) a.fotos = { frente: '', perfil_direito: '', perfil_esquerdo: '', costas: '', extra: '', lado: '' }; });
                            localStorage.setItem(EF_SECURITY_SNAPSHOT_KEY, JSON.stringify(await EF_Security.encryptObject(snapLeve)));
                            localStorage.removeItem('evolufisico_backup_safety_snapshot');
                        }
                    } else {
                        try {
                            localStorage.setItem('evolufisico_backup_safety_snapshot', JSON.stringify(snapshot));
                        } catch (quotaErr) {
                            const snapLeve = structuredClone(snapshot);
                            snapLeve.avaliacoes.forEach(a => { if (a.fotos) a.fotos = { frente: '', perfil_direito: '', perfil_esquerdo: '', costas: '', extra: '', lado: '' }; });
                            localStorage.setItem('evolufisico_backup_safety_snapshot', JSON.stringify(snapLeve));
                        }
                    }
                    return true;
                } catch (e) {
                    console.error('Não foi possível criar ponto de restauração completo:',e);
                    return false;
                }
            },

            obterSnapshotSeguranca: function() {
                try {
                    const raw = localStorage.getItem(EF_SECURITY_SNAPSHOT_KEY);
                    if (raw) return { __encrypted: true };
                    const legado = localStorage.getItem('evolufisico_backup_safety_snapshot');
                    return legado ? JSON.parse(legado) : null;
                } catch (e) { return null; }
            },
            obterSnapshotSegurancaAsync: async function() {
                try {
                    const raw = localStorage.getItem(EF_SECURITY_SNAPSHOT_KEY);
                    if (raw && EF_Security.enabled && EF_Security.key) return await EF_Security.decryptObject(JSON.parse(raw));
                    const legado = localStorage.getItem('evolufisico_backup_safety_snapshot');
                    return legado ? JSON.parse(legado) : null;
                } catch (e) { return null; }
            },

            limparSnapshotSeguranca: function() {
                localStorage.removeItem('evolufisico_backup_safety_snapshot');
                localStorage.removeItem(EF_SECURITY_SNAPSHOT_KEY);
            },

            gerarEnvelopeBackup: async function(listaAvaliacoes, options = {}) {
                const tipo = options.tipo || 'completo';
                const filtroAluno = options.filtroAluno || null;
                const incluirConfig = options.incluirConfig !== false;

                let lista = Array.isArray(listaAvaliacoes) ? listaAvaliacoes.map(a => JSON.parse(JSON.stringify(a))) : [];

                if (tipo === 'aluno' && filtroAluno) {
                    const fNorm = filtroAluno.trim().toLowerCase();
                    lista = lista.filter(a => EFIdentity.key(a) === EFIdentity.resolve(filtroAluno));
                }

                if (tipo === 'leve') {
                    lista = lista.map(a => {
                        a.fotos = { frente: '', perfil_direito: '', perfil_esquerdo: '', costas: '', extra: '', lado: '' };
                        a._backupLeve = true;
                        return a;
                    });
                }

                const payloadJson = JSON.stringify(lista);
                const checksum = await this.calcularChecksum(payloadJson);
                const alunosSet = new Set(lista.map(a => EFIdentity.key(a)));

                let totalFotos = 0;
                lista.forEach(a => {
                    if (a.fotos) {
                        totalFotos += Object.values(a.fotos).filter(f => f && typeof f === 'string' && f.length > 20).length;
                    }
                });

                const financeiro = tipo !== "aluno" && window.EFCobranca ? await EFCobranca.exportData() : null;
                const envelope = {
                    financeiro,
                    checksumFinanceiro: financeiro ? await this.calcularChecksum(JSON.stringify(financeiro)) : null,
                    app: "EvoluFisico",
                    versaoApp: "9.0-beta",
                    schemaVersion: 2,
                    tipoBackup: tipo,
                    dataExportacao: new Date().toISOString(),
                    totalAvaliacoes: lista.length,
                    totalAlunos: alunosSet.size,
                    totalFotos: totalFotos,
                    filtroAluno: filtroAluno || null,
                    checksum: checksum,
                    config: incluirConfig ? this.obterDadosProfissional() : null,
                    avaliacoes: lista
                };

                try {
                    localStorage.setItem('evolufisico_ultimo_backup', envelope.dataExportacao);
                    localStorage.setItem('ef55_last_backup', String(Date.now()));
                } catch (e) {}

                return envelope;
            },

            gerarNomeArquivo: function(tipo = 'completo', filtroAluno = null) {
                const dataStr = hojeISO();
                const d = new Date();
                const horaStr = String(d.getHours()).padStart(2, '0') + 'h' + String(d.getMinutes()).padStart(2, '0');
                if (tipo === 'aluno' && filtroAluno) {
                    const safeName = filtroAluno.toLowerCase().replace(/[^a-z0-9]/g, '_');
                    return `evolufisico_backup_${safeName}_${dataStr}.json`;
                }
                if (tipo === 'leve') {
                    return `evolufisico_backup_leve_${dataStr}_${horaStr}.json`;
                }
                return `evolufisico_backup_completo_${dataStr}_${horaStr}.json`;
            },

            inspecionarArquivoBackup: async function(jsonString, avaliacoesAtuais = []) {
                let parsed;
                try {
                    let limpo = jsonString.trim();
                    if (limpo.charCodeAt(0) === 0xFEFF) limpo = limpo.substr(1);
                    parsed = JSON.parse(limpo);
                } catch (e) {
                    return { valido: false, erro: 'Arquivo JSON inválido ou corrompido: ' + e.message };
                }

                let listaParaImportar = [];
                let metadata = {
                    ehEnvelope: false,
                    app: 'Desconhecido',
                    versaoApp: 'Legado (v1-v6)',
                    tipoBackup: 'desconhecido',
                    dataExportacao: null,
                    checksumPresente: false,
                    checksumValido: null,
                    config: null
                };

                if (Array.isArray(parsed)) {
                    listaParaImportar = parsed;
                } else if (parsed && typeof parsed === 'object') {
                    if (Array.isArray(parsed.avaliacoes)) {
                        listaParaImportar = parsed.avaliacoes;
                        metadata.ehEnvelope = true;
                        metadata.app = parsed.app || 'EvoluFisico';
                        metadata.versaoApp = parsed.versaoApp || 'v7';
                        metadata.tipoBackup = parsed.tipoBackup || 'completo';
                        metadata.dataExportacao = parsed.dataExportacao;
                        metadata.config = parsed.config || null;
                        if (parsed.financeiro != null) {
                            if (!Array.isArray(parsed.financeiro) || !parsed.checksumFinanceiro || await this.calcularChecksum(JSON.stringify(parsed.financeiro)) !== parsed.checksumFinanceiro) return {valido:false,erro:'Integridade do histórico financeiro inválida.'};
                        }
                        metadata.financeiro = parsed.financeiro ?? null;

                        if (parsed.checksum) {
                            metadata.checksumPresente = true;
                            const checkCalc = await this.calcularChecksum(JSON.stringify(parsed.avaliacoes));
                            metadata.checksumValido = (checkCalc === parsed.checksum || this.calcularChecksumSync(JSON.stringify(parsed.avaliacoes)) === parsed.checksum);
                            if (!metadata.checksumValido) return {valido:false,erro:'Integridade das avaliações inválida. O arquivo pode estar corrompido.'};
                        }
                    } else if (Array.isArray(parsed.data)) {
                        listaParaImportar = parsed.data;
                    } else if (Array.isArray(parsed.evaluations)) {
                        listaParaImportar = parsed.evaluations;
                    } else if (parsed.nome || parsed.peso || parsed.data_avaliacao || parsed.id) {
                        listaParaImportar = [parsed];
                    } else {
                        return { valido: false, erro: 'Formato não reconhecido como avaliação física do EvoluFísico.' };
                    }
                } else {
                    return { valido: false, erro: 'Conteúdo do arquivo não é um JSON válido.' };
                }

                if (listaParaImportar.length === 0 && !metadata.financeiro) {
                    return { valido: false, erro: 'Nenhuma avaliação encontrada no arquivo selecionado.' };
                }

                const mapaExistentesId = new Set(avaliacoesAtuais.map(a => a.id));
                const mapaExistentesChave = new Set(avaliacoesAtuais.map(a => `${EFIdentity.key(a)}_${a.data_avaliacao}`));

                let novos = 0;
                let existentesId = 0;
                let existentesChave = 0;
                const detalhesAlunos = new Map();
                let totalFotos = 0;

                listaParaImportar.forEach(r => {
                    if (!r || typeof r !== 'object') return;
                    const nome = (r.nome || 'Aluno Sem Nome').trim();
                    detalhesAlunos.set(nome, (detalhesAlunos.get(nome) || 0) + 1);

                    if (r.fotos) {
                        totalFotos += Object.values(r.fotos).filter(f => f && typeof f === 'string' && f.length > 20).length;
                    }

                    const temId = r.id && mapaExistentesId.has(r.id);
                    const chave = `${nome.toLowerCase()}_${r.data_avaliacao}`;
                    const temChave = false;

                    if (temId) {
                        existentesId++;
                    } else if (temChave) {
                        existentesChave++;
                    } else {
                        novos++;
                    }
                });

                return {
                    valido: true,
                    metadata: metadata,
                    totalAvaliacoes: listaParaImportar.length,
                    totalAlunos: detalhesAlunos.size,
                    listaAlunos: Array.from(detalhesAlunos.entries()).map(([n, q]) => ({ nome: n, avaliacoes: q })),
                    totalFotos: totalFotos,
                    conflitos: {
                        novos: novos,
                        existentesId: existentesId,
                        existentesChave: existentesChave,
                        totalExistentes: existentesId + existentesChave
                    },
                    financeiro: metadata.financeiro,
                    dadosBrutos: listaParaImportar,
                    config: metadata.config
                };
            },

            executarImportacao: async function(listaParaImportar, avaliacoesAtuais, estrategia = 'merge', restaurarConfig = false, configArquivo = null, financeiro = null) {
                if (!await this.salvarSnapshotSeguranca(avaliacoesAtuais)) throw new Error('Não foi possível criar o ponto de restauração. Importação cancelada.');
                const anteriores = structuredClone(avaliacoesAtuais);
                const lista = estrategia === 'replace' ? [] : structuredClone(avaliacoesAtuais);
                const contadores={novos:0,atualizados:0,ignorados:0};
                for (const raw of listaParaImportar) {
                    if(!raw || typeof raw !== 'object')continue;
                    const r=sanitizarRegistro(raw);if(!r.id)r.id=gerarIdSeguro();
                    EFIdentity.ensure(r,lista);
                    const idx=lista.findIndex(a=>a.id===r.id);
                    if(idx>=0){
                        if(estrategia==='skip_existing'){contadores.ignorados++;continue;}
                        const old=lista[idx];
                        const fotos=Object.assign({},old.fotos||{});
                        Object.entries(r.fotos||{}).forEach(([k,v])=>{if(v)fotos[k]=v});
                        lista[idx]=Object.assign({},old,r,{cliente_id:old.cliente_id||r.cliente_id,fotos});contadores.atualizados++;
                    } else {lista.push(r);contadores.novos++;}
                }
                const commit=async arr=>{
                    if(db){const rows=[];for(const item of arr)rows.push(EF_Security.enabled?{id:item.id,__efEncrypted:true,payload:await EF_Security.encryptObject(item)}:item);await EF_Security._idbSubstituirTudo(rows);}
                    else await EF_Security.saveVaultArray(arr);
                };
                await commit(lista);
                try {if(financeiro!==null && window.EFCobranca)await EFCobranca.importData(financeiro,estrategia==='replace',estrategia==='skip_existing');}
                catch(e){await commit(anteriores);throw e;}
                avaliacoes=lista.sort(cmpAval);window.avaliacoes=avaliacoes;
                if(restaurarConfig&&configArquivo){for(const [field,key] of [['proNome','evolufisico_pro_nome'],['proCref','evolufisico_pro_cref'],['proClinica','evolufisico_pro_clinica']])if(configArquivo[field])localStorage.setItem(key,configArquivo[field]);}
                if(window.__EF63_STATE__)window.__EF63_STATE__.touch();
                atualizarContadorHistorico();preencherSeletoresComparacao();renderizarHistorico();
                return {contadores,total:lista.length};
            },

            desfazerUltimaImportacao: async function() {
                const snapshot=await this.obterSnapshotSegurancaAsync();
                if(!snapshot || !Array.isArray(snapshot.avaliacoes))return {sucesso:false,erro:'Nenhum ponto de restauração disponível.'};
                const target=structuredClone(snapshot.avaliacoes),previous=structuredClone(avaliacoes);
                const commit=async arr=>{if(db){const rows=[];for(const item of arr)rows.push(EF_Security.enabled?{id:item.id,__efEncrypted:true,payload:await EF_Security.encryptObject(item)}:item);await EF_Security._idbSubstituirTudo(rows);}else await EF_Security.saveVaultArray(arr);};
                await commit(target);
                try{if(snapshot.financeiro && window.EFCobranca)await EFCobranca.importData(snapshot.financeiro,true);}catch(e){await commit(previous);throw e;}
                avaliacoes=target;window.avaliacoes=target;
                if(snapshot.config){for(const [field,key] of [['proNome','evolufisico_pro_nome'],['proCref','evolufisico_pro_cref'],['proClinica','evolufisico_pro_clinica']])if(snapshot.config[field])localStorage.setItem(key,snapshot.config[field]);}
                if(window.__EF63_STATE__)window.__EF63_STATE__.touch();
                atualizarContadorHistorico();preencherSeletoresComparacao();renderizarHistorico();
                this.limparSnapshotSeguranca();return {sucesso:true,total:target.length,timestamp:snapshot.timestamp};
            },

            obterDiagnosticoArmazenamento: function(listaAvaliacoes) {
                const total = listaAvaliacoes.length;
                const alunos = new Set(listaAvaliacoes.map(a => (a.nome || '').trim().toLowerCase())).size;
                let totalFotos = 0;
                listaAvaliacoes.forEach(a => {
                    if (a.fotos) {
                        totalFotos += Object.values(a.fotos).filter(f => f && typeof f === 'string' && f.length > 20).length;
                    }
                });

                let tamanhoBytes = 0;
                try {
                    tamanhoBytes = new Blob([JSON.stringify(listaAvaliacoes)]).size;
                } catch (e) {
                    tamanhoBytes = JSON.stringify(listaAvaliacoes).length;
                }

                const tamanhoFormatado = tamanhoBytes < 1024 * 1024
                    ? (tamanhoBytes / 1024).toFixed(1) + ' KB'
                    : (tamanhoBytes / (1024 * 1024)).toFixed(2) + ' MB';

                const ultimoBackup = localStorage.getItem('evolufisico_ultimo_backup');
                let statusBackup = 'sem_backup';
                let diasSemBackup = null;
                if (ultimoBackup) {
                    const diffMs = Date.now() - new Date(ultimoBackup).getTime();
                    diasSemBackup = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    statusBackup = diasSemBackup <= 3 ? 'em_dia' : diasSemBackup <= 7 ? 'atencao' : 'atrasado';
                }

                return {
                    totalAvaliacoes: total,
                    totalAlunos: alunos,
                    totalFotos: totalFotos,
                    tamanhoBytes: tamanhoBytes,
                    tamanhoFormatado: tamanhoFormatado,
                    ultimoBackup: ultimoBackup,
                    diasSemBackup: diasSemBackup,
                    statusBackup: statusBackup,
                    temSnapshot: !!this.obterSnapshotSeguranca()
                };
            }
        };

        // CONTROLE DA INTERFACE DO MODAL CENTRAL DE BACKUP
        function abrirModalCentralBackup(abaInicial = 'exportar') {
            const modal = document.getElementById('modal-central-backup');
            if (!modal) return;

            atualizarUIModalBackup();
            alternarAbaBackup(abaInicial);
            modal.classList.remove('hidden');

            // Configurar Drag & Drop uma vez
            configurarDragAndDropBackup();
        }

        function fecharModalCentralBackup() {
            const modal = document.getElementById('modal-central-backup');
            if (modal) modal.classList.add('hidden');
            cancelarArquivoBackupPreview();
        }

        function alternarAbaBackup(aba) {
            ['exportar', 'importar', 'diagnostico'].forEach(a => {
                const btn = document.getElementById(`bkp-tab-btn-${a}`);
                const panel = document.getElementById(`bkp-panel-${a}`);
                if (btn) btn.classList.toggle('active', a === aba);
                if (panel) panel.classList.toggle('hidden', a !== aba);
            });
            atualizarUIModalBackup();
        }

        function selecionarTipoBackup(tipo) {
            ['completo', 'leve', 'aluno'].forEach(t => {
                const card = document.getElementById(`bkp-card-tipo-${t}`);
                if (card) card.classList.toggle('active', t === tipo);
            });
            const radio = document.querySelector(`input[name="bkp_tipo_export"][value="${tipo}"]`);
            if (radio) radio.checked = true;

            const alunoBox = document.getElementById('bkp-aluno-selector-box');
            if (alunoBox) alunoBox.classList.toggle('hidden', tipo !== 'aluno');
        }

        function atualizarUIModalBackup() {
            const diag = EF_BackupEngine.obterDiagnosticoArmazenamento(avaliacoes);

            // Resumo no painel exportar
            const elResumo = document.getElementById('bkp-resumo-banco');
            const elBadge = document.getElementById('bkp-status-badge');
            if (elResumo) {
                elResumo.textContent = `${diag.totalAvaliacoes} avaliações (${diag.totalAlunos} alunos) • ~${diag.tamanhoFormatado}`;
            }
            if (elBadge) {
                if (diag.statusBackup === 'em_dia') {
                    elBadge.textContent = 'Backup em Dia ✓';
                    elBadge.style.background = '#34c759';
                } else if (diag.statusBackup === 'atencao') {
                    elBadge.textContent = `Último há ${diag.diasSemBackup}d`;
                    elBadge.style.background = '#f59e0b';
                } else if (diag.statusBackup === 'atrasado') {
                    elBadge.textContent = `Atrasado (${diag.diasSemBackup}d)`;
                    elBadge.style.background = '#ef4444';
                } else {
                    elBadge.textContent = 'Sem Backup Recente';
                    elBadge.style.background = '#f59e0b';
                }
            }

            // Popular select de alunos no export
            const selectAluno = document.getElementById('bkp-select-aluno');
            if (selectAluno) {
                selectAluno.innerHTML = '';
                const alunosMap = new Map();
                avaliacoes.forEach(a => {
                    const nome = (a.nome || '').trim();
                    if (nome) alunosMap.set(EFIdentity.key(a), {nome,email:a.email||''});
                });
                if (alunosMap.size === 0) {
                    selectAluno.innerHTML = '<option value="">Nenhum aluno cadastrado</option>';
                } else {
                    alunosMap.forEach(({email,nome}, key) => {
                        const opt = document.createElement('option');
                        opt.value = key;
                        opt.textContent = `${nome} ${email ? '(' + email + ')' : ''}`;
                        selectAluno.appendChild(opt);
                    });
                }
            }

            // Atualizar KPIs do Diagnóstico
            const elDiagAv = document.getElementById('bkp-diag-avaliacoes');
            const elDiagAl = document.getElementById('bkp-diag-alunos');
            const elDiagFt = document.getElementById('bkp-diag-fotos');
            const elDiagSz = document.getElementById('bkp-diag-tamanho');
            if (elDiagAv) elDiagAv.textContent = String(diag.totalAvaliacoes);
            if (elDiagAl) elDiagAl.textContent = String(diag.totalAlunos);
            if (elDiagFt) elDiagFt.textContent = String(diag.totalFotos);
            if (elDiagSz) elDiagSz.textContent = diag.tamanhoFormatado;

            // Banner e botão de snapshot
            const rollbackBanner = document.getElementById('bkp-rollback-banner');
            const btnReverterDiag = document.getElementById('bkp-btn-reverter-diag');
            if (rollbackBanner) rollbackBanner.classList.toggle('hidden', !diag.temSnapshot);
            if (btnReverterDiag) btnReverterDiag.disabled = !diag.temSnapshot;
        }

        async function executarDownloadBackup() {
            if (avaliacoes.length === 0 && !(window.EFCobranca && (await EFCobranca.exportData()).length)) {
                alert('O banco de dados está vazio. Cadastre uma avaliação ou carregue os dados de exemplo antes de fazer backup.');
                return;
            }

            const tipo = document.querySelector('input[name="bkp_tipo_export"]:checked')?.value || 'completo';
            const incluirConfig = document.getElementById('bkp-incluir-config')?.checked !== false;
            let filtroAluno = null;

            if (tipo === 'aluno') {
                filtroAluno = document.getElementById('bkp-select-aluno')?.value;
                if (!filtroAluno) {
                    alert('Selecione um aluno para exportar.');
                    return;
                }
            }

            const envelope = await EF_BackupEngine.gerarEnvelopeBackup(avaliacoes, {
                tipo: tipo,
                filtroAluno: filtroAluno,
                incluirConfig: incluirConfig
            });

            const nomeArquivo = EF_BackupEngine.gerarNomeArquivo(tipo, filtroAluno);
            if (EF_Security.enabled && EF_Security.key) {
                await EF_Security.exportBackup(envelope, nomeArquivo);
            } else {
                baixarJSON(envelope, nomeArquivo);
            }

            if (window.efToast) {
                efToast(`Backup ${tipo === 'leve' ? 'leve' : tipo === 'aluno' ? 'do aluno' : 'completo'} exportado com sucesso ✓`);
            } else {
                alert(`✅ Backup gerado com sucesso! Arquivo salvo como: ${nomeArquivo}`);
            }

            atualizarUIModalBackup();
        }

        // BACKWARD COMPATIBILITY: exportarBackupJSON direta
        async function exportarBackupJSON() {
            if (avaliacoes.length === 0 && !(window.EFCobranca && (await EFCobranca.exportData()).length)) {
                alert('Banco de dados vazio.');
                return;
            }
            const envelope = await EF_BackupEngine.gerarEnvelopeBackup(avaliacoes, { tipo: 'completo', incluirConfig: true });
            const nomeArquivo = `evolufisico_backup_${hojeISO()}.json`;
            if (EF_Security.enabled && EF_Security.key) await EF_Security.exportBackup(envelope, nomeArquivo);
            else baixarJSON(envelope, nomeArquivo);
            if (window.efToast) efToast('Backup gerado com sucesso ✓');
        }

        // MANIPULAÇÃO DE ARQUIVO SELECIONADO NA RESTAURAÇÃO
        function aoSelecionarArquivoBackupModal(event) {
            const input = event.target;
            const file = input.files && input.files[0];
            if (!file) return;
            lerEProcessarArquivoBackup(file);
        }

        function lerEProcessarArquivoBackup(file) {
            const reader = new FileReader();
            reader.onload = async function(e) {
                const text = e.target.result;
                await processarArquivoBackupTexto(text, file.name, file.size);
            };
            reader.onerror = function() {
                alert('Falha ao ler o arquivo selecionado.');
            };
            reader.readAsText(file, 'utf-8');
        }

        async function processarArquivoBackupTexto(text, nomeArquivo, tamanhoBytes) {
            {
                let ehArquivoCriptografado = false;
                try {
                    const maybe = JSON.parse(text.trim().replace(/^\uFEFF/, ''));
                    if (maybe && maybe.encrypted && maybe.security === 'AES-256-GCM') {
                        ehArquivoCriptografado = true;
                        const dec = await EF_Security.decryptImportedText(text);
                        text = dec.text;
                        nomeArquivo = dec.originalName || nomeArquivo;
                    }
                } catch (e) {
                    if (ehArquivoCriptografado || /\.efx$/i.test(nomeArquivo || '')) {
                        alert('❌ ' + ((e && e.message) ? e.message : 'Não foi possível desbloquear o arquivo com a chave mestra.'));
                        return;
                    }
                }
            }
            const inspecao = await EF_BackupEngine.inspecionarArquivoBackup(text, avaliacoes);
            if (!inspecao.valido) {
                alert('❌ ' + inspecao.erro);
                return;
            }

            _arquivoBackupEmMemoria = inspecao; window._arquivoBackupEmMemoria = inspecao;

            // Preencher UI de pré-visualização
            const prevCard = document.getElementById('bkp-preview-card');
            const dropzone = document.getElementById('bkp-dropzone');
            if (dropzone) dropzone.classList.add('hidden');
            if (prevCard) prevCard.classList.remove('hidden');

            document.getElementById('bkp-prev-nome-arquivo').textContent = nomeArquivo || 'backup.json';

            const tamStr = tamanhoBytes < 1024 * 1024
                ? (tamanhoBytes / 1024).toFixed(1) + ' KB'
                : (tamanhoBytes / (1024 * 1024)).toFixed(2) + ' MB';
            const dataExp = inspecao.metadata.dataExportacao
                ? formatarData(inspecao.metadata.dataExportacao) + ' ' + (inspecao.metadata.dataExportacao.split('T')[1] || '').substr(0, 5)
                : 'Data não informada';

            document.getElementById('bkp-prev-meta-info').textContent = `${tamStr} • ${inspecao.metadata.versaoApp} • Criado em: ${dataExp}`;

            const checksumBadge = document.getElementById('bkp-prev-checksum-badge');
            if (checksumBadge) {
                if (inspecao.metadata.checksumValido === true) {
                    checksumBadge.textContent = '🛡️ Íntegro (SHA-256)';
                    checksumBadge.style.background = '#34c759';
                } else if (inspecao.metadata.checksumValido === false) {
                    checksumBadge.textContent = '⚠️ Checksum Divergente';
                    checksumBadge.style.background = '#ef4444';
                } else {
                    checksumBadge.textContent = 'ℹ️ Formato Compatível';
                    checksumBadge.style.background = '#0071e3';
                }
            }

            document.getElementById('bkp-prev-qtd-avaliacoes').textContent = String(inspecao.totalAvaliacoes);
            document.getElementById('bkp-prev-qtd-alunos').textContent = String(inspecao.totalAlunos);
            document.getElementById('bkp-prev-qtd-fotos').textContent = String(inspecao.totalFotos);

            // Conflitos
            const conflitosBox = document.getElementById('bkp-prev-conflitos-box');
            if (conflitosBox) {
                const conf = inspecao.conflitos;
                let htmlConf = `<div>🟢 <strong>${conf.novos} nova(s) avaliação(ões)</strong> serão adicionadas.</div>`;
                if (conf.totalExistentes > 0) {
                    htmlConf += `<div style="margin-top:4px; color:#b45309;">🟡 <strong>${conf.totalExistentes} avaliação(ões) já existem</strong> no dispositivo (mesmo ID ou mesmo aluno na mesma data).</div>`;
                }
                conflitosBox.innerHTML = htmlConf;
            }

            // Renderizar chips de alunos inclusos no arquivo
            const alunosChipsBox = document.getElementById('bkp-prev-lista-alunos-chips');
            if (alunosChipsBox) {
                if (inspecao.listaAlunos && inspecao.listaAlunos.length > 0) {
                    alunosChipsBox.innerHTML = inspecao.listaAlunos.map(al =>
                        `<span style="font-size:0.74rem; background:#ffffff; border:1px solid #cbd5e1; border-radius:6px; padding:2px 8px; color:#1e293b; display:inline-flex; align-items:center; gap:4px;">
                            <span>👤</span> <span>${esc(al.nome)}</span> <strong style="color:#0071e3;">(${al.avaliacoes})</strong>
                        </span>`
                    ).join('');
                } else {
                    alunosChipsBox.innerHTML = '<span style="font-size:0.74rem; color:#64748b;">Nenhum aluno identificado</span>';
                }
            }

            // Configuração do profissional presente no backup
            const configBox = document.getElementById('bkp-prev-config-box');
            const configText = document.getElementById('bkp-prev-config-text');
            if (configBox && configText) {
                if (inspecao.config && (inspecao.config.proNome || inspecao.config.proCref)) {
                    configBox.classList.remove('hidden');
                    configText.textContent = `Restaurar também os dados do profissional: ${inspecao.config.proNome || ''} (${inspecao.config.proCref || ''})`;
                } else {
                    configBox.classList.add('hidden');
                }
            }
        }

        function cancelarArquivoBackupPreview() {
            _arquivoBackupEmMemoria = null; window._arquivoBackupEmMemoria = null;
            const prevCard = document.getElementById('bkp-preview-card');
            const dropzone = document.getElementById('bkp-dropzone');
            if (prevCard) prevCard.classList.add('hidden');
            if (dropzone) dropzone.classList.remove('hidden');
            const fileInput = document.getElementById('bkp-modal-file-input');
            if (fileInput) fileInput.value = '';
            const mainFileInput = document.getElementById('import-file-input');
            if (mainFileInput) mainFileInput.value = '';
            alternarAreaColarJson(false);
            const taPaste = document.getElementById('bkp-textarea-paste');
            if (taPaste) taPaste.value = '';
        }

        async function confirmarImportacaoBackup() {
            if (!_arquivoBackupEmMemoria || !_arquivoBackupEmMemoria.dadosBrutos) {
                alert('Nenhum arquivo de backup válido carregado para restauração.');
                return;
            }

            const estrategia = document.querySelector('input[name="bkp_estrategia"]:checked')?.value || 'merge';
            const restaurarConfig = document.getElementById('bkp-chk-restaurar-config')?.checked === true;
            const btnConfirmar = document.getElementById('bkp-btn-confirmar-import');
            if (btnConfirmar) {
                btnConfirmar.disabled = true;
                btnConfirmar.textContent = 'Restaurando...';
            }

            try {
                const res = await EF_BackupEngine.executarImportacao(
                    _arquivoBackupEmMemoria.dadosBrutos,
                    avaliacoes,
                    estrategia,
                    restaurarConfig,
                    _arquivoBackupEmMemoria.config,
                    _arquivoBackupEmMemoria.financeiro ?? null
                );

                fecharModalCentralBackup();
                switchTab('tab-historico');
                renderizarHistorico();
                preencherSeletoresComparacao();

                const msg = `✅ Restauração concluída! ${res.contadores.novos} nova(s) adicionada(s), ${res.contadores.atualizados} atualizada(s), ${res.contadores.ignorados} mantida(s). Total no banco: ${res.total}.`;
                if (window.efToast) efToast(msg);
                else alert(msg);

            } catch (err) {
                console.error('Erro na restauração:', err);
                alert('Erro durante a restauração: ' + err.message);
            } finally {
                if (btnConfirmar) {
                    btnConfirmar.disabled = false;
                    btnConfirmar.textContent = '🚀 Confirmar Restauração';
                }
            }
        }

        async function executarDesfazerUltimaImportacao() {
            if (!confirm('Deseja realmente desfazer a última restauração e voltar ao estado anterior de segurança?')) {
                return;
            }

            const res = await EF_BackupEngine.desfazerUltimaImportacao();
            if (!res.sucesso) {
                alert(res.erro || 'Não foi possível desfazer.');
                return;
            }

            atualizarUIModalBackup();
            renderizarHistorico();
            preencherSeletoresComparacao();

            const msg = `↩️ Restauração desfeita! O banco foi revertido para o estado anterior com ${res.total} avaliações.`;
            if (window.efToast) efToast(msg);
            else alert(msg);
        }

        async function criarSnapshotManual() {
            const ok = await EF_BackupEngine.salvarSnapshotSeguranca(avaliacoes);
            if (ok) {
                atualizarUIModalBackup();
                if (window.efToast) efToast('📸 Ponto de restauração manual criado com sucesso ✓');
                else alert('Ponto de restauração criado com sucesso!');
            } else {
                alert('Falha ao salvar ponto de restauração.');
            }
        }

        async function executarCopiarBackupClipboard() {
            if (avaliacoes.length === 0 && !(window.EFCobranca && (await EFCobranca.exportData()).length)) {
                alert('O banco de dados está vazio. Cadastre uma avaliação ou carregue dados de exemplo antes de copiar.');
                return;
            }

            const tipo = document.querySelector('input[name="bkp_tipo_export"]:checked')?.value || 'completo';
            const incluirConfig = document.getElementById('bkp-incluir-config')?.checked !== false;
            let filtroAluno = null;

            if (tipo === 'aluno') {
                filtroAluno = document.getElementById('bkp-select-aluno')?.value;
                if (!filtroAluno) {
                    alert('Selecione um aluno para exportar.');
                    return;
                }
            }

            const envelope = await EF_BackupEngine.gerarEnvelopeBackup(avaliacoes, {
                tipo: tipo,
                filtroAluno: filtroAluno,
                incluirConfig: incluirConfig
            });

            let jsonStr = JSON.stringify(envelope, null, 2);
            if (EF_Security.enabled && EF_Security.key) {
                const pacote = {
                    app: 'EvoluFísico', security: 'AES-256-GCM', version: 1, encrypted: true,
                    originalName: EF_BackupEngine.gerarNomeArquivo(tipo, filtroAluno), mimeType: 'application/json',
                    createdAt: new Date().toISOString(), payload: await EF_Security.encryptText(jsonStr)
                };
                jsonStr = JSON.stringify(pacote, null, 2);
            }
            function ok() {
                if (window.efToast) efToast('📋 Backup copiado para a área de transferência! ✓');
                else alert('✅ Backup JSON copiado para a área de transferência!');
            }
            function fallback() {
                const ta = document.createElement('textarea');
                ta.value = jsonStr;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                try {
                    document.execCommand('copy');
                    ok();
                } catch(e) {
                    alert('Não foi possível copiar automaticamente para a área de transferência.');
                }
                ta.remove();
            }

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(jsonStr).then(ok, fallback);
            } else {
                fallback();
            }
        }

        function alternarAreaColarJson(forcarEstado) {
            const container = document.getElementById('bkp-paste-container');
            const toggleBox = document.getElementById('bkp-paste-toggle-box');
            if (!container) return;
            const deveExibir = forcarEstado !== undefined ? forcarEstado : container.classList.contains('hidden');
            container.classList.toggle('hidden', !deveExibir);
            if (toggleBox) toggleBox.classList.toggle('hidden', deveExibir);
            if (deveExibir) {
                const ta = document.getElementById('bkp-textarea-paste');
                if (ta) { ta.value = ''; ta.focus(); }
            }
        }

        async function processarJsonColado() {
            const ta = document.getElementById('bkp-textarea-paste');
            const texto = ta ? ta.value.trim() : '';
            if (!texto) {
                alert('Cole o conteúdo JSON antes de prosseguir.');
                return;
            }
            await processarArquivoBackupTexto(texto, 'json_colado.json', texto.length);
            alternarAreaColarJson(false);
        }

        function configurarDragAndDropBackup() {
            const dropzone = document.getElementById('bkp-dropzone');
            if (!dropzone || dropzone._dragConfigured) return;
            dropzone._dragConfigured = true;

            ['dragenter', 'dragover'].forEach(eventName => {
                dropzone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropzone.classList.add('dragover');
                }, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropzone.classList.remove('dragover');
                }, false);
            });

            dropzone.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                const file = dt && dt.files && dt.files[0];
                if (file) {
                    lerEProcessarArquivoBackup(file);
                }
            }, false);
        }

        // BACKWARD COMPATIBILITY: importarBackupJSON(event)
        function importarBackupJSON(event) {
            const input = event.target;
            const file = input.files && input.files[0];
            if (!file) return;

            // Abre modal diretamente na aba de importar e processa o arquivo selecionado
            abrirModalCentralBackup('importar');
            lerEProcessarArquivoBackup(file);
            input.value = '';
        }


        async function carregarDadosExemplo(exibirAlerta = true) {
            function makeSvg(texto, bg, fg) {
                const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">
                    <rect width="100%" height="100%" fill="${bg}"/>
                    <circle cx="150" cy="85" r="35" fill="${fg}" opacity="0.85"/>
                    <path d="M110 130 C110 130 150 140 190 130 L205 240 L170 245 L175 350 L155 350 L150 270 L145 350 L125 350 L130 245 L95 240 Z" fill="${fg}" opacity="0.9"/>
                    <text x="150" y="380" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#ffffff">${texto}</text>
                </svg>`;
                return 'data:image/svg+xml;base64,' + btoa(svg);
            }

            const demo1 = {
                id: 'demo_pollock_1984',
                timestamp: '2026-08-31T10:00:00.000Z',
                nome: 'Carlos Mendes',
                email: 'carlos.mendes@email.com',
                whatsapp: '11977778888',
                sexo: 'M',
                idade: 33,
                altura: 183,
                peso: 97.4,
                data_avaliacao: '2026-08-31',
                data_proxima_avaliacao: '2026-12-30',
                checkin_semana: 'Semana 1',
                fase: 'Cutting',
                avaliador_nome: '',
                avaliador_registro: '',
                perimetria: {
                    pescoco: 41.5,
                    ombros: 133.2,
                    abdomen: 98.1,
                    cintura: 90.4,
                    quadril: 104.8,
                    braco_esq: 40.3,
                    braco_dir: 40.0,
                    coxa_esq: 66.0,
                    coxa_dir: 67.0,
                    panturrilha: 41.0
                },
                perimetria_soma: '722.3',
                dobras: {
                    triceps: 8.5,
                    subescapular: 23.0,
                    suprailiaca: 24.0,
                    peitoral: 9.0,
                    axilar: 12.0,
                    abdominal: 16.0,
                    coxa: 11.0
                },
                dobras_resultado: {
                    soma: '103.5',
                    densidade: '1.0634',
                    percGordura: '15.51',
                    massaGorda: '15.11',
                    massaMagra: '82.29',
                    classificacao: 'Bom (Fitness)'
                },
                bioimpedancia: {
                    peso: 97.4,
                    pgordura: 15.5,
                    pmusculo: 44.8,
                    imc: 29.1,
                    gordura_kg: 15.11,
                    mme: 82.29,
                    risco: 'Baixo Risco (Normal)',
                    rcq: 0.86,
                    tmb: 2050,
                    visceral: 6,
                    idade_corporal: 29,
                    analise_texto: 'Composição corporal atlética com boa densidade muscular. IMC aponta sobrepeso devido ao grande volume de massa muscular esquelética.'
                },
                cintura: 90.4, quadril: 104.8, braco_dir: 40.0, braco_esq: 40.3, coxa_dir: 67.0, coxa_esq: 66.0, panturrilha: 41.0,
                energia: 4, aderencia_treino: '100% no plano', aderencia_dieta: '100% no plano', desafio: 'Sim',
                observacoes: 'Iniciando protocolo de definição muscular moderada com ênfase na preservação da massa livre de gordura.',
                parecer_v6: {status:'Excelente',status_manual:false,score:100,tags:'Perda de gordura,Boa recuperação',sono:4,estresse:2,dor:'Nenhuma',meta_pgordura:12,meta_peso:null,meta_prazo:'2026-12-30',pontos_fortes:'Ótima base muscular e aderência total ao plano.',pontos_atencao:'Manter hidratação e sono em dia durante o cutting.',ajuste_treino:'Manter volume atual; progressão de carga nos básicos.',ajuste_dieta:'Sem alterações neste ciclo.',proximos_passos:'Reavaliar em 30 dias e acompanhar a cintura.'},
                parecer_profissional: 'Protocolo Pollock 1984 - 7 Dobras: Paciente apresenta 15.51% de gordura corporal com excelente base de massa magra (82.29kg). A relação cintura/quadril está em 0.86 (baixo risco cardiovascular). Reavaliação programada para 30/12/2026.',
                fotos: {
                    frente: makeSvg('31/08 - Frente', '#1e293b', '#64748b'),
                    lado: makeSvg('31/08 - Lado', '#1e293b', '#64748b'),
                    costas: makeSvg('31/08 - Costas', '#1e293b', '#64748b')
                }
            };

            const demo2 = {
                id: 'demo_pollock_reaval',
                timestamp: '2026-09-30T10:00:00.000Z',
                nome: 'Carlos Mendes',
                email: 'carlos.mendes@email.com',
                whatsapp: '11977778888',
                sexo: 'M',
                idade: 33,
                altura: 183,
                peso: 94.6,
                data_avaliacao: '2026-09-30',
                data_proxima_avaliacao: '2026-12-30',
                checkin_semana: 'Semana 4',
                fase: 'Cutting',
                avaliador_nome: '',
                avaliador_registro: '',
                perimetria: {
                    pescoco: 41.0,
                    ombros: 133.5,
                    abdomen: 94.0,
                    cintura: 87.0,
                    quadril: 103.0,
                    braco_esq: 40.5,
                    braco_dir: 40.4,
                    coxa_esq: 65.5,
                    coxa_dir: 66.0,
                    panturrilha: 41.0
                },
                perimetria_soma: '711.9',
                dobras: {
                    triceps: 7.5,
                    subescapular: 20.0,
                    suprailiaca: 20.5,
                    peitoral: 7.5,
                    axilar: 10.5,
                    abdominal: 13.5,
                    coxa: 10.0
                },
                dobras_resultado: {
                    soma: '89.5',
                    densidade: '1.0680',
                    percGordura: '13.50',
                    massaGorda: '12.77',
                    massaMagra: '81.83',
                    classificacao: 'Excelente (Atleta)'
                },
                bioimpedancia: {
                    peso: 94.6,
                    pgordura: 13.1,
                    pmusculo: 46.5,
                    imc: 28.2,
                    gordura_kg: 12.41,
                    mme: 82.2,
                    risco: 'Baixo Risco (Normal)',
                    rcq: 0.84,
                    tmb: 2040,
                    visceral: 5,
                    idade_corporal: 27,
                    analise_texto: 'Queda de 2.7kg exclusivamente em tecido adiposo. Preservação integral de massa muscular esquelética.'
                },
                cintura: 87.0, quadril: 103.0, braco_dir: 40.4, braco_esq: 40.5, coxa_dir: 66.0, coxa_esq: 65.5, panturrilha: 41.0,
                energia: 5, aderencia_treino: '100% no plano', aderencia_dieta: '100% no plano', desafio: 'Sim',
                observacoes: 'Definição abdominal muito mais aparente, redução no abdômen de 98.1cm para 94cm.',
                parecer_v6: {status:'Excelente',status_manual:false,score:98,tags:'Perda de gordura,Boa recuperação',sono:5,estresse:2,dor:'Nenhuma',meta_pgordura:12,meta_peso:null,meta_prazo:'2026-12-30',pontos_fortes:'Queda de 14 mm na soma das dobras com massa magra preservada.',pontos_atencao:'Manter hidratação e sono em dia durante o cutting.',ajuste_treino:'Manter volume atual; progressão de carga nos básicos.',ajuste_dieta:'Sem alterações neste ciclo.',proximos_passos:'Reavaliar em 30 dias e acompanhar a cintura.'},
                parecer_profissional: 'Evolução brilhante! Soma das 7 dobras reduziu 14mm (103.5 ➔ 89.5 mm) e o percentual de gordura caiu para 13.12% com 82.2kg de massa magra preservada. Manter o protocolo até a reavaliação de 30/12/2026.',
                fotos: {
                    frente: makeSvg('30/09 - Frente', '#0f172a', '#4f46e5'),
                    lado: makeSvg('30/09 - Lado', '#0f172a', '#4f46e5'),
                    costas: makeSvg('30/09 - Costas', '#0f172a', '#4f46e5')
                }
            };

            avaliacoes = avaliacoes.filter(a => !a.id.startsWith('demo_'));
            await salvarAvaliacaoNoDB(demo1);
            await salvarAvaliacaoNoDB(demo2);

            if (pastaHandle) {
                gravarAvaliacaoEmSubpasta(demo1);
                gravarAvaliacaoEmSubpasta(demo2);
            }

            switchTab('tab-historico');
        }

        function formatarData(dataIso) {
            if (!dataIso) return '';
            const limpa = String(dataIso).split('T')[0];
            const partes = limpa.split('-');
            if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
            return dataIso;
        }

        function iniciarAutoSave() {
            const form = document.getElementById('checkin-form');
            if (!form) return;

            form.addEventListener('input', () => {
                const editId = document.getElementById('avaliacao_id')?.value;
                if (editId) return;

                clearTimeout(autoSaveTimeout);
                autoSaveTimeout = setTimeout(() => {
                    const formData = new FormData(form);
                    const rascunho = Object.fromEntries(formData.entries());
                    delete rascunho.foto_frente;
                    delete rascunho.foto_perfil_direito;
                    delete rascunho.foto_perfil_esquerdo;
                    delete rascunho.foto_costas;
                    delete rascunho.foto_extra;
                    delete rascunho.foto_lado;
                    try {
                        if (EF_Security.enabled && EF_Security.key) EF_Security.encryptObject(rascunho).then(p => localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({__efEncrypted:true,payload:p}))); else localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(rascunho));
                    } catch(e) {}
                }, 3200);
            });

            verificarRascunhoExistente();
        }

        async function verificarRascunhoExistente() {
            try {
                const salvo = localStorage.getItem(AUTOSAVE_KEY);
                if (salvo) {
                    const raw = JSON.parse(salvo);
                    const obj = raw?.__efEncrypted ? await EF_Security.decryptObject(raw.payload) : raw;
                    if (obj.nome || obj.email || obj.peso) {
                        const alertEl = document.getElementById('draft-alert');
                        if (alertEl) alertEl.classList.remove('hidden');
                    }
                }
            } catch(e) {}
        }

        async function aplicarRascunho() {
            try {
                const salvo = localStorage.getItem(AUTOSAVE_KEY);
                if (!salvo) return;
                const raw = JSON.parse(salvo);
                const obj = raw?.__efEncrypted ? await EF_Security.decryptObject(raw.payload) : raw;
                const form = document.getElementById('checkin-form');
                Object.keys(obj).forEach(key => {
                    const el = form.elements[key];
                    if (el && el.type !== 'file') {
                        el.value = obj[key];
                    }
                });
                recalcularCamposAutomaticos();
                if (window.EF6) EF6.sincronizar();
                descartarRascunho();
                alert('Rascunho restaurado com sucesso no formulário!');
            } catch(e) {
                console.error('Erro ao restaurar rascunho:', e);
            }
        }

        function descartarRascunho() {
            clearTimeout(autoSaveTimeout);
            localStorage.removeItem(AUTOSAVE_KEY);
            const alertEl = document.getElementById('draft-alert');
            if (alertEl) alertEl.classList.add('hidden');
        }

        window.aplicarRascunho = aplicarRascunho;
        window.descartarRascunho = descartarRascunho;
        window.addEventListener('afterprint', () => {
            document.body.classList.remove('print-mode-single', 'print-mode-comparison');
        });

        window.abrirModalDetalhes = abrirModalDetalhes;
        window.fecharModalDetalhes = fecharModalDetalhes;
        window.editarDaModal = editarDaModal;
        window.imprimirAvaliacaoDaModal = imprimirAvaliacaoDaModal;
        window.imprimirAvaliacaoIndividualPDF = imprimirAvaliacaoIndividualPDF;
        window.imprimirComparativoPDF = imprimirComparativoPDF;
        window.gerarLaudoWeb = gerarLaudoWeb;
        window.fecharModalLaudoWeb = fecharModalLaudoWeb;
        window.copiarLinkLaudoWeb = copiarLinkLaudoWeb;
        window.compartilharViaWhatsApp = compartilharViaWhatsApp;
        window.abrirLaudoWebPaciente = abrirLaudoWebPaciente;
        window.abrirVisualizacaoPacienteWeb = abrirVisualizacaoPacienteWeb;
        window.fecharVisualizacaoPacienteWeb = fecharVisualizacaoPacienteWeb;
        window.imprimirDoPacienteWeb = imprimirDoPacienteWeb;
        window.mudarPoseSlider = mudarPoseSlider;
        window.alternarModoVisualizacaoFotos = alternarModoVisualizacaoFotos;
        window.switchTab = switchTab;
        window.excluirAvaliacao = excluirAvaliacao;
        window.salvarAvaliacaoNoDB = salvarAvaliacaoNoDB;
        window.deletarAvaliacaoDoDB = deletarAvaliacaoDoDB;
        window.exportarBackupJSON = exportarBackupJSON;
        window.importarBackupJSON = importarBackupJSON;
        window.abrirModalCentralBackup = abrirModalCentralBackup;
        window.fecharModalCentralBackup = fecharModalCentralBackup;
        window.alternarAbaBackup = alternarAbaBackup;
        window.selecionarTipoBackup = selecionarTipoBackup;
        window.executarDownloadBackup = executarDownloadBackup;
        window.aoSelecionarArquivoBackupModal = aoSelecionarArquivoBackupModal;
        window.cancelarArquivoBackupPreview = cancelarArquivoBackupPreview;
        window.confirmarImportacaoBackup = confirmarImportacaoBackup;
        window.executarDesfazerUltimaImportacao = executarDesfazerUltimaImportacao;
        window.criarSnapshotManual = criarSnapshotManual;
        window.executarCopiarBackupClipboard = executarCopiarBackupClipboard;
        window.alternarAreaColarJson = alternarAreaColarJson;
        window.processarJsonColado = processarJsonColado;
        window.EF_BackupEngine = EF_BackupEngine;
        window.carregarDadosExemplo = carregarDadosExemplo;
        window.conectarPastaBanco = conectarPastaBanco;
        window.previewAndCompressImage = previewAndCompressImage;
        window.filtrarAvaliacoes = filtrarAvaliacoes;
        window.calcularPollock7 = calcularPollock7;
        window.recalcularCamposAutomaticos = recalcularCamposAutomaticos;

        function obterDadosProfissionalPadrao() {
            return {
                nome: (localStorage.getItem('evolufisico_pro_nome') || document.getElementById('avaliador_nome')?.value || '').trim(),
                cref: (localStorage.getItem('evolufisico_pro_cref') || document.getElementById('avaliador_registro')?.value || '').trim(),
                clinica: (localStorage.getItem('evolufisico_pro_clinica') || document.getElementById('avaliador_clinica')?.value || '').trim()
            };
        }

        function abrirModalConfigProfissional() {
            const dados = obterDadosProfissionalPadrao();
            if (document.getElementById('cfg_pro_nome')) document.getElementById('cfg_pro_nome').value = dados.nome;
            if (document.getElementById('cfg_pro_cref')) document.getElementById('cfg_pro_cref').value = dados.cref;
            if (document.getElementById('cfg_pro_clinica')) document.getElementById('cfg_pro_clinica').value = dados.clinica;
            
            const modal = document.getElementById('modal-config-profissional');
            if (modal) modal.classList.remove('hidden');
        }

        function fecharModalConfigProfissional() {
            const modal = document.getElementById('modal-config-profissional');
            if (modal) modal.classList.add('hidden');
        }

        function salvarConfigProfissional() {
            const nome = (document.getElementById('cfg_pro_nome')?.value || '').trim();
            const cref = (document.getElementById('cfg_pro_cref')?.value || '').trim();
            const clinica = (document.getElementById('cfg_pro_clinica')?.value || '').trim();

            localStorage.setItem('evolufisico_pro_nome', nome);
            localStorage.setItem('evolufisico_pro_cref', cref);
            localStorage.setItem('evolufisico_pro_clinica', clinica);

            const elNome = document.getElementById('avaliador_nome');
            if (elNome && !elNome.value) elNome.value = nome;
            const elCref = document.getElementById('avaliador_registro');
            if (elCref && !elCref.value) elCref.value = cref;
            const elClinica = document.getElementById('avaliador_clinica');
            if (elClinica && !elClinica.value) elClinica.value = clinica;

            fecharModalConfigProfissional();
            alert('✅ Dados do profissional atualizados! O Nome e CREF serão inseridos no cabeçalho de todos os relatórios em PDF.');
        }

        window.abrirModalConfigProfissional = abrirModalConfigProfissional;
        window.fecharModalConfigProfissional = fecharModalConfigProfissional;
        window.salvarConfigProfissional = salvarConfigProfissional;

        function verificarRoteamentoHashLaudo() {
            if (window.location.hash && window.location.hash.includes('#laudo=')) {
                const id = window.location.hash.split('#laudo=')[1];
                if (id) {
                    setTimeout(() => {
                        abrirVisualizacaoPacienteWeb(id);
                    }, 250);
                }
            }
        }
        window.addEventListener('DOMContentLoaded', verificarRoteamentoHashLaudo);
        window.addEventListener('hashchange', verificarRoteamentoHashLaudo);

        document.addEventListener('DOMContentLoaded', () => {
            ['bia_imc', 'bia_gordura_kg', 'bia_mme'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.addEventListener('input', ev => {
                        ev.target.dataset.manual = ev.target.value ? '1' : '';
                    });
                }
            });
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (typeof fecharModalDetalhes === 'function') fecharModalDetalhes();
                if (typeof fecharModalConfigProfissional === 'function') fecharModalConfigProfissional();
                if (typeof fecharModalLaudoWeb === 'function') fecharModalLaudoWeb();
                if (typeof fecharVisualizacaoPacienteWeb === 'function') fecharVisualizacaoPacienteWeb();
                if (typeof fecharConfiguracaoCriptografia === 'function') fecharConfiguracaoCriptografia();
                document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => m.classList.add('hidden'));
            }
        });
