# EvoluFísico Desktop RC-5 — mini barra lateral com ícones

**Relato de teste:** usuário informou que no modo minimizado os ícones não aparecem (captura de 26/10/2026).

## Correção
- Nova folha \`assets/css/80-desktop-sidebar-compact.css\` ativa **somente em largura ≥1200px e no estado \`ef-sidebar-hidden\`**, mantendo o modo expandido e dispositivos menores sem interferência.
- Sidebar colapsa para 80px; cada módulo mantém seu ícone SVG de 26px centralizado em um botão de 54×50px.
- Esconder textos apenas no estado minimizado, incluindo rótulos em nós de texto direto; manter descrição acessível com \`aria-label\` e \`title\`.
- Esconder legenda do logotipo e o título visual “ÁREA DE TRABALHO” no modo compacto, mantendo logotipo.
- Ajustar deslocamento da área de trabalho e do cabeçalho para 80px; reverter automaticamente quando expandir.
- Preservar ícones únicos da RC-4 e tratamento de splash da RC-3.
- Inserir CSS no precache offline com novo identificador RC-5.

## Verificação
- Playwright Chromium local: 5 temas × 2 modos claro/escuro × 2 estados da sidebar × 9 ícones.
- No desktop, 9/9 SVGs com largura ≥25px, sidebar 80px e área de trabalho alinhada.
- Integrar teste \`tests/windows-compact-sidebar-rc5.cjs\` ao GitHub Actions, além de todos os testes de regressão existentes.
- Não houve alteração nos componentes C# do SQLite, cofre, backup ou análises.
- Versão interna Windows 1.0.12 RC-5; Web 3.1.19 é apenas a base das melhorias, **não paridade funcional integral**.
