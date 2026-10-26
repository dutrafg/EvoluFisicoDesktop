# RC-4 — Correção de ícones duplicados da navegação Windows

**Origem:** imagem de teste do usuário da RC-3 (26/10/2026). O painel esquerdo exibia ícones antigos por `::before` junto com ícones SVG adicionados pelo módulo 70-desktop-themes.js.

## Causa
- O CSS legado `25-ficha-viva.css` desenha máscaras em todos os `.nav-tab-btn::before`.
- O `52-home-dashboard.css` tem seletores específicos para Início e Organização.
- O novo sistema de temas acrescenta SVG via `.ef-local-nav-icon` sem desativar a máscara legada. Isso gerava duas imagens por item (com exceções anteriores como Análises e Configurações).

## Correção
- Novo marcador `data-ef-theme-icon-visible="1"` apenas nos botões que possuem SVG temático instalado.
- Camada CSS final remove o ícone legado com especificidade suficiente para Início e Organização; se o JavaScript não carregar, o ícone antigo continua disponível.
- Organização recebeu ícone temático próprio. Preservado o cérebro existente do módulo Análises, sem substituição.
- Mantido o ajuste da RC-3 que impede reescrever SVG sem necessidade, evitando loop de observação e bloqueio do splash.
- Cache offline invalidado com versão RC-4. C# nativo, bridge SQLite, cofre, banco, backup e relatórios não modificados.

## Verificação
- Reproduzido no Chromium com CSS e scripts da RC-3: seis duplicações nos nove módulos da imagem.
- A correção foi testada nos cinco temas, em modo claro e escuro: um ícone por item e splash encerrado normalmente.
- Teste Node independente `tests/windows-nav-single-icon-rc4.cjs` integra o pipeline GitHub Actions.
- Esta RC é incremental; não equivale à migração total da Web 3.1.19. Manter `main` protegida até testes do usuário.
