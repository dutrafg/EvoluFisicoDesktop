# Plataformas e distribuições — EvoluFisico Desktop 9.0-beta

## Windows (implementação atual)
A implementação atual é **WPF + .NET 8 + WebView2**, com alvo `net8.0-windows` e publicação `win-x64`. A versão **Portable** e o instalador Inno Setup destinam-se **somente ao Windows x64**.

- Portable: pasta publicada com `EvoluFisico.Desktop.exe`, dependências e `wwwroot`. **Não** é um executável único.
- Instalador: `EvoluFisicoDesktop-9.0-Setup.exe`.
- WebView2 Runtime é necessário para a interface.
- Nenhum artefato Windows foi confirmado como compilado/testado nesta sessão.

## Linux e macOS
O aplicativo WPF não é compatível com Linux ou macOS. Não tente executar o pacote Windows nesses sistemas esperando funcionamento nativo.

## Caminho para multiplataforma
Manter a versão Windows atual isolada e avaliar uma **segunda interface Tauri** que reutilize o frontend Web 9.0 (HTML/CSS/JS). Tauri depende de Rust e webviews nativas: WebView2 no Windows, WebKitGTK no Linux e WKWebView no macOS. Exigirá validação separada de impressão PDF, Service Worker, armazenamento offline e permissões.

**Não existe ainda uma versão Tauri construída, validada ou publicada.** Não substituir a versão Windows estável por um protótipo multiplataforma.

## Lembrete para fase futura: Avalonia UI

**Decisão de roadmap:** concluir primeiro o EvoluFisico Desktop para Windows (WPF + WebView2), sem trocar a tecnologia nesta fase. **Depois que a versão Windows estiver instalável, validada e estável**, reavaliar **Avalonia UI + .NET** como alternativa para criar versões nativas de Windows, Linux e macOS.

Na avaliação futura, comparar Avalonia UI e Tauri considerando reaproveitamento do frontend HTML/CSS/JS, esforço de migração, funcionamento offline, armazenamento local, geração de PDF, acessibilidade e distribuição em cada sistema. Não iniciar a migração antes de concluir a homologação Windows.

## Destino Linux definido (2026-10-19)
- Distribuição planejada: **Debian/Ubuntu `.deb`**, com interface integrada ao **GTK4**.
- WPF/WebView2 é específico do Windows. Para Linux, avaliar **GTK4 + WebKitGTK** (reutilização de HTML/CSS/JS) com host nativo, ou GTK4 com componentes próprios. Não assumir que Avalonia é GTK4.
- Separar contratos de armazenamento/criptografia do host Windows antes do porte. **DPAPI não existe no Linux**: integrar Secret Service/libsecret ou chave derivada de senha mestre, com migração portátil testada e recuperação.
- Validar dependências `.deb`, arquitetura amd64, sandbox/permissões, impressão PDF, backup/restauração e persistência SQLite em GTK4.
- Manter o aplicativo Windows funcional e sem alteração destrutiva do IndexedDB até migração transacional validada.
