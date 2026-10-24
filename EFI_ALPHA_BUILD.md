# Build Windows — EvoluFísico EFI Alpha

## Artefato

- Nome: `EvoluFisico_EFI_Alpha_Setup.exe`
- Workflow: [EFI AI Alpha Build Validation — run 40124552552](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40124552552)
- Commit de código compilado: `6de5dd77587a04a3bda0d572c492effb80316a79`
- Branch: `feature/efi-qwen35-2b-alpha`
- Ambiente: GitHub Actions `windows-latest`, .NET SDK 8.0.x, Inno Setup 6.
- Alvo: Windows x64.
- Tamanho do EXE: 62.881.116 bytes.
- SHA-256 do EXE: `0bee3caa751860e9c8402a5376cabeaf702b342e8a254704827df74501e2fd6b`.
- Artefato Actions: [EvoluFisico_EFI_Alpha_Setup](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40124552552/artifacts/12572383875), ZIP SHA-256 `e1bc59d191d872ce7a3493d54b1189d25136bd79f893109d180f408456acb148`.
- Runtime llama.cpp CPU x64 incluído; pesos Qwen são baixados pelo gerenciador e não estão no instalador.

## Resultado de validação

O workflow passou nos testes de JavaScript, perfil, avaliação e fixtures; compilou o Desktop Windows, verificou a integração EFI e empacotou o runtime. O Inno Setup criou o EXE com o nome esperado. O smoke instalou em diretório temporário, verificou o executável, frontend, manifesto Alpha, runtime, painel EFI e fixtures e executou a desinstalação.

A validação ocorreu em runner Windows. Não comprova abertura manual do aplicativo, atualização sobre instalação Alpha anterior com dados, nem preservação de um banco real após desinstalação.

O run anterior `40124398686` compilou o instalador mas falhou porque o smoke ainda procurava o nome antigo. A busca foi corrigida e o run `40124552552` passou integralmente.

Não houve merge para `main`, release estável ou publicação de produção.
