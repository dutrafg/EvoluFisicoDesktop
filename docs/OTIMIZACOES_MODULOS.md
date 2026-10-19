# Revisao tecnica de modulos — EvoluFisico Desktop 9.0

## Implementado neste ciclo
- **Atualizacoes:** cada build agora gera `wwwroot/desktop-version.json` com revisao Git; o aplicativo compara o identificador instalado ao da release publicada e evita sugerir a mesma build.
- **Seguranca da navegacao:** links de instaladores so sao abertos no navegador padrao quando apontam para o caminho oficial de releases do repositorio `dutrafg/EvoluFisicoDesktop`.
- **Preservacao de dados:** nao foram modificados os formatos de armazenamento de avaliacoes ou backups.

## Melhorias prioritarias (a validar antes de implementar)
1. **Atualizacoes:** comparar numero semantico (`9.0.0-beta.1`, `beta.2` etc.) alem da revisao; baixar com verificacao SHA-256 e confirmacao explicita antes da instalacao.
2. **Avaliacoes:** teste de criar/editar/excluir com persistencia apos reiniciar; revisar desempenho com muitos registros.
3. **PDF:** testes reais no WebView2 para cada relatorio, verificando CSS de impressao e ausencia de menu lateral.
4. **Backup e seguranca:** exportar/restaurar dados em perfil de teste; validar integridade e tratamento de senha.
5. **Agenda e cobrancas:** verificar estados vazios, validacao de formulario, datas, valores e atualizacao da interface.
6. **Desempenho:** medir tempo de inicializacao, memoria do WebView2 e custo do script `05-app-runtime.js` antes de dividir em modulos.
7. **Acessibilidade:** verificar navegacao por teclado, contraste, zoom do Windows e leitores de tela.

## Limites de validacao
O pipeline testa sintaxe JS, recursos offline, limpeza de impressao, compilacao e instalacao silenciosa. **Nao comprova** o comportamento funcional completo dos modulos nem a integridade de PDFs produzidos por usuario. Homologacao manual em Windows continua obrigatoria.
