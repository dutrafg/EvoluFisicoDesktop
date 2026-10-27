# EvoluFísico Desktop — RC-3: correção do splash travado

## Sintoma
No Windows a aplicação permanece na tela "Inicializando módulos clínicos…" sem avançar.

## Diagnóstico reproduzido
Na RC-2, `70-desktop-themes.js` compara uma string de HTML de SVG (`<path .../>`) com `holder.innerHTML`, cujo formato serializado no Chromium é `<path ...></path>`.
Quando algum módulo atualiza a navegação, o `MutationObserver` dispara, reescreve o SVG, observa sua própria alteração e entra em um ciclo de microtarefas, impedindo o `setTimeout` de fechar o splash.

Reprodução automatizada:
- Script original RC-2: teste falha (`SVG MutationObserver loop starves splash timer`).
- Após a correção: teste passa; splash é fechado e removido da visualização.
- Teste independente no Chromium via Playwright confirmou `dismissed` e `display:none` após 1,75 s.

## Mudanças
- Cache da identidade de cada SVG em `data-ef-theme-icon`; renderizar novamente somente se o ícone desejado mudar ou estiver ausente.
- Teste `tests/windows-splash-deadlock-rc3.cjs` no pipeline Windows, sem dependência externa.
- Build RC-3 separado da `main` e sem publicação de release estável.
- Instalação preserva identidade e SQLite nativo; nenhum arquivo de dados ou ponte C# foi alterado.

## Limitações
A reprodução foi feita em Chromium/Linux com os mesmos arquivos HTML/JS; o teste Windows CI valida build, instalador, regressões e instalação silenciosa, mas não cobre toda a interface WebView2 com dados pessoais. Testar com backup, preferencialmente perfil isolado. A paridade completa com EvoStore, Perfil Unificado e outros módulos 3.1.19 ainda não foi atingida.
