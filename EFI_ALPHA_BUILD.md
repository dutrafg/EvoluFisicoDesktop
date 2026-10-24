# Build Windows — EvoluFísico EFI Alpha

## Artefato

- Nome: `EvoluFisico_EFI_Alpha_Setup.exe`
- Workflow: [EFI AI Alpha Build Validation — run 40126910352](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40126910352)
- Commit de código compilado: `2767f8817ee6c9f07556945b330381edfb68c2ef`
- Branch: `feature/efi-qwen35-2b-alpha`
- Ambiente: GitHub Actions `windows-latest`, .NET SDK 8.0.x, Inno Setup 6.
- Alvo: Windows x64.
- Tamanho do EXE: 62.880.829 bytes.
- SHA-256 do EXE: `f769ed21e7902a781a6efa42d43301170e096aca3a75cce5cf5889d26af52f25`.
- Artefato Actions: [EvoluFisico_EFI_Alpha_Setup](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40126910352/artifacts/12573562984), ZIP SHA-256 `c4c5d3b602617cab1de1d4d4e101865b31629c238539176b25acc213416710dc`.
- Runtime llama.cpp CPU x64 incluído; pesos Qwen são baixados pelo gerenciador e não estão no instalador.

## Resultado de validação

O workflow passou nos testes de JavaScript, perfil, avaliação, identidade legada com backup, fixtures e campanha integrada de 10.000 cenários (1.000 execuções completas dos oito motores; 5.000 bloqueios para identidade/datas/série curta; 3.000 sinalizações ou supressões específicas; 0 exceções e 0 valores não finitos). Compilou o Desktop Windows, verificou a integração EFI e empacotou o runtime. O Inno Setup criou o EXE com o nome esperado. O smoke instalou em diretório temporário, verificou o executável, frontend, manifesto Alpha, runtime, painel EFI e fixtures e iniciou o executável e confirmou o processo ativo por 8 segundos, encerrou o aplicativo e executou a desinstalação.

A validação ocorreu em runner Windows. O smoke confirma a inicialização do processo; não comprova abertura visual interativa, atualização sobre instalação Alpha anterior com dados, nem preservação de um banco real após desinstalação.

O run anterior `40124398686` compilou o instalador mas falhou porque o smoke ainda procurava o nome antigo. A busca foi corrigida; o run `40124552552` passou. O pacote mais recente foi verificado no run `40126910352`.

Não houve merge para `main`, release estável ou publicação de produção.
