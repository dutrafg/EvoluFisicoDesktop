# Matriz de paridade — EvoluFísico2 × Desktop EFI Alpha

Referências consultadas em 24/10/2026: EvoluFísico2 `main@b45a1f74`, Desktop estável `main@242649d` e Alpha `feature/efi-qwen35-2b-alpha@d53963e`. O `main` Web não avançou além de `b45a1f7` nesta rodada.

| Módulo/área | Estado na Alpha | Diferença e trabalho restante |
|---|---|---|
| Início | Parcial | Cards e organização existentes; regressões de layout, empacotamento e redimensionamento passaram no Node. Ainda falta homologar visualmente widgets e gestos em WebView2. |
| Alunos / Perfil Unificado | Parcial; primeira tela integrada | Busca, ordenação, histórico e métricas agrupam pelo `cliente_id`. Registros sem ID não são agrupados ou alterados ao ler. Migração assistida por avaliação permite criar ou selecionar um ID após confirmação e backup obrigatório. Falta migração em lote, homologação manual e centralização persistente completa de outros dados. |
| Avaliações | Parcial; seis etapas presentes | Objetivos está na etapa 2 e persiste/recupera seleção e observações. Falta homologação integral de protocolos, validação, cálculos, fotos, relatórios e invalidação de análises derivadas. |
| Evolução | Parcial | Histórico e comparações existem; cronologia, invalidação de análises dependentes e PDF precisam de homologação Windows. |
| Calculadora / Laboratório | Parcial/implementado | EF77 e laboratório estão conectados; verificar paridade atual de entradas, protocolos e limites com o Web. |
| Formulários / Anamnese | Parcial | Há fluxos existentes; testes de formulário/anamnese, SQLite e vínculo com cliente passaram; persistência completa e PDF do formulário ainda precisam de homologação no app instalado. |
| Análises / motores EFIA | Parcial | Oito componentes EF68/70/77/78–82 existem. Campanhas Desktop de 10.000 e 30.000 passaram; a campanha de 30 mil portada da Web rodou 60.000 pipelines e 166.500 assertions: 18.000 elegíveis, 12.000 bloqueados e 21.000 execuções dos oito motores, sem falhas, mutações de entrada, saídas não finitas ou divergências de determinismo. O log contém aviso isolado `EF77: ponto de montagem não encontrado`, pendente de revisão. Invalidação persistida de pareceres e validação científica externa pendem. |
| EFI Intelligence / Qwen | Parcial; inferência real em CI | Runtime CPU e gerenciador existem; inferência sintética real Q4_K_M foi executada em workflow separado; processo desktop iniciado no smoke de Windows, fluxo EFI/Qwen ainda precisa homologação interativa. Falta validação dos estados de instalação/erro/cancelamento pelo produto. |
| Cobranças | Parcial | Histórico financeiro existente; vínculo com perfil e paridade recente precisam de testes. |
| Organização | Parcial | Agenda/tarefas/metas existem; resumo e recorrências passaram em testes automatizados. Persistência completa e uso interativo em WebView2 ainda precisam de homologação. |
| Configurações | Parcial | Temas, paleta, segurança, manutenção e atualização nativa existem; regressão da paleta passou, mas faltam auditoria visual integral e opções EFI/Qwen em interface instalada. |
| Backup e restauração | Presente, homologação incompleta | Implementações nativas existem; restauração, compatibilidade de formatos antigos e preservação em atualização pendem. |
| Navegação e personalização | Parcial | Sidebar, cores e cards existem; ainda falta validação de layouts/miniapps atuais no Windows. |
| Relatórios e PDF | Parcial | Relatórios nativos existem; rascunho obsoleto após alteração de estado agora bloqueia PDF e preserva as edições, com teste automatizado. Faltam verificação A4, separação privado/compartilhável e impressão manual. |
| Armazenamento e segurança | Parcial; SQLite nativo | SQLite transacional criptografado via ponte WebView2 é ativo para registros nativos; `StorageSmoke` passou em Windows, incluindo rollback, backup/restauração, adulteração e bloqueio de schema futuro. Vínculo legado de identidade exige confirmação e backup. Migração real das fontes IndexedDB/LocalStorage e homologação com perfil existente pendem. |
| Atualizações e manutenção | Parcial | Atualizador existe; atualização Alpha sobre Alpha preservando dados não foi testada. |
| Temas claro/escuro | Portadas correções recentes; homologação pendente | Regras Web de confirmação de avaliação escura e contraste foram integradas e passaram teste automatizado. Falta auditoria visual de todas as janelas/telas WebView2. |
| Privacidade/LGPD | Parcial | Criptografia e minimização de prompt estão previstas; revisar logs, consentimento, backup e compartilhamento. |

## Classificação

“Implementado” significa que o código existe ou um teste específico passou. “Parcial” indica função presente com equivalência, integração ou homologação ainda incompleta. Build e testes estáticos não contam como homologação visual.


## Adendo de paridade EvoluFísico2 3.0 — rodada 25/10/2026

| Módulo / mudança da Web 3.0 | Estado Desktop EFI Alpha 3.0 | Evidência / limite |
|---|---|---|
| Dashboard Secretária (agenda, pendências, retornos, próxima ação, resumo financeiro) | **Portado e validado por regressão** | Usa registros e rotas Desktop existentes; CI Windows #136 passou. |
| Perfil Unificado como destino de retornos e reavaliações | **Integrado à navegação existente** | Links do painel direcionam para Alunos/Perfil Unificado. |
| Ação Nova avaliação no cabeçalho da Home | **Alinhado à Web 3.0** | Removida do cabeçalho; continua disponível no perfil do aluno. |
| Tema, layout responsivo e teclado | **Regressões automatizadas aprovadas** | Testes cobrem tema escuro, telas compactas e foco por teclado; não substituem inspeção manual por DPI. |
| Agenda, cobranças, evolução e dados de alunos existentes | **Reutilizados** | Sem substituição por dados simulados; fixtures de demonstração seguem identificadas e isoladas. |

Referência Web: commit 3.0 `a2877ae189c5f3953396ea4cf196aed3f9eb1cc5`; ponta consultada `80bca6d7d3eba916ca02d5c3ac28604cb1e65ce2`. Branch Windows: `feature/efi-qwen35-2b-alpha`, commit final de código/build `5727343fef7b97bdc5d34c18d77508a5cc9d8669`. Este adendo cobre a rodada de dashboard; os demais estados e pendências por módulo descritos nesta matriz permanecem válidos.
