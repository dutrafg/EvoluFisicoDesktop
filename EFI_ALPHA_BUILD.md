# Build Windows — EvoluFísico EFI Alpha

## Artefato

- Nome: `EvoluFisico_EFI_Alpha_Setup.exe`
- Workflow: [EFI AI Alpha Build Validation — run 40132081529](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40132081529)
- Commit compilado: `cdae50309127f652ae7ef1cf72dadfd74b3ec04b`
- Branch: `feature/efi-qwen35-2b-alpha`
- Ambiente: GitHub Actions, Windows Server 2025 / `windows-latest`, .NET SDK 8.0.x, Node 22 e Inno Setup 6.
- Alvo: Windows x64.
- Tamanho do EXE: 62.879.269 bytes.
- SHA-256 do EXE: `be48837a570ee8678fe39e40643a8ee94f7abb08054f2cf4f5f08666a1f4e5eb`.
- Artefato Actions: [EvoluFisico_EFI_Alpha_Setup](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40132081529/artifacts/12575352445), ZIP 62.391.516 bytes, SHA-256 `ce98162c165c29b72beb27ec3c686ac43cdfe34fe6016fd29c87a9275ba03e40`.
- Runtime llama.cpp CPU x64 incluído; pesos Qwen baixados pelo gerenciador, não incluídos. Artefato retido até 07/11/2026.
- [Baixar o instalador no GitHub Actions](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40132081529/artifacts/12575352445).

## Resultado de validação

O run passou as verificações de JavaScript, perfil, avaliação em seis etapas, migração legada, formulários/storage/cobrança, regressões de Home/agenda/toque/privacidade/paleta, rascunho de relatório, smoke SQLite, fixtures e campanhas EFIA de 10.000 e 30.000 cenários. A campanha de 30.000 executou 60.000 pipelines e 166.500 assertions: 18.000 históricos elegíveis, 12.000 bloqueados e 21.000 execuções com os oito motores; 0 falhas, mutações de entrada, saídas não finitas ou divergências de determinismo.

A compilação Windows x64 e o empacotamento do runtime passaram. O smoke instalou o EXE em diretório temporário, conferiu arquivos e manifesto Alpha, iniciou `EvoluFisico.Desktop.exe`, confirmou o processo ativo por 8 segundos, fechou o processo e concluiu desinstalação. Isso valida o build e ciclo automatizado básico no runner; não comprova interface visual interativa nem atualização sobre Alpha anterior com dados reais.

O log da campanha registrou mensagem isolada `EF77: ponto de montagem não encontrado`; o passo terminou com sucesso e todas as assertions passaram. A mensagem é esperada no harness headless: o `EF77.mount()` procura `.nav-tabs` e `#tab-comparison`, ausentes no Node VM. A montagem visual interativa no WebView2 continua sem homologação.

Inferência real sintética Qwen3.5-2B Q4_K_M em CPU e checksum passaram no workflow separado [40119653945](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40119653945). Isso não é homologação clínica ou validação do fluxo EFI/Qwen dentro do aplicativo instalado.

Não houve merge para `main`, release estável ou publicação de produção. A Alpha ainda não satisfaz os critérios para RC-1 documentados em QA/paridade.
