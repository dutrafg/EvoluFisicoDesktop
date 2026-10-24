# Build Windows — EvoluFísico EFI Alpha

## Artefato

- Nome: `EvoluFisico_EFI_Alpha_Setup.exe`
- Workflow: [EFI AI Alpha Build Validation — run 40130819687](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40130819687)
- Commit de código compilado: `760fb46a7319c1c57493f6fde1b49e4516901396`
- Branch: `feature/efi-qwen35-2b-alpha`
- Ambiente: GitHub Actions `windows-latest`, .NET SDK 8.0.x, Inno Setup 6.
- Alvo: Windows x64.
- Tamanho do EXE: 62.873.454 bytes.
- SHA-256 do EXE: `812226940dbde3d009a79a5105f0e66a8cd5f209ba0cc4ab7b8ee8ec4872540d`.
- Artefato Actions: [EvoluFisico_EFI_Alpha_Setup](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40130819687/artifacts/12574679795), ZIP SHA-256 `643d2b78acbcf270a311d4572440904a17f38fbba9668ff9a00757fd1a1ec731`.
- Runtime llama.cpp CPU x64 incluído; pesos Qwen são baixados pelo gerenciador e não estão no instalador.

## Resultado de validação

O workflow passou nos testes de JavaScript, perfil, avaliação, identidade legada com backup, fixtures, teste de relatório obsoleto, smoke SQLite transacional e campanha integrada de 10.000 cenários (1.000 execuções completas dos oito motores; 5.000 bloqueios para identidade/datas/série curta; 3.000 sinalizações ou supressões específicas; 0 exceções e 0 valores não finitos). Compilou o Desktop Windows, verificou a integração EFI e empacotou o runtime. O Inno Setup criou o EXE com o nome esperado. O smoke instalou em diretório temporário, verificou o executável, frontend, manifesto Alpha, runtime, painel EFI e fixtures; iniciou o aplicativo, confirmou o processo ativo por 8 segundos, encerrou-o e concluiu a desinstalação.

A validação ocorreu em runner Windows. O smoke confirma a inicialização do processo; não comprova abertura visual interativa, atualização sobre instalação Alpha anterior com dados, nem preservação de um banco real após desinstalação.

O smoke SQLite também cobriu rollback, backup/restauração, adulteração e recusa de bancos com schema futuro. O run anterior `40124398686` compilou o instalador mas falhou porque o smoke ainda procurava o nome antigo. A busca foi corrigida; o run `40124552552` passou. O pacote mais recente foi verificado no run `40130819687`.

Não houve merge para `main`, release estável ou publicação de produção.
