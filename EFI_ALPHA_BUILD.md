# Build Windows — EvoluFísico EFI Alpha

## Artefato

- Nome: `EvoluFisico_EFI_Alpha_Setup.exe`
- Workflow: [EFI AI Alpha Build Validation — run 40125997101](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40125997101)
- Commit de código compilado: `af0584fff5819c3cd09c42e77efa66d600cedf7f`
- Branch: `feature/efi-qwen35-2b-alpha`
- Ambiente: GitHub Actions `windows-latest`, .NET SDK 8.0.x, Inno Setup 6.
- Alvo: Windows x64.
- Tamanho do EXE: 62.882.080 bytes.
- SHA-256 do EXE: `9e826f0ac02c25160b6dbc33a21bc6c782686108f44524c2877e6880283a22a5`.
- Artefato Actions: [EvoluFisico_EFI_Alpha_Setup](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40125997101/artifacts/12573236668), ZIP SHA-256 `4cf9217d800ee85d12920dc55b80de4bd3c33f586e03ca712e7f4713fd9fd94f`.
- Runtime llama.cpp CPU x64 incluído; pesos Qwen são baixados pelo gerenciador e não estão no instalador.

## Resultado de validação

O workflow passou nos testes de JavaScript, perfil, avaliação, identidade legada com backup, fixtures e campanha integrada de 10.000 cenários (1.000 execuções completas dos oito motores; 5.000 bloqueios de segurança; 0 exceções e 0 valores não finitos). Compilou o Desktop Windows, verificou a integração EFI e empacotou o runtime. O Inno Setup criou o EXE com o nome esperado. O smoke instalou em diretório temporário, verificou o executável, frontend, manifesto Alpha, runtime, painel EFI e fixtures e executou a desinstalação.

A validação ocorreu em runner Windows. Não comprova abertura manual do aplicativo, atualização sobre instalação Alpha anterior com dados, nem preservação de um banco real após desinstalação.

O run anterior `40124398686` compilou o instalador mas falhou porque o smoke ainda procurava o nome antigo. A busca foi corrigida; o run `40124552552` passou. O pacote mais recente foi verificado no run `40125997101`.

Não houve merge para `main`, release estável ou publicação de produção.
