# Primeiro teste do instalador Windows — EvoluFisico Desktop 9.0-beta

## Como obter o arquivo
1. Abrir https://github.com/dutrafg/EvoluFisicoDesktop/actions.
2. Selecionar uma execucao de **Windows Desktop Build** com status verde.
3. Na secao **Artifacts**, baixar **EvoluFisicoDesktop-9.0-Windows-Setup** (instalador) ou **EvoluFisicoDesktop-9.0-Windows-Portable** (pasta portatil).
4. Extrair o ZIP do artefato. Na versao portatil, preservar **todos** os arquivos e subpastas; executar `EvoluFisico.Desktop.exe`.

**Se a execucao estiver vermelha, nao presumir que o instalador foi gerado.** Verificar a primeira etapa com falha e seu log.

## Verificacao no computador Windows
- Instalar o Setup e abrir o EvoluFisico Desktop.
- Caso o WebView2 Runtime esteja ausente, instalar o componente oficial da Microsoft.
- Conferir navegacao entre modulos e tema claro/escuro.
- Criar um registro de teste, fechar e abrir novamente e confirmar persistencia.
- Testar PDF de cada relatorio; confirmar que o painel principal nao aparece no PDF.
- Exportar backup, restaurar em ambiente de teste e verificar integridade.
- Desconectar a internet, reiniciar o aplicativo e conferir dados e interface.
- Desinstalar o aplicativo e confirmar que nao afetou a instalacao web nem os dados de outras aplicacoes.

## Dados e seguranca
O perfil de navegacao do WebView2 usa `%LOCALAPPDATA%\\EvoluFisicoDesktop\\WebView2`. Nao apagar essa pasta durante testes sem ter um backup dos dados. O instalador nao deve modificar o repositorio estavel do EvoluFisico.

## Estado atual
Este documento orienta testes futuros. **Nao foi confirmada nesta sessao uma compilacao Windows concluida ou um instalador funcional.**
