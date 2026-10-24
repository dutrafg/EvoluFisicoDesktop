# Build Windows — EvoluFísico EFI Alpha

## Artefato

- Nome: `EvoluFisico_EFI_Alpha_Setup.exe`
- Workflow: [EFI AI Alpha Build Validation — run 40125310587](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40125310587)
- Commit de código compilado: `a6c0d9afc4e9a06bd307a923f0c57d4110fc2422`
- Branch: `feature/efi-qwen35-2b-alpha`
- Ambiente: GitHub Actions `windows-latest`, .NET SDK 8.0.x, Inno Setup 6.
- Alvo: Windows x64.
- Tamanho do EXE: 62.873.929 bytes.
- SHA-256 do EXE: `d9652fa6cf430e3b41ee2fae696db6b8cecb9539551c3ecffae2c8766273bd03`.
- Artefato Actions: [EvoluFisico_EFI_Alpha_Setup](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40125310587/artifacts/12573575151), ZIP SHA-256 `590508030daeacefc2b3dbf26fe6f237e21f8852e1cac16dceda4237f8d7bc35`.
- Runtime llama.cpp CPU x64 incluído; pesos Qwen são baixados pelo gerenciador e não estão no instalador.

## Resultado de validação

O workflow passou nos testes de JavaScript, perfil, avaliação, identidade legada com backup e fixtures; compilou o Desktop Windows, verificou a integração EFI e empacotou o runtime. O Inno Setup criou o EXE com o nome esperado. O smoke instalou em diretório temporário, verificou o executável, frontend, manifesto Alpha, runtime, painel EFI e fixtures e executou a desinstalação.

A validação ocorreu em runner Windows. Não comprova abertura manual do aplicativo, atualização sobre instalação Alpha anterior com dados, nem preservação de um banco real após desinstalação.

O run anterior `40124398686` compilou o instalador mas falhou porque o smoke ainda procurava o nome antigo. A busca foi corrigida; o run `40124552552` passou e o pacote mais recente foi verificado no run `40125310587`.

Não houve merge para `main`, release estável ou publicação de produção.
