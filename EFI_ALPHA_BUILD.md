# Build Windows — EvoluFísico EFI Alpha

## Artefato entregue

- Nome: `EvoluFisico_EFI_Alpha_Setup.exe`
- Build original: workflow **EFI AI Alpha Build Validation**, run [40122126889](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40122126889)
- Commit compilado: `39eac5834abd4e9208df5a4bbb43c00dc403684b`
- Branch: `feature/efi-qwen35-2b-alpha`
- Ambiente: GitHub Actions, `windows-latest`, .NET SDK 8.x, Inno Setup 6.
- Alvo: Windows x64.
- Tamanho do instalador: 62.877.615 bytes (aprox. 59,96 MiB).
- SHA-256 do EXE: `ad2a48ae67f7df985adb5c39d0122d22f71e23195a00a63f4d744b70f781fe45`.
- Artefato original do Actions: ZIP com o EXE; SHA-256 do ZIP informado pelo GitHub: `ce7b8fa6b634dff706bde7b81c97af8157e23b320c0f77a8af66de32e0366e72`.
- Runtime: llama.cpp CPU x64 incorporado no instalador. Pesos Qwen não estão no Setup e são baixados pelo gerenciador.

## Validação de build e instalação

O job Windows passou na compilação .NET, empacotamento do runtime e criação do Inno Setup. O smoke automatizado instalou silenciosamente numa pasta temporária, verificou executável e recursos Alpha (frontend, manifesto, runtime, painel EFI e fixtures) e executou a desinstalação silenciosa.

Isso comprova build e smoke de instalação/desinstalação no runner. Não comprova instalação in-place sobre Alpha anterior, abertura manual da interface, inicialização do banco com perfil real, atualização preservando dados, ou execução do Qwen pela janela instalada. Esses pontos permanecem no relatório de QA.

A execução de inferência real Qwen é evidenciada separadamente pelo workflow [40119653945](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40119653945), com download do GGUF e checagem de integridade antes da inferência CPU.

## Obter

O EXE foi extraído do artefato Actions da branch experimental; o arquivo entregue nesta conversa é cópia byte a byte do setup listado acima. Consulte a aba Actions da branch para o ZIP original e sua retenção. Não há publicação ou merge na `main`.
