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
