# Build Windows — EvoluFísico EFI Alpha

## Artefato

- Nome: `EvoluFisico_EFI_Alpha_Setup.exe`
- Workflow: [EFI AI Alpha Build Validation — run 40128372330](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40128372330)
- Commit de código compilado: `08eee52b8d3c889b01d1a11491d04337563be5fb`
- Branch: `feature/efi-qwen35-2b-alpha`
- Ambiente: GitHub Actions `windows-latest`, .NET SDK 8.0.x, Inno Setup 6.
- Alvo: Windows x64.
- Tamanho do EXE: 62.878.870 bytes.
- SHA-256 do EXE: `59d07a5401942d2e830698a399617086a5119072881a89b323da610c23e15a9b`.
- Artefato Actions: [EvoluFisico_EFI_Alpha_Setup](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40128372330/artifacts/12573799254), ZIP SHA-256 `22eac248c8fdedf4f1e3885f3fac6977171bc42d3f9dab517d61900301746d72`.
- Runtime llama.cpp CPU x64 incluído; pesos Qwen são baixados pelo gerenciador e não estão no instalador.

## Resultado de validação

O workflow passou nos testes de JavaScript, perfil, avaliação, identidade legada com backup, fixtures, teste de relatório obsoleto e campanha integrada de 10.000 cenários (1.000 execuções completas dos oito motores; 5.000 bloqueios para identidade/datas/série curta; 3.000 sinalizações ou supressões específicas; 0 exceções e 0 valores não finitos). Compilou o Desktop Windows, verificou a integração EFI e empacotou o runtime. O Inno Setup criou o EXE com o nome esperado. O smoke instalou em diretório temporário, verificou o executável, frontend, manifesto Alpha, runtime, painel EFI e fixtures; iniciou o aplicativo, confirmou o processo ativo por 8 segundos, encerrou-o e concluiu a desinstalação.

A validação ocorreu em runner Windows. O smoke confirma a inicialização do processo; não comprova abertura visual interativa, atualização sobre instalação Alpha anterior com dados, nem preservação de um banco real após desinstalação.

O run anterior `40124398686` compilou o instalador mas falhou porque o smoke ainda procurava o nome antigo. A busca foi corrigida; o run `40124552552` passou. O pacote mais recente foi verificado no run `40128372330`.

Não houve merge para `main`, release estável ou publicação de produção.
