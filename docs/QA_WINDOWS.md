# QA Windows — EvoluFisico Desktop 9.0-beta

## Executado no ambiente de desenvolvimento (Linux)
- 28/28 scripts JS passaram em `node --check`.
- 56/56 referencias a assets no HTML resolvidas.
- 8/8 cenarios simulados de Service Worker aprovados.
- Regressao de limpeza de impressao aprovada.
- Os testes simulados **nao substituem** a execucao real do WebView2 ou geracao de PDF.

## GitHub Actions (Windows)
A automacao em `.github/workflows/windows-build.yml` agora:
1. valida os arquivos HTML/CSS/JS;
2. publica o aplicativo .NET 8 para Windows x64;
3. executa regressao offline e de impressao no frontend empacotado;
4. verifica executavel, icones e rotas;
5. publica o pacote **Portable** independentemente de o Inno Setup funcionar;
6. compila o instalador Inno Setup;
7. valida existencia e tamanho do instalador e mostra SHA-256;
8. publica o artefato **Setup**.

## Aceite pendente
- Confirmar uma execucao **verde** do workflow e baixar os artefatos.
- Abrir o .exe em Windows 10/11 com WebView2.
- Validar PDFs, impressao sem painel, persistencia, backup, restauracao e modo offline.
- Testar instalacao/desinstalacao e atualizacao sem perda de dados.

**Status:** nenhuma compilacao ou instalacao real foi confirmada nesta sessao. Nao classificar como release estavel.
