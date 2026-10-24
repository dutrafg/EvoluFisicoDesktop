# EvoluFísico Desktop — correção do contraste da avaliação (24/10/2026)

## Escopo
Repositório funcional: `dutrafg/EvoluFisicoDesktop`, linha Desktop 1.0.12.
Mudanças preparadas em branch isolada; `main` não é modificada antes de revisão.

## Evidências das capturas
1. A confirmação de salvamento mostrava um painel branco com texto quase branco, incluindo a mensagem de persistência e botões secundários.
2. As barras de soma perimétrica e antropométrica apareciam claras, com labels ilegíveis.
3. Os painéis de resumo do check-in, bem-estar, metas e parecer usavam fundos brancos fixos sob tipografia do tema escuro.
4. O aviso de edição, o quadro destacado de parecer e os cartões de foto também usavam estilos claros fixos.

## Alterações
- Novo CSS terminal `assets/css/68-desktop-dark-assessment-contrast.css`, limitado à aba `#tab-novo-checkin` e às duas formas suportadas de ativação do tema escuro.
- Superfícies baseadas nas variáveis do tema ativo (`--ef-surface`, `--ef-page`, `--ef-line`, `--ef-ink`, `--ef-muted`); somente alertas semânticos usam cores de atenção fixas.
- Contrastes explícitos em título, dados secundários, cartões de resultado, chips, valores e botões da confirmação de salvamento.
- Estilos de impressão/PDF mantidos: regras novas somente em `@media screen`.
- Precache `sw.js` atualizado, com invalidação de versão para não reutilizar CSS antigo.
- Teste de regressão Node.js e fluxo isolado de QA em pull requests.

## Validação executada
- Inspeção do HTML e regras CSS funcionais do repositório.
- Conferência programática da ordem das folhas: a correção é carregada por último.
- Conferência programática da presença da folha no precache.
- Verificação da estrutura dos seletores e dos pares de cor de texto/fundo (razões de contraste entre 8,56:1 e 14,23:1 nos exemplos fixos; mínimo WCAG AA 4,5:1).
- Não foram alterados cálculos antropométricos, funções de bioimpedância, SQLite, backup ou gerador de PDF.

## Homologação pendente
- Executar o novo teste do repositório no runner de CI e confirmar a conclusão do fluxo de PR.
- Validar visualmente no Windows/WebView2 real, com temas claro e escuro, paletas diferentes, edição e criação de avaliação, navegação em cinco etapas, salvamento, reabertura e PDF.
- Confirmar persistência de dados e comportamento de atualização no instalador Windows antes de publicar versão estável.
