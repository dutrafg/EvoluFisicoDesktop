# EvoluFisico Desktop 9.0

Projeto de migração do EvoluFisico 9.0-beta para Windows com C#/.NET 8, WPF e WebView2.

**Status:** estrutura inicial; ainda não é instalador funcional. O frontend original 9.0 precisa ser incluído em `src/EvoluFisico.Desktop/wwwroot/` e validado.

## Compilar no Windows

Instale .NET 8 SDK, Microsoft Edge WebView2 Runtime e Inno Setup 6. Execute `powershell -ExecutionPolicy Bypass -File scripts/build-windows.ps1` e compile `installer/EvoluFisico.iss` no Inno Setup.

A versão Web e o repositório EvoluFisico estável não serão alterados por este projeto.
