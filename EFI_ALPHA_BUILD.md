# Build Windows — EvoluFísico EFI Alpha

## Artefato

- Nome: `EvoluFisico_EFI_Alpha_Setup.exe`
- Workflow: [EFI AI Alpha Build Validation — run 40131660142](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40131660142)
- Commit de código compilado: `d53963eab7afdf071f294b6a4f2d7db23cc2c552`
- Branch: `feature/efi-qwen35-2b-alpha`
- Ambiente: GitHub Actions `windows-latest`, .NET SDK 8.0.x, Inno Setup 6.
- Alvo: Windows x64.
- Tamanho do EXE: 62.875.894 bytes.
- SHA-256 do EXE: `c2b19475de0216bba8860ae3e75b11f682973f63318a4d3e326bf87d327e5e60`.
- Artefato Actions: [EvoluFisico_EFI_Alpha_Setup](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40131660142/artifacts/12575121766), ZIP SHA-256 `6cc9390d7206539b6db7c5a9f5f16914ba6a925cb586761a12d18f15b40c5d3c`.
- Runtime llama.cpp CPU x64 incluído; pesos Qwen são baixados pelo gerenciador e não estão no instalador.

## Resultado de validação

O workflow passou nos testes de JavaScript, perfil, avaliação, identidade legada, formulários, armazenamento nativo, regressões de agenda/Início/paleta, teste de relatório obsoleto, smoke SQLite transacional, fixtures e campanha integrada de 10.000 cenários (1.000 execuções completas dos oito motores; 5.000 bloqueios para identidade/datas/série curta; 3.000 sinalizações ou supressões específicas; 0 exceções e 0 valores não finitos). Compilou o Desktop Windows, verificou a integração EFI e empacotou o runtime. O Inno Setup criou o EXE com o nome esperado. O smoke instalou em diretório temporário, verificou o executável, frontend, manifesto Alpha, runtime, painel EFI e fixtures; iniciou o aplicativo, confirmou o processo ativo por 8 segundos, encerrou-o e concluiu a desinstalação.

A validação ocorreu em runner Windows. O smoke confirma a inicialização do processo; não comprova abertura visual interativa, atualização sobre instalação Alpha anterior com dados, nem preservação de um banco real após desinstalação.

O smoke SQLite também cobriu rollback, backup/restauração, adulteração e recusa de bancos com schema futuro. O Node aprovou os testes de formulário/anamnese, avaliação/cobrança, agenda, layout do Início, rolagem por toque, privacidade e paleta. O run anterior `40124398686` compilou o instalador mas falhou porque o smoke ainda procurava o nome antigo. A busca foi corrigida; o run `40124552552` passou. O pacote mais recente foi verificado no run `40131660142`.

Não houve merge para `main`, release estável ou publicação de produção.
