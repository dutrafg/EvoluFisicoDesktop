# Build Windows — EvoluFísico EFI Alpha

## Artefato

- Nome: `EvoluFisico_EFI_Alpha_Setup.exe`
- Workflow: [EFI AI Alpha Build Validation — run 40126487526](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40126487526)
- Commit de código compilado: `cbda289cbd590c9a256cea086a42cc8a79c9c679`
- Branch: `feature/efi-qwen35-2b-alpha`
- Ambiente: GitHub Actions `windows-latest`, .NET SDK 8.0.x, Inno Setup 6.
- Alvo: Windows x64.
- Tamanho do EXE: 62.882.955 bytes.
- SHA-256 do EXE: `7d6bed9c5d3552c23233298af65f67d39002c5afe450a60cc683687af4f96d7b`.
- Artefato Actions: [EvoluFisico_EFI_Alpha_Setup](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40126487526/artifacts/12573167609), ZIP SHA-256 `c485c0a25eef344810159d8ad7fbcc13c6d077da30ddadf3eafc7c6ced4f82ea`.
- Runtime llama.cpp CPU x64 incluído; pesos Qwen são baixados pelo gerenciador e não estão no instalador.

## Resultado de validação

O workflow passou nos testes de JavaScript, perfil, avaliação, identidade legada com backup, fixtures e campanha integrada de 10.000 cenários (1.000 execuções completas dos oito motores; 5.000 bloqueios para identidade/datas/série curta; 3.000 sinalizações ou supressões específicas; 0 exceções e 0 valores não finitos). Compilou o Desktop Windows, verificou a integração EFI e empacotou o runtime. O Inno Setup criou o EXE com o nome esperado. O smoke instalou em diretório temporário, verificou o executável, frontend, manifesto Alpha, runtime, painel EFI e fixtures e executou a desinstalação.

A validação ocorreu em runner Windows. Não comprova abertura manual do aplicativo, atualização sobre instalação Alpha anterior com dados, nem preservação de um banco real após desinstalação.

O run anterior `40124398686` compilou o instalador mas falhou porque o smoke ainda procurava o nome antigo. A busca foi corrigida; o run `40124552552` passou. O pacote mais recente foi verificado no run `40126487526`.

Não houve merge para `main`, release estável ou publicação de produção.
