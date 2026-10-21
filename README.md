# EvoluFisico Desktop 9.1.1.beta.4

Migração para Windows com C#/.NET 8, WPF e WebView2.

## Estado
Frontend HTML/CSS/JavaScript 9.0-beta integrado ao repositório (arquivos de texto). Os ícones PNG ainda não foram incorporados. A compilação e execução Windows dependem de confirmação no GitHub Actions; **não declarar instalador validado antes do artefato e testes**.

## Build
Requer Windows x64, .NET 8 SDK, WebView2 Runtime e Inno Setup 6.

1. Execute `powershell -ExecutionPolicy Bypass -File scripts/build-windows.ps1`
2. Compile `installer/EvoluFisico.iss` com Inno Setup.
3. Ou consulte Actions > Windows Desktop Build para o pacote de instalação.

## Segurança dos dados
O WebView2 utiliza perfil em `%LOCALAPPDATA%\EvoluFisicoDesktop\WebView2`. Não exclua esse diretório sem exportar seus dados. Persistência e impressão ainda exigem testes em Windows.

O projeto não altera os repositórios EvoluFisico e Evolufisico2.

## Correções da versão 9.1-beta

O painel Cobranças permanece no menu principal, mesmo com Diagnóstico em Configurações > Manutenção. A barra de navegação em telas menores usa duas linhas para mostrar os módulos sem esconder funções. Foram preservados o SQLite criptografado, o recebimento pendente e as nove anamneses.
